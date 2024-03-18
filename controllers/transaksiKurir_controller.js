const { transaksi_kurir } = require('../models/index');
const tamuModel = require('../models/index').tamu;
const transaksiKurirSiswaModel = require('../models/index').transaksi_kurirSiswa;
const transaksiKurirGuruModel = require('../models/index').transaksi_kurirGuru;
const siswaModel = require('../models/index').siswa;
const guruModel = require('../models/index').guru;
const otpModel = require('../models/index').otp;
const otpGenerator = require('otp-generator');
const speakeasy = require('speakeasy')
const { Op } = require(`sequelize`)
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const multer = require('multer');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const wa = require('@open-wa/wa-automate')
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)
require('moment-timezone');

const deleteOldData = async () => {
    try {
        const today = moment().date();
        const dayOfMonth = 1;
        
        // Jika hari ini lebih besar dari tanggal 8, maka gunakan bulan berikutnya
        const targetMonth = today >= dayOfMonth ? moment().add(1, 'months') : moment();
        
        // Set tanggal menjadi 1
        targetMonth.date(dayOfMonth);
        
        const targetDate = targetMonth.format('YYYY-MM-DD HH:mm:ss');
        
        console.log('Tanggal penghapusan otomatis:', targetDate);

        const result = await transaksi_kurir.destroy({
            where: {
                createdAt: {
                    [Op.lt]: targetDate,
                },
            },
        });

        console.log('Baris yang dihapus:', result);

        console.log('Data lama berhasil dihapus');
    } catch (error) {
        console.error('Error saat menghapus data lama:', error);
    }
};

cron.schedule('0 0 1 * *', async () => {
    console.log('Cron job untuk penghapusan otomatis dimulai');
    await deleteOldData();
    console.log('Penghapusan otomatis selesai');
});


exports.getAllMoklet = async (request, response) => {
    try {
        const allSiswa = await siswaModel.findAll();
        const allGuru = await guruModel.findAll();
        const allData = [...allSiswa, ...allGuru];

        return response.json({
            success: true,
            data: {
                data: allData
            },
            message: 'All students and teachers data loaded successfully',
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: error.message });
    }
}

exports.getAllTransaksiKurir = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const ITEMS_PER_PAGE = parseInt(request.query.limit) || 5;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        const filterOptions = {};

        // Tambahkan filter berdasarkan tanggal jika startDate diberikan
        const startDate = request.query.startDate;

        if (startDate) {
            const startOfDay = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const endOfDay = moment(startDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

            filterOptions.tanggal_dititipkan = {
                [Op.between]: [startOfDay, endOfDay],
            };
        }

        const searchQuery = request.query.search;
        if (searchQuery) {
            // Ubah searchQuery menjadi huruf kecil
            const lowercaseSearchQuery = searchQuery.toLowerCase();

            filterOptions[Op.or] = [
                { '$tamu.nama_tamu$': { [Op.iLike]: `%${lowercaseSearchQuery}%` } },
                { '$siswa.nama_siswa': { [Op.iLike]: `%${lowercaseSearchQuery}%` } },
                { '$guru.nama_guru': { [Op.iLike]: `%${lowercaseSearchQuery}%` } }
            ];
        }

        let transaksiKurir = await transaksi_kurir.findAndCountAll({
            offset: offset,
            limit: ITEMS_PER_PAGE,
            where: filterOptions,
            include: [
                {
                    model: tamuModel,
                    require: true
                },
                {
                    model: transaksiKurirGuruModel,
                    require: true
                },
                {
                    model: transaksiKurirSiswaModel,
                    require: true
                }
            ],
        });

        const totalItems = transaksiKurir.count;

        // if (totalItems === 0) {
        //     return response.status(404).json({
        //         success: false,
        //         message: 'Data not found'
        //     });
        // }

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (transaksiKurir.rows.length === 0) {
            return response.status(404).json({
                success: false,
                message: "Data masih belum ada"
            });
        }

        const transformedData = transaksiKurir.rows.map(row => {
            const { id_transaksiKurir, asal_instansi, tanggal_dititipkan, tanggal_diterima, foto, status, createdAt, updatedAt, tamu, transaksi_kurirGuru, transaksi_kurirSiswa } = row;

            const yangDiterima = {
                nama: (transaksi_kurirGuru && transaksi_kurirGuru.nama_guru) || (transaksi_kurirSiswa && transaksi_kurirSiswa.nama_siswa),
                email: (transaksi_kurirGuru && transaksi_kurirGuru.email) || (transaksi_kurirSiswa && transaksi_kurirSiswa.email)
            };

            return {
                id_transaksiKurir,
                asal_instansi,
                tanggal_dititipkan,
                tanggal_diterima,
                foto,
                status,
                createdAt,
                updatedAt,
                tamu,
                yangDiterima,
            };
        });

        return response.status(200).json({
            success: true,
            data: transformedData,
            pagination: {
                currentPage: page,
                totalItems: totalItems,
                totalPages: totalPages,
            },
            message: 'All transaction data siswa have been loaded'
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: error.message });
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendOTPByEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Kode OTP untuk verifikasi',
            text: `Kode OTP Anda adalah: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        console.log('Email OTP terkirim');
    } catch (error) {
        console.error('Gagal mengirim email OTP', error);
        throw new Error('Gagal mengirim emal OTP');
    }
};

const generateOTP = () => {
    return otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
};

const verifyOTP = (otp, inputOTP) => {
    return otp === inputOTP;
};

exports.addTransaksiKurir = (request, response) => {
    upload(request, response, async (error) => {
        if (error) {
            return response.json({ message: error });
        }

        if (!request.file) {
            return response.json({ message: `Nothing to Upload` });
        }

        const generatedOTP = generateOTP();

        let newTamu = {
            id_tamu: uuidv4(),
            nama_tamu: request.body.nama_tamu,
            no_tlp: request.body.no_tlp,

        };
        let newTransaksiKurir = {
            id_transaksiKurir: uuidv4(),
            id_tamu: newTamu.id_tamu,
            asal_instansi: request.body.asal_instansi,
            tanggal_dititipkan: new Date(),
            tanggal_diterima: request.body.tanggal_diterima,
            foto: request.file.filename,
            status: "Proses",
            otp: generatedOTP

        };
        let newTransaksiKurirGuru = {
            id_kurirGuru: uuidv4(),
            id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
            id_guru: request.body.id_guru
        };
        let newTransaksiKurirSiswa = {
            id_kurirSiswa: uuidv4(),
            id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
            id_siswa: request.body.id_siswa
        };
        try {
            await tamuModel.create(newTamu);
            await transaksi_kurir.create(newTransaksiKurir);

            if (request.body.id_guru) {
                const guru = await guruModel.findOne({
                    where: { id_guru: request.body.id_guru }
                });
                if (guru) {
                    // Menggunakan nomor telepon dari data Guru
                    await transaksiKurirGuruModel.create(newTransaksiKurirGuru);
                }
            }

            if (request.body.id_siswa) {
                const siswa = await siswaModel.findOne({
                    where: { id_siswa: request.body.id_siswa, email : email }
                });
                if (siswa) {
                    // Menggunakan nomor telepon dari data Siswa
                    await transaksiKurirSiswaModel.create(newTransaksiKurirSiswa);
                }
            }

            if (request.body.id_guru) {
                const transaksiKurirGuru = await transaksiKurirGuruModel.findOne({
                    where: { id_guru: request.body.id_guru }
                });

                if (transaksiKurirGuru) {
                    const guru = await guruModel.findOne({
                        where: { id_guru: transaksiKurirGuru.id_guru }
                    });

                    if (guru && guru.email) {
                        await sendOTPByEmail(guru.email, generatedOTP);
                    }
                }
            }

            if (request.body.id_siswa) {
                const transaksiKurirSiswa = await transaksiKurirSiswaModel.findOne({
                    where: { id_siswa: request.body.id_siswa }
                });

                if (transaksiKurirSiswa) {
                    const siswa = await siswaModel.findOne({
                        where: { id_siswa: transaksiKurirSiswa.id_siswa }
                    });

                    if (siswa && siswa.email) {
                        await sendOTPByEmail(siswa.email, generatedOTP);
                    }
                }
            }


            return response.json({
                success: true,
                message: `Kode OTP telah dikirim melalui email dan Form telah ditambahkan`
            });
        } catch (error) {
            return response.json({
                success: false,
                message: error.message
            });
        }
    });
};

exports.verifyOTP = async (request, response) => {
    const { id_transaksiKurir, inputOTP } = request.body;

    try {
        const transaksiKurir = await transaksi_kurir.findOne({
            where: { id_transaksiKurir }
        });

        if (!transaksiKurir) {
            return response.json({ success: false, message: 'Transaksi kurir ditemukan' });
        }

        if (verifyOTP(transaksiKurir.otp, inputOTP)) {
            await transaksi_kurir.update({ status: 'Selesai' }, {
                where: { id_transaksiKurir }
            });

            return response.json({ success: true, message: 'Kode OTP berhasil diverifikasi' });
        } else {
            return response.json({ success: false, message: 'Kode OTP tidak valid' });
        }
    } catch (error) {
        return response.json({ success: false, message: error.message });
    }
};


exports.updateTransaksiKurir = async (request, response) => {
    upload(request, response, async (err) => {
        if (err) {
            return response.json({ message: err });
        }

        let id_transaksiKurir = request.params.id;
        let dataTransaksiKurir = {};

        if (!request.file) {
            dataTransaksiKurir = {
                asal_instansi: request.body.asal_instansi,
                tanggal_dititipkan: new Date(),
                tanggal_diterima: request.body.tanggal_diterima,
                status: request.body.status
            };
        } else {
            const selectedTransaksiKurir = await transaksi_kurir.findOne({
                where: { id_transaksiKurir: id_transaksiKurir },
            });

            if (!selectedTransaksiKurir) {
                return response.json({
                    success: false,
                    message: 'Transaksi Kurir not found',
                });
            }

            const oldFotoTransaksiKurir = selectedTransaksiKurir.foto;
            const pathImage = path.join(__dirname, `../foto`, oldFotoTransaksiKurir);

            if (fs.existsSync(pathImage)) {
                fs.unlink(pathImage, (error) => console.log(error));
            }
            dataTransaksiKurir = {
                asal_instansi: request.body.asal_instansi,
                tanggal_dititipkan: new Date(),
                tanggal_diterima: request.body.tanggal_diterima,
                foto: request.file.filename,
                status: request.body.status
            };
        }
        transaksi_kurir.update(dataTransaksiKurir, { where: { id_transaksiKurir: id_transaksiKurir } })
            .then((result) => {
                return response.json({
                    success: true,
                    message: `Data Form has been updated`,
                });
            })
            .catch((error) => {
                return response.json({
                    success: false,
                    message: error.message,
                });
            });
    });
};
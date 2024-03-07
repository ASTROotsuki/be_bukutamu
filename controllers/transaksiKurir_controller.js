const { transaksi_kurir } = require('../models/index');
const tamuModel = require('../models/index').tamu;
const transaksiKurirSiswaModel = require('../models/index').transaksi_kurirSiswa;
const transaksiKurirGuruModel = require('../models/index').transaksi_kurirGuru;
const { sendOTP, verifyOTP } = require('../otpService');
const siswaModel = require('../models/index').siswa;
const guruModel = require('../models/index').guru;
const otpModel = require('../models/index').otp;
const otpGenerator = require('otp-generator');
const { Op } = require(`sequelize`)
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
        const oneMonthAgo = moment().subtract(1, 'months').format('YYYY-MM-DD HH:mm:ss');
        console.log('oneMonthAgo');

        const result = await transaksi_kurir.destroy({
            where: {
                createdAt: {
                    [Op.lt]: oneMonthAgo,
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


const sendOTPController = async (req, res) => {
    const { email } = req.body;

    try {
        const siswa = await siswaModel.findOne({ where: { email } });
        const guru = await guruModel.findOne({ where: { email } });

        if (siswa || guru) {
            // Jika email ditemukan di antara siswa atau guru
            await sendOTP(email);
            return res.status(200).json({ message: 'OTP berhasil dikirim melalui email.' });
        } else {
            return res.status(404).json({ message: 'Pengguna dengan email tersebut tidak ditemukan.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

const verifyOTPController = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const isVerified = await verifyOTP(email, otp);

        if (isVerified) {
            return res.status(200).json({ message: 'Verifikasi OTP berhasil.' });
        } else {
            return res.status(400).json({ message: 'Verifikasi OTP gagal.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};


const getAllMoklet = async (request, response) => {
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

const getAllTransaksiKurir = async (request, response) => {
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
                nama: (transaksi_kurirGuru && transaksi_kurirGuru.nama) || (transaksi_kurirSiswa && transaksi_kurirSiswa.nama),
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

const addTransaksiKurir = (request, response) => {
    upload(request, response, async (error) => {
        if (error) {
            return response.json({ message: error });
        }

        if (!request.file) {
            return response.json({ message: `Nothing to Upload` });
        }

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
            status: "Proses"

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

            const ultramsg = require('ultramsg-whatsapp-api');
            const instance_id = "instance1409" // Ultramsg.com instance id
            const ultramsg_token = "64be34eeb56d7"  // Ultramsg.com token
            const api = new ultramsg(instance_id, ultramsg_token);

            if (request.body.id_guru) {
                const guru = await guruModel.findOne({
                    where: { id_guru: request.body.id_guru }
                });
                if (guru) {
                    // Menggunakan nomor telepon dari data Guru
                    await transaksiKurirGuruModel.create(newTransaksiKurirGuru);
                    await api.sendChatMessage(guru.no_tlp, `New form created!`)
                    console.log(response)
                }
            }

            if (request.body.id_siswa) {
                const siswa = await siswaModel.findOne({
                    where: { id_siswa: request.body.id_siswa }
                });
                if (siswa) {
                    // Menggunakan nomor telepon dari data Siswa
                    await transaksiKurirSiswaModel.create(newTransaksiKurirSiswa);
                    await api.sendChatMessage(siswa.no_tlp, `New form created!`)
                    console.log(response)
                }
            }


            return response.json({
                success: true,
                message: `New form has been inserted`
            });
        } catch (error) {
            return response.json({
                success: false,
                message: error.message
            });
        }
    });
};


const updateTransaksiKurir = async (request, response) => {
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

const updateTransaksiKurirStatus = async (request, response) => {
    const { id_transaksiKurir, status } = request.body;

    try {
        const transaksi = await transaksi_kurir.findOne({
            where: { id_transaksiKurir }
        });

        if (!transaksi) {
            return response.json({
                success: false,
                message: `Transaksi dengan ID ${id_transaksiKurir} tidak ditemukan`
            });
        }

        transaksi.status = status;
        await transaksi.save();

        return response.json({
            success: true,
            message: `Transaksi dengan ID ${id_transaksiKurir} status updated to ${status}`
        });
    } catch (error) {
        return response.json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { sendOTPController, verifyOTPController, getAllMoklet, getAllTransaksiKurir, addTransaksiKurir, updateTransaksiKurir, updateTransaksiKurirStatus };
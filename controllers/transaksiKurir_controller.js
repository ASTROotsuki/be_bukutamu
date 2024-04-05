const { transaksi_kurir } = require('../models/index')
const tamuModel = require('../models/index').tamu
const transaksiKurirSiswaModel = require('../models/index').transaksi_kurirSiswa
const transaksiKurirGuruModel = require('../models/index').transaksi_kurirGuru
const siswaModel = require('../models/index').siswa;
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const guruModel = require('../models/index').guru
const multer = require('multer');
const moment = require('moment');
const otpModel = require('../models/index').otp;
const otpGenerator = require('otp-generator');
const { Op } = require(`sequelize`)
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)

const dotenv = require('dotenv')
const db = require('../models/index')
dotenv.config();



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
                { '$siswa.nama_siswa$1': { [Op.iLike]: `%${lowercaseSearchQuery}%` } },
                { '$guru.nama_guru$': { [Op.iLike]: `%${lowercaseSearchQuery}%` } }
            ];
        }

        // Ambil data transaksiKurirGuru dan transaksiKurirSiswa
        const [transaksiKurirGuru, transaksiKurirSiswa] = await Promise.all([
            transaksiKurirGuruModel.findAll({ limit: ITEMS_PER_PAGE, offset: offset }),
            transaksiKurirSiswaModel.findAll({ limit: ITEMS_PER_PAGE, offset: offset })
        ]);

        // Gabungkan data transaksiKurirGuru dan transaksiKurirSiswa menjadi satu array
        const transaksiKurir = [...transaksiKurirGuru, ...transaksiKurirSiswa];

        const totalItems = transaksiKurir.length;

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (transaksiKurir.length === 0) {
            return response.status(404).json({
                success: false,
                message: "Data masih belum ada"
            });
        }

        const transformedData = transaksiKurir.map(row => {
            const { id_transaksiKurir, asal_instansi, tanggal_dititipkan, tanggal_diterima, foto, status, createdAt, updatedAt, tamu } = row;
        
            let id_moklet;
            if (row instanceof transaksiKurirGuruModel) {
                id_moklet = row.id_guru;
            } else if (row instanceof transaksiKurirSiswaModel) {
                id_moklet = row.id_siswa;
            }
        
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
                id_moklet
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


exports.updateTransaksiKurirStatus = async (request, response) => {
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

        let newTransaksiKurirGuru = {};
        let newTransaksiKurirSiswa = {};

        if (request.body.id_moklet) {
            const idMoklet = request.body.id_moklet;

            const guru = await guruModel.findOne({ where: { id_guru: idMoklet } });
            const siswa = await siswaModel.findOne({ where: { id_siswa: idMoklet } });

            if (guru) {
                newTransaksiKurirGuru = {
                    id_kurirGuru: uuidv4(),
                    id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
                    id_guru: idMoklet
                };
                await sendOTPByEmail(guru.email, generatedOTP);
            } else if (siswa) {
                newTransaksiKurirSiswa = {
                    id_kurirSiswa: uuidv4(),
                    id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
                    id_siswa: idMoklet
                };
                await sendOTPByEmail(siswa.email, generatedOTP);
            }
        }
        try {
            await tamuModel.create(newTamu);
            await transaksi_kurir.create(newTransaksiKurir);

            if (newTransaksiKurirGuru.id_kurirGuru) {
                await transaksiKurirGuruModel.create(newTransaksiKurirGuru);
            }

            if (newTransaksiKurirSiswa.id_kurirSiswa) {
                await transaksiKurirSiswaModel.create(newTransaksiKurirSiswa);
            }


            return response.json({
                success: true,
                message: `Kode OTP telah dikirim melalui email dan New form has been inserted`
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
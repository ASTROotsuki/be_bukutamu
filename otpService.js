const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { Op } = require('sequelize');
const siswaModel = require('./models/index').siswa;
const guruModel = require('./models/index').guru;
const transaksiKurirModel = require('./models/index').transaksi_kurir
const otpModel  = require('./models/index').otp;


const sendOTP = async (email, id_transaksiKurir) => {
    try {
        // Generate OTP
        const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        // Simpan OTP ke database atau sesuai kebutuhan Anda
        await otpModel.update({ otp }, { where: { email, id_transaksiKurir } });

        // Kirim email
        const transporter = nodemailer.createTransport({
            // Ganti dengan konfigurasi SMTP yang sesuai
            host: 'gmail',
            port: 465,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verification OTP',
            text: `Your OTP: ${otp}`,
        });

        console.log('OTP berhasil dikirim melalui email.');
        return true;
    } catch (error) {
        console.error('Gagal mengirim OTP:', error.message);
        return false;
    }
};

const verifyOTP = async (email, otp, id_transaksiKurir) => {
    try {
        // Cari email di model siswa
        let userModel = siswaModel;
        let user = await userModel.findOne({
            where: {
                email,
                id_transaksiKurir,
                // Sesuaikan dengan kebutuhan, misalnya: updatedAt: { [Op.gte]: new Date(new Date() - 5 * 60 * 1000) }
            },
        });

        // Jika tidak ditemukan, coba di model guru
        if (!user) {
            userModel = guruModel;
            user = await userModel.findOne({
                where: {
                    email,
                    id_transaksiKurir,
                    // Sesuaikan dengan kebutuhan
                },
            });
        }

        if (user) {
            // Clear OTP setelah verifikasi berhasil
            await otpModel.update({ otp: null }, { where: { email, id_transaksiKurir } });
            console.log('OTP berhasil diverifikasi.');
            return true;
        } else {
            console.log('Verifikasi OTP gagal: Kombinasi email dan OTP tidak valid.');
            return false;
        }
    } catch (error) {
        console.error('Gagal verifikasi OTP:', error.message);
        return false;
    }
};

module.exports = { sendOTP, verifyOTP };
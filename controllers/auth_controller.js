const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/index').admin;
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const resetPasswordToken = require('../models/index').reset_passwords;
const bodyParser = require('body-parser');
const db = require('../models');
require('dotenv').config();

const generateToken = (adminData) => {
    return jwt.sign({ id_admin: adminData.id_admin, role: adminData.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const adminData = await adminModel.findOne({ where: { email } });

        if (!adminData) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, adminData.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = generateToken(adminData);

        return res.status(200).json({ success: true, logged: true, nama: adminData.nama_admin, token});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getAdminById = async (id_admin) => {
    try {
        return await adminModel.findByPk(id_admin, { attribute: { exclude: ['password'] } });
    } catch (error) {
        throw error;
    }
};

const updateAdminProfile = async (req, res) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
  
    if (!token) {
        return res.status(401).json({ error: 'Tidak diizinkan' });
    }
  
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const adminData = await getAdminById(decodedToken.id_admin);
        
        if (!adminData) {
            return res.status(404).json({ message: 'Admin tidak ditemukan' });
        }
  
        // Perbarui data admin berdasarkan body permintaan
        adminData.nama_admin = req.body.nama_admin || adminData.nama_admin;
        adminData.email = req.body.email || adminData.email;
        adminData.role = req.body.role || adminData.role;
        adminData.no_tlp = req.body.no_tlp || adminData.no_tlp;
  
        // Cek apakah password disediakan dalam permintaan
        if (req.body.password) {
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            adminData.password = hashedPassword;
        }
  
        // Menggunakan multer, cek apakah ada file yang diunggah
        if (req.file) {
            // Simpan foto yang diunggah ke model admin
            adminData.foto = req.file.filename; // Simpan file dalam bentuk buffer atau sesuai kebutuhan
        }
  
        // Simpan data admin yang diperbarui
        await adminData.save();
  
        // Kembalikan data admin yang diperbarui
        return res.status(200).json(adminData);
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Token tidak valid' });
    }
  };
  
  
  const profile = async (req, res) => {
    if (req.method === 'GET') {
      // Tangani permintaan GET untuk mengambil data profil
      const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
  
      if (!token) {
        return res.status(401).json({ error: 'Tidak diizinkan' });
      }
  
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const adminData = await getAdminById(decodedToken.id_admin);
  
        if (!adminData) {
          return res.status(404).json({ message: 'Admin tidak ditemukan' });
        }
  
        return res.status(200).json(adminData);
      } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Token tidak valid' });
      }
    } else if (req.method === 'PUT') {
      // Tangani permintaan PUT untuk memperbarui data profil
      await updateAdminProfile(req, res);
    } else {
      return res.status(405).json({ message: 'Metode Tidak Diizinkan' });
    }
  };

const forgotPassword = async (request, response) => {
    try {
        const { email } = request.body;

        if (!email) {
            return response.status(400).json({
                message: 'Email harus diisi'
            });
        }

        const existingUser = await adminModel.findOne({ where: { email } });
        if (!existingUser) {
            return response.status(404).json({
                message: 'Pengguna dengan email tersebut tidak ditemukan'
            });
        }

        const token = generateUniqueToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        console.log(resetPasswordToken);
        await resetPasswordToken.create({
            uuid: generateUniqueUUID(),
            email: email,
            token: token,
            expires_at: expiresAt
        });

        await sendResetEmail(email, token);
        return response.status(200).json({
            message: 'Permintaan reset password berhasil, silahkan periksa email anda'
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            message: 'Terjadi kesalahan pada server'
        });
    }
};

const resetPassword = async (request, response) => {
    try {
        const { token, newPassword } = request.body;

        if (!token || !newPassword) {
            return response.status(400).json({
                message: 'Token dan password baru harus diisi'
            });
        }

        const resetToken = await resetPasswordToken.findOne({
            where: { token: token }
        });

        if (!resetToken) {
            return response.status(400).json({
                message: 'Token reset password tidak valid atau sudah digunakan'
            });
        }

        const user = await db.admin.findOne({ where: { email: resetToken.email } });

        if (!user) {
            return response.status(404).json({
                message: 'Pengguna dengan email tersebut tidak ditemukan'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        await resetToken.update({ used: true });

        return response.status(200).json({
            message: 'Password berhasil direset'
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            message: 'Terjadi kesalahan pada server'
        });
    }
};

function generateUniqueUUID() {
    return uuidv4();
    
}

function generateUniqueToken() {
    const tokenLength = 16;
    const token = Math.random().toString(36).substr(2, tokenLength);

    return token;
}

async function sendResetEmail(email, token) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Password',
        text: `Klik link berikut untuk mereset password: http://localhost:8000/api/reset-password/?token=${token}`
    });
};

module.exports = { login, profile, updateAdminProfile, resetPassword, forgotPassword};
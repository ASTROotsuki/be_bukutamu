const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/index').admin;
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const resetPasswordToken = require('../models/index').reset_passwords;
const bodyParser = require('body-parser');
require('dotenv').config();

const generateToken = (userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return token;
};

exports.login = async (request, response) => {
    if (request.body) {
        let { email, password } = request.body;

        try {
            const user = await adminModel.findOne({ where: { email } });
            
            if (!user) {
                return response.status(401).json({success: 'false', logged: 'false', message: 'Invalid Email' });
            }
    
            const credential =  await bcrypt.compare(password, user.password);
    
            if (!credential) {
                return response.status(401).json({success: 'false', logged: 'false', message: 'Invalid Password' });
            }
    
            const token = generateToken(user.uuid);
    
            return response.json({ success: 'true', logged: 'true', nama: user.nama_admin, token: token });
        } catch (error) {
            console.error(error);
            return response.status(500).json({ success: false, message: "Internal Server Error" });
        }
    } else {
        response.status(400).json({ error: 'Bad request' });
    }

    
};
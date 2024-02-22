const express = require('express');
const authController = require('../controllers/auth_controller');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// endpoint
app.post('/login', authController.login)
app.put('/forgot-password', authController.forgotPassword)
app.put('/reset-password', authController.resetPassword)


module.exports = app;
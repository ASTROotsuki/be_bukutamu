const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const jwt = require('jsonwebtoken');

// endpoint
router.post('/login', authController.login)
router.get('/profile', authController.profile)
router.put('/forgot-password', authController.forgotPassword)
router.put('/reset-password', authController.resetPassword)


module.exports = router;
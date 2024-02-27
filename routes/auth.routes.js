const express = require('express');
const router = express.Router();
const { login, profile, updateAdminProfile, forgotPassword, resetPassword } = require('../controllers/auth_controller');
const jwt = require('jsonwebtoken');
const upload = require('../controllers/upload_foto');

// endpoint
router.post('/login', login)
router.get('/profile', profile)
router.post('/forgot-password', forgotPassword)
router.put('/reset-password', resetPassword)
router.put('/edit_profile', upload.single('foto'), updateAdminProfile)


module.exports = router;
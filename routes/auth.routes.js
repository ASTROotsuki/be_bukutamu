const express = require('express');
const authController = require('../controllers/auth_controller');
const app = express();

app.use(express.json())

// endpoint
app.post('/login', authController.login)


module.exports = app;
const express = require('express');
const app = express();
const adminController = require('../controllers/admin_controller');
const upload = require('../controllers/upload_foto');
const router = express.Router();

app.use(express.json())

// endpoint
app.get('/get', adminController.getAllAdmin)
app.post('/add', [upload.single('foto')], adminController.addAdmin)
app.post('/find', adminController.findAdmin)
app.put('/update/:id', adminController.updateAdmin)
app.delete('/delete/:id', adminController.deleteAdmin)

module.exports = app;
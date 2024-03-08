const express = require(`express`);
const cron = require('node-cron');
const nodemailer = require('nodemailer')
const cors = require('cors');
const app = express();
const upload = require('../controllers/upload_foto');
const transaksiSiswaController = require('../controllers/transaksiSiswa_controller');

app.use(express.json());
app.use(cors());

//endpoint
app.get("/get", transaksiSiswaController.getAllTransaksiSiswa)
app.post("/add", transaksiSiswaController.addTransaksiSiswa)
// app.post("/find",transaksiSiswaController.findTransaksiSiswa)
app.put("/update/:id", transaksiSiswaController.updateTransaksiSiswa)
app.delete("/delete/:id", transaksiSiswaController.deleteTransaksiSiswa)
// app.patch('/verify', transaksiSiswaController.verifyTransaksiSiswa);

module.exports = app
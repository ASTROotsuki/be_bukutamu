const express = require(`express`)
const cron = require('node-cron')
const cors = require('cors')
const upload = require('../controllers/upload_foto')
const app = express()
const transaksiGuruController = require('../controllers/transaksiGuru_controller')

app.use(express.json())
app.use(cors())

//endpoint
app.get("/get", transaksiGuruController.getAllTransaksiGuru)
app.post("/add", transaksiGuruController.addTransaksiGuru)
// app.post("/find",transaksiSiswaController.findTransaksiSiswa)
app.put("/update/:id", transaksiGuruController.updateTransaksiGuru)
app.delete("/delete/:id", transaksiGuruController.deleteTransaksiGuru)
// app.patch('/verify', transaksiSiswaController.verifyTransaksiSiswa);

module.exports = app
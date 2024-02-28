const express = require(`express`)
const cron = require('node-cron')
const app = express()
app.use(express.json())
const transaksiSiswaController = require('../controllers/transaksiSiswa_controller')

//endpoint
app.get("/get", transaksiSiswaController.getAllTransaksiSiswa)
app.post("/add",transaksiSiswaController.addTransaksiSiswa)
// app.post("/find",transaksiSiswaController.findTransaksiSiswa)
app.put("/update/:id", transaksiSiswaController.updateTransaksiSiswa)
app.delete("/delete/:id", transaksiSiswaController.deleteTransaksiSiswa)
// app.patch('/verify', transaksiSiswaController.verifyTransaksiSiswa);

module.exports = app
const express = require(`express`)
const app = express()
app.use(express.json())
const transaksiGuruController = require('../controllers/transaksiGuru_controller')

//endpoint
app.get("/get", transaksiGuruController.getAllTransaksiGuru)
app.post("/add",transaksiGuruController.addTransaksiGuru)
// app.post("/find",transaksiSiswaController.findTransaksiSiswa)
app.put("/update/:id", transaksiGuruController.updateTransaksiGuru)
app.delete("/delete/:id", transaksiGuruController.deleteTransaksiGuru)
// app.patch('/verify', transaksiSiswaController.verifyTransaksiSiswa);

module.exports = app
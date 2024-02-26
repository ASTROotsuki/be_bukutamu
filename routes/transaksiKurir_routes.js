const express = require(`express`)
const app = express()
app.use(express.json())
const transaksiKurirController = require('../controllers/transaksiKurir_controller')

//endpoint
app.get("/get", transaksiKurirController.getAllTransaksiKurir)
app.post("/add",transaksiKurirController.addTransaksiKurir)
// app.post("/find",transaksiKurirController.findTransaksiKurir)
// app.put("/update/:id", transaksiSiswaController.updateTransaksiSiswa)
// app.delete("/delete/:id", transaksiSiswaController.deleteTransaksiSiswa)

module.exports = app
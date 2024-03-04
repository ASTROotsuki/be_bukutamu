const express = require(`express`)
const app = express()
const cors = require('cors')
const transaksiKurirController = require('../controllers/transaksiKurir_controller')

app.use(express.json())
app.use(cors())
//endpoint
app.get("/get", transaksiKurirController.getAllTransaksiKurir)
app.post("/add", transaksiKurirController.addTransaksiKurir)
app.get("/getMoklet", transaksiKurirController.getAllMoklet)
// app.post("/find",transaksiKurirController.findTransaksiKurir)
app.put("/update/:id", transaksiKurirController.updateTransaksiKurir)
// app.delete("/delete/:id", transaksiSiswaController.deleteTransaksiSiswa)

module.exports = app
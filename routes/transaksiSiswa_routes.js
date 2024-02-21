const express = require(`express`)
const app = express()
app.use(express.json())
const transaksiSiswaController = require('../controllers/transaksiSiswa_controller')

//endpoint
app.get("/get", transaksiSiswaController.getAllTransaksiSiswa)
app.post("/add",transaksiSiswaController.addTransaksiSiswa)
app.get("/find",transaksiSiswaController.findTransaksiSiswa)
app.put("/update/:id", transaksiSiswaController.updateTransaksiSiswa)
app.delete("/delete/:id", transaksiSiswaController.deleteTransaksiSiswa)

module.exports = app
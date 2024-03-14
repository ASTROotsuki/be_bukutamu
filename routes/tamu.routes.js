const express = require(`express`)
const app = express()
app.use(express.json())
const tamuController = require('../controllers/tamu_controller')
const tamu = require('../models/tamu')

//endpoint
app.get("/get",tamuController.getAllTamu)
app.get("/getLayananKirim", tamuController.getTamuInTransaksiKurir)
app.get("/getTamuUmum", tamuController.getTamuUmum)
// app.post("/find",guruController.findGuru)

module.exports = app
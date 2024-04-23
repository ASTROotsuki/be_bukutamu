const express = require(`express`)
const router = express()
const cors = require('cors')
const transaksiKurirController = require('../controllers/transaksiKurir_controller')

router.use(express.json());
router.use(cors());
//endpoint
router.get("/get", transaksiKurirController.getAllTransaksiKurir)
router.post("/add", transaksiKurirController.addTransaksiKurir)
router.get("/getMoklet", transaksiKurirController.getAllMoklet)
// app.post("/find",transaksiKurirController.findTransaksiKurir
router.post("/verify-OTP", transaksiKurirController.verifyOTP)
router.post("/update-status", transaksiKurirController.updateTransaksiKurirStatus)
// app.delete("/delete/:id", transaksiSiswaController.deleteTransaksiSiswa)


module.exports = router;

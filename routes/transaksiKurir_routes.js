const express = require(`express`)
const router = express()
const cron = require('node-cron')
const nodemailer = require('nodemailer')
const cors = require('cors')
const { sendOTPController, verifyOTPController, getAllMoklet, getAllTransaksiKurir, addTransaksiKurir, updateTransaksiKurir, updateTransaksiKurirStatus } = require('../controllers/transaksiKurir_controller')

router.use(express.json());
router.use(cors());
//endpoint
router.get("/get", getAllTransaksiKurir)
router.post("/add", addTransaksiKurir)
router.get("/getMoklet", getAllMoklet)
// app.post("/find",transaksiKurirController.findTransaksiKurir)
router.put("/update/:id", updateTransaksiKurir)
// app.delete("/delete/:id", transaksiSiswaController.deleteTransaksiSiswa)
router.post("/send-otp", sendOTPController)
router.post("/verify-otp", verifyOTPController)
router.post("/update-status", updateTransaksiKurirStatus)

module.exports = router;
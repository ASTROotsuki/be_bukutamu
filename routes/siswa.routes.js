const express = require(`express`)
const app = express()
app.use(express.json())
const siswaController = require('../controllers/siswa_controller')

//endpoint
app.get("/get",siswaController.getAllSiswa)
app.post("/add",siswaController.addSiswa)
// app.post("/find",siswaController.findSiswa)
app.put("/update/:id",siswaController.updateSiswa)
app.delete("/delete/:id",siswaController.deleteSiswa);

module.exports = app
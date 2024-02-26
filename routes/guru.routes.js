const express = require(`express`)
const app = express()
app.use(express.json())
const guruController = require('../controllers/guru_controller')

//endpoint
app.get("/get",guruController.getAllGuru)
app.post("/add",guruController.addGuru)
// app.post("/find",guruController.findGuru)
app.put("/update/:id",guruController.updateGuru)
app.delete("/delete/:id",guruController.deleteGuru);

module.exports = app
const express = require(`express`);
const cron = require('node-cron');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 2000;
const path = require('path')
const cors = require(`cors`);
require('dotenv').config();
app.use(cors());
app.use(bodyParser.json());
// const bodyParser = require('body-parser')
// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(bodyParser.json())
// app.use(express.json())

const siswaRoute = require(`./routes/siswa.routes`)
app.use(`/siswa`, siswaRoute);

const guruRoute = require(`./routes/guru.routes`)
app.use(`/guru`, guruRoute);

const transaksiSiswaRoute = require('./routes/transaksiSiswa_routes')
app.use(`/transaksi_siswa`, transaksiSiswaRoute);

const transaksiKurirRoute = require('./routes/transaksiKurir_routes')
app.use(`/transaksi_kurir`, transaksiKurirRoute);

const adminRoute = require('./routes/admin.routes')
app.use('/admin', adminRoute);

const authRoute = require('./routes/auth.routes')
app.use('/api', authRoute);

const transaksiGuruRoute = require('./routes/transaksiGuru_routes')
app.use('/transaksi_guru', transaksiGuruRoute);

app.use('/api/transaksi_siswa/media', express.static(path.join(__dirname, 'foto')));
app.use('/api/profile/media', express.static(path.join(__dirname, 'foto')));
app.use('/api/transaksi_guru/media', express.static(path.join(__dirname, 'foto')));
app.use('/api/transaksi_kurir/media', express.static(path.join(__dirname, 'foto')));

app.listen(PORT, () => {
  console.log(`Server runs on port ${PORT}`);
});

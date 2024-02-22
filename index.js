const express = require(`express`);
const bodyParser = require('body-parser');
const app = express();
const PORT = 8000;
const cors = require(`cors`);
require('dotenv').config();
app.use(cors());
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


app.use('/api/transaksi_siswa/media', express.static(path.join(__dirname, 'foto')));

app.listen(PORT, () => {
  console.log(`Server runs on port ${PORT}`);
});

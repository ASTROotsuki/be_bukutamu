const express = require(`express`);
const app = express();
const PORT = 2000;
const cors = require(`cors`);
app.use(cors());
// const bodyParser = require('body-parser')
// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(bodyParser.json())
// app.use(express.json())

const siswaRoute = require(`./routes/siswa.routes`)
app.use(`/siswa`, siswaRoute);

const guruRoute = require(`./routes/guru.routes`)
app.use(`/guru`, guruRoute)

const transaksiSiswaRoute = require('./routes/transaksiSiswa_routes')
app.use(`/transaksi_siswa`, transaksiSiswaRoute);

const transaksiKurirRoute = require('./routes/transaksiKurir_routes')
app.use(`/transaksi_kurir`, transaksiKurirRoute);


app.listen(PORT, () => {
  console.log(`Server runs on port ${PORT}`);
});

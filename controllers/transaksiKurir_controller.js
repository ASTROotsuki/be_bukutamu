const transaksiKurirModel = require('../models/index').transaksi_kurir
const tamuModel = require('../models/index').tamu
const transaksiKurirSiswaModel = require('../models/index').transaksi_kurirSiswa
const transaksiKurirGuruModel = require('../models/index').transaksi_kurirGuru
const Op = require(`sequelize`).Op
const uuid = require('uuid');
const uuid4 = uuid.v4()
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)

exports.getAllTransaksiKurir = async (request, response) => {
    let transaksiKurir = await transaksiKurirModel.findAll()
    try {
        if (transaksiKurir.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Data not found'
            });
        }
        return response.json({
            success: true,
            data: transaksiKurir,
            message: 'All Form have been loaded'
        })
    } catch (error) {
        console.error(error);
        console.log(transaksiKurirModel);
        return response.status(500).json({ message: error });
    }
};

exports.findTransaksiKurir = async (request, response) => {

    let keyword = request.body.keyword

    let transaksiKurir = await transaksiKurirModel.findAll({
        where: {
            [Op.or]: [
                { id_tamu__nama_tamu: { [Op.substring]: keyword } },
                { id_tamu__no_tlp: { [Op.substring]: keyword } },
                { id_siswa__nama_siswa: { [Op.substring]: keyword } },
                { id_guru__nama_guru: { [Op.substring]: keyword } },
                { asal_instansi: { [Op.substring]: keyword } },
                { tanggal_dititipkan: { [Op.substring]: keyword } },
                { tanggal_diterima: { [Op.substring]: keyword } },
                { status: { [Op.substring]: keyword } }
            ]
        }
    })

    return response.json({
        success: true,
        data: transaksiKurir,
        message: `All transaksi have beed loaded`
    })
};

exports.addTransaksiKurir = (request, response) => {
    upload(request, response, async (error) => {
        if (error) {
            return response.json({ message: error });
        }

        if (!request.file) {
            return response.json({ message: `Nothing to Upload` });
        }

        let newTamu = {
            id_tamu: uuid4,
            nama_tamu: request.body.nama_tamu,
            no_tlp: request.body.no_tlp,

        };
        let newTransaksiKurir = {
            id_transaksiKurir: uuid4,
            id_tamu: newTamu.id_tamu,
            asal_instansi: request.body.asal_instansi,
            tanggal_dititipkan: new Date(),
            tanggal_diterima: request.body.tanggal_diterima,
            status: "Proses",
            foto: request.file.filename

        };
        let newTransaksiKurirGuru = {
            id_kurirGuru: uuid4,
            id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
            id_guru: request.body.id_guru
        };
        let newTransaksiKurirSiswa = {
            id_kurirSiswa: uuid4,
            id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
            id_siswa: request.body.id_siswa
        };
        try {
            await tamuModel.create(newTamu);
            await transaksiKurirModel.create(newTransaksiKurir);

            if (request.body.id_guru) {
                await transaksiKurirGuruModel.create(newTransaksiKurirGuru);
            }
    
            if (request.body.id_siswa) {
                await transaksiKurirSiswaModel.create(newTransaksiKurirSiswa);
            }

            const kodeUnik = newTransaksiKurir.id_transaksiKurir.slice(-4);

            return response.json({
                success: true,
                message: `New form has been inserted`,
                kode: kodeUnik
            });
        } catch (error) {
            return response.json({
                success: false,
                message: error.message
            });
        }
    });
};

// exports.updateTransaksiSiswa = async (request, response) => {
//     upload(request, response, async (err) => {
//         if (err) {
//             return response.json({ message: err });
//         }

//         let id_transaksiSiswa = request.params.id;
//         let dataTransaksiSiswa = {};

//         if (!request.file) {
//             dataTransaksiSiswa = {
//                 id_siswa: request.body.id_siswa,
//                 janji: request.body.janji,
//                 jumlah_tamu: request.body.jumlah_tamu,
//                 status: request.body.status,
//             };
//         } else {
//             const selectedTransaksiSiswa = await transaksiSiswaModel.findOne({
//                 where: { id_transaksiSiswa: id_transaksiSiswa },
//             });

//             if (!selectedTransaksiSiswa) {
//                 return response.json({
//                     success: false,
//                     message: 'Transaksi Siswa not found',
//                 });
//             }

//             const oldFotoTransaksiSiswa = selectedTransaksiSiswa.foto;
//             const pathImage = path.join(__dirname, `../foto`, oldFotoTransaksiSiswa);

//             if (fs.existsSync(pathImage)) {
//                 fs.unlink(pathImage, (error) => console.log(error));
//             }
//             dataTransaksiSiswa = {
//                 id_siswa: request.body.id_siswa,
//                 janji: request.body.janji,
//                 jumlah_tamu: request.body.jumlah_tamu,
//                 status: request.body.status,
//                 foto: request.file.filename,
//             };
//         }
//         transaksiSiswaModel.update(dataTransaksiSiswa, { where: { id_transaksiSiswa: id_transaksiSiswa } })
//             .then((result) => {
//                 return response.json({
//                     success: true,
//                     message: `Data Form has been updated`,
//                 });
//             })
//             .catch((error) => {
//                 return response.json({
//                     success: false,
//                     message: error.message,
//                 });
//             });
//     });
// };

// exports.deleteTransaksiSiswa = async (request, response) => {
//     const id_transaksiSiswa = request.params.id
//     const transaksiSiswa = await transaksiSiswaModel.findOne({ where: { id_transaksiSiswa: id_transaksiSiswa } })
//     const oldFotoTransaksiSiswa = transaksiSiswa.foto
//     const pathImage = path.join(__dirname, '../foto', oldFotoTransaksiSiswa)

//     if (fs.existsSync(pathImage)) {
//         fs.unlink(pathImage, error => console.log(error))
//     }

//     transaksiSiswaModel.destroy({ where: { id_transaksiSiswa: id_transaksiSiswa } })
//         .then(result => {
//             return response.json({
//                 success: true,
//                 message: "Data siswa has been deleted"
//             })
//         })
// };
const tamuModel = require('../models/index').tamu;
const transaksiKurirModel = require('../models/index').transaksi_kurir;
const transaksiGuruModel = require('../models/index').transaksi_guru;
const transaksiSiswaModel = require('../models/index').transaksi_siswa;
const Op = require('sequelize').Op;
const uuid = require('uuid');
const { response } = require('../routes/tamu.routes');
const uuid4 = uuid.v4();

exports.getAllTamu = async (request, response) => {
    try {
        const tamu = await tamuModel.findAll();
        const tamuCount = tamu.length; // count the number of tamu

        return response.json({
            success: true,
            data: tamu,
            tamuCount, // include tamuCount in the response
            message: 'All tamu have been loaded',
        });
    } catch (error) {
        console.error(error);
        console.log(tamuModel);
        return response.status(500).json({ message: error.message });
    }
};

exports.findTamu = async (request, response) => {
    let keyword = request.body.keyword

    let tamu = await tamuModelfindAll({
        where: {
            [Op.or]: [
                { nama_tamu: { [Op.substring]: keyword } },
                { no_tlp: { [Op.substring]: keyword } }
            ]
        }
    })

    return response.json({
        success: true,
        data: tamu,
        message: "All tamu has been loaded"
    })
};

exports.addTamu = (request, response) => {
    let newTamu = {
        id_tamu: uuid4,
        nama_tamu: request.body.nama_tamu,
        no_tlp: request.body.no_tlp
    }

    tamuModel.create(newTamu)
        .then(result => {
            return response.json({
                success: true,
                data: result,
                message: 'New tamu has been inserted'
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
};

exports.updateTamu = (request, response) => {
    let dataTamu = {
        nama_tamu: request.body.nama_tamu,
        no_tlp: request.body.no_tlp,
    }

    let id_tamu = request.params.id

    tamuModel.update(dataTamu, { where: { id_tamu: id_tamu } })
        .then(result => {
            return response.json({
                success: true,
                message: 'Data tamu has been updated'
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
};

exports.deleteTamu = (request, response) => {
    let id_tamu = request.params.id

    tamuModel.destroy({ where: { id_tamu: id_tamu } })
        .then(result => {
            return response.json({
                success: true,
                message: 'Data tamu has been deleted'
            })
        })
};

// exports.getTamuInTransaksiKurir = async (request, response) => {
//     try {
//         const transaksiKurir = await transaksiKurirModel.findAll();
//         const transaksiKurirCount = transaksiKurir.length; // count the number of tamu

//         return response.json({
//             success: true,
//             data: transaksiKurir,
//             transaksiKurirCount, // include tamuCount in the response
//             message: 'All data layanan kirim have been loaded',
//         });
//     } catch (error) {
//         console.error(error);
//         console.log(tamuModel);
//         return response.status(500).json({ message: error.message });
//     }
// };

exports.getDashboard = async (request, response)=>{
        try {
            const allTransaksiSiswa = await transaksiSiswaModel.findAll();
            const allTransaksiGuru = await transaksiGuruModel.findAll();
            const allTransaksiKurir = await transaksiKurirModel.findAll();
            const allTamu = await tamuModel.findAll();
            const allTamuUmum = [...allTransaksiSiswa, ...allTransaksiGuru];
            const tamuCount = allTamu.length;
            const tamuUmumCount = allTamuUmum.length;
            const layananKirimCount = allTransaksiKurir.length;
    
            return response.json({
                success: true,
                data: {
                    tamuUmum: allTamuUmum,
                    layananKirim: allTransaksiKurir,
                    tamuCount,
                    layananKirimCount,
                    tamuUmumCount,
                },
                message: 'All students and teachers data loaded successfully',
            });
        } catch (error) {
            console.error(error);
            return response.status(500).json({ message: error.message });
        }
    }
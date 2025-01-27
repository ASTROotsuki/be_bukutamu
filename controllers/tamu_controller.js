const tamuModel = require('../models/index').tamu;
const transaksiKurirModel = require('../models/index').transaksi_kurir;
const transaksiGuruModel = require('../models/index').transaksi_guru;
const transaksiSiswaModel = require('../models/index').transaksi_siswa;
const Op = require('sequelize').Op;
const uuid = require('uuid');
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

exports.getDashboard = async (request, response) => {
    try {
        let { week, chartType } = request.query; // Ambil parameter minggu dan jenis chart dari query string
        let startDateOfWeek, endDateOfWeek;

        // Jika parameter minggu tidak diberikan, atur minggu menjadi 0 (tanpa filtering per minggu)
        if (!week) {
            week = 0;
        } else {
            // Tentukan rentang waktu berdasarkan minggu yang diminta
            const today = new Date();
            const dayOfWeek = today.getDay(); // Mengembalikan hari dalam seminggu (0 untuk Minggu, 1 untuk Senin, dst.)
            const daysToSubtract = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + week * 7; // Jumlah hari yang harus dikurangkan dari hari ini untuk mencapai awal minggu
            startDateOfWeek = new Date(today.getTime() - daysToSubtract * 24 * 60 * 60 * 1000); // Menghitung tanggal awal minggu
            endDateOfWeek = new Date(today.getTime() + (6 - dayOfWeek) * 24 * 60 * 60 * 1000); // Menghitung tanggal akhir minggu
        }

        // Siapkan data untuk chart
        let chartData = null; // Default chartData menjadi null jika chartType tidak disertakan
        
        if (chartType) { // Cek apakah chartType telah diberikan dalam permintaan
            // Ambil data transaksi siswa, guru, dan kurir dalam rentang waktu yang sesuai
            const whereClause = {
                createdAt: {
                    [Op.between]: [startDateOfWeek, endDateOfWeek]
                }
            };
            
            const allTransaksiSiswa = await transaksiSiswaModel.findAll({ where: whereClause });
            const allTransaksiGuru = await transaksiGuruModel.findAll({ where: whereClause });
            const allTransaksiKurir = await transaksiKurirModel.findAll({ where: whereClause });

            // Gabungkan transaksi siswa dan guru menjadi satu array
            const allTamu = await tamuModel.findAll();
            const allTamuUmum = [...allTransaksiSiswa, ...allTransaksiGuru];
            
            // Hitung jumlah data
            const tamuCount = allTamu.length;
            const tamuUmumCount = allTamuUmum.length;
            const layananKirimCount = allTransaksiKurir.length;

            const transaksiCounts = [];
            for (let i = 0; i < 7; i++) {
                transaksiCounts.push({ tamuUmum: 0, layananKirim: 0});
                // const date = new Date(startDateOfWeek.getTime() + i * 24 * 60 * 60 * 1000);
                // const countSiswa = allTransaksiSiswa.filter(transaction => new Date(transaction.createdAt).getDate() === date.getDate()).length;
                // const countGuru = allTransaksiGuru.filter(transaction => new Date(transaction.createdAt).getDate() === date.getDate()).length;
                // const countKurir = allTransaksiKurir.filter(transaction => new Date(transaction.createdAt).getDate() === date.getDate()).length;
                // transaksiCounts.push({ date: date.toLocaleDateString('en-US', { weekday: 'long' }), tamuUmum: countSiswa + countGuru, layananKirim: countKurir });
            }

            let todayIndex = new Date().getDay();
            if (todayIndex === 0) {
                todayIndex = 6;
            } else {
                todayIndex -= 1;
            }

            const countSiswa = allTransaksiSiswa.filter(transaction => new Date(transaction.createdAt).getDay() === todayIndex).length;
            const countGuru = allTransaksiGuru.filter(transaction => new Date(transaction.createdAt).getDay() === todayIndex).length;
            const countKurir = allTransaksiKurir.filter(transaction => new Date(transaction.createdAt).getDay() === todayIndex).length;
            transaksiCounts[todayIndex].tamuUmum = countSiswa + countGuru;
            transaksiCounts[todayIndex].layananKirim = countKurir;

            // Logika untuk mempersiapkan data chart sesuai dengan jenis chart yang diminta
            if (chartType === 'line') {
                // Logic untuk chart garis
                chartData = [
                    { name: 'Layanan Kirim', data: transaksiCounts.map(transaction => transaction.layananKirim) },
                    { name: 'Tamu Umum', data: transaksiCounts.map(transaction => transaction.tamuUmum) }
                ]; // Susun data sesuai kebutuhan untuk chart garis
            } else if (chartType === 'pie') {
                // Logic untuk pie chart
                chartData = {
                    labels: ['Tamu Umum', 'Layanan Kirim'],
                    data: [tamuUmumCount, layananKirimCount]
                };
            }

            console.log("Transaksi Counts:", transaksiCounts);
        }

        return response.json({
            success: true,
            data: {
                chartData // Sertakan data chart dalam respons
            },
            message: 'Data loaded successfully',
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: error.message });
    }
};
const { transaksi_kurir } = require('../models/index')
const tamuModel = require('../models/index').tamu
const transaksiKurirSiswaModel = require('../models/index').transaksi_kurirSiswa
const transaksiKurirGuruModel = require('../models/index').transaksi_kurirGuru
const siswaModel = require('../models/index').siswa
const guruModel = require('../models/index').guru
const { Op } = require(`sequelize`)
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const wa = require('@open-wa/wa-automate')
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)
const otpGenerator = require('otp-generator')
otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

exports.getAllMoklet = async (request, response) =>{
    try {
        const allSiswa = await siswaModel.findAll();
        const allGuru = await guruModel.findAll();

        return response.json({
            success: true,
            data: {
                data: [allSiswa, allGuru]
            },
            message: 'All students and teachers data loaded successfully',
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: error.message });
    }
}

exports.getAllTransaksiKurir = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const ITEMS_PER_PAGE = parseInt(request.query.limit) || 5;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        const filterOptions = {};

        // Tambahkan filter berdasarkan tanggal jika startDate diberikan
        const startDate = request.query.startDate;

        if (startDate) {
            const startOfDay = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const endOfDay = moment(startDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

            filterOptions.tanggal_dititipkan = {
                [Op.between]: [startOfDay, endOfDay],
            };
        }

        const searchQuery = request.query.search;
        if (searchQuery) {
            // Ubah searchQuery menjadi huruf kecil
            const lowercaseSearchQuery = searchQuery.toLowerCase();

            filterOptions[Op.or] = [
                { '$tamu.nama_tamu$': { [Op.iLike]: `%${lowercaseSearchQuery}%` } },
            ];
        }

        let transaksiKurir = await transaksi_kurir.findAndCountAll({
            offset: offset,
            limit: ITEMS_PER_PAGE,
            where: filterOptions,
            include: [
                {
                    model: tamuModel,
                    require: true
                },
                {
                    model: transaksiKurirGuruModel,
                    require: true
                },
                {
                    model: transaksiKurirSiswaModel,
                    require: true
                }
            ],
        });

        const totalItems = transaksiKurir.count;

        // if (totalItems === 0) {
        //     return response.status(404).json({
        //         success: false,
        //         message: 'Data not found'
        //     });
        // }

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (transaksiKurir.rows.length === 0) {
            return response.status(404).json({
                success: false,
                message: "Data masih belum ada"
            });
        }

        return response.status(200).json({
            success: true,
            data: transaksiKurir.rows,
            pagination: {
                currentPage: page,
                totalItems: totalItems,
                totalPages: totalPages,
            },
            message: 'All transaction data siswa have been loaded'
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: error.message });
    }
};

// exports.findTransaksiKurir = async (request, response) => {

//     let keyword = request.body.keyword

//     let transaksiKurir = await transaksi_kurir.findAll({
//         where: {
//             [Op.or]: [
//                 { id_tamu__nama_tamu: { [Op.substring]: keyword } },
//                 { id_tamu__no_tlp: { [Op.substring]: keyword } },
//                 { id_siswa__nama_siswa: { [Op.substring]: keyword } },
//                 { id_guru__nama_guru: { [Op.substring]: keyword } },
//                 { asal_instansi: { [Op.substring]: keyword } },
//                 { tanggal_dititipkan: { [Op.substring]: keyword } },
//                 { tanggal_diterima: { [Op.substring]: keyword } },
//                 { status: { [Op.substring]: keyword } }
//             ]
//         }
//     })

//     return response.json({
//         success: true,
//         data: transaksiKurir,
//         message: `All transaksi have beed loaded`
//     })
// };

exports.addTransaksiKurir = (request, response) => {
    upload(request, response, async (error) => {
        if (error) {
            return response.json({ message: error });
        }

        if (!request.file) {
            return response.json({ message: `Nothing to Upload` });
        }

        let newTamu = {
            id_tamu: uuidv4(),
            nama_tamu: request.body.nama_tamu,
            no_tlp: request.body.no_tlp,

        };
        let newTransaksiKurir = {
            id_transaksiKurir: uuidv4(),
            id_tamu: newTamu.id_tamu,
            asal_instansi: request.body.asal_instansi,
            tanggal_dititipkan: new Date(),
            tanggal_diterima: request.body.tanggal_diterima,
            foto: request.file.filename,
            status: request.body.status

        };
        let newTransaksiKurirGuru = {
            id_kurirGuru: uuidv4(),
            id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
            id_guru: request.body.id_guru
        };
        let newTransaksiKurirSiswa = {
            id_kurirSiswa: uuidv4(),
            id_transaksiKurir: newTransaksiKurir.id_transaksiKurir,
            id_siswa: request.body.id_siswa
        };
        try {
            await tamuModel.create(newTamu);
            await transaksi_kurir.create(newTransaksiKurir);

            if (request.body.id_guru) {
                const guru = await guruModel.findOne({
                    where: { id_guru: request.body.id_guru }
                });
                if (guru) {
                    // Menggunakan nomor telepon dari data Guru
                    await transaksiKurirGuruModel.create(newTransaksiKurirGuru);
                    await whatsappi.sendText(guru.no_tlp+'@c.us', `New form created!`).then((response)=>{
                        status = true;
                        message = "berhasil dikirim"
                    });
                }
            }

            if (request.body.id_siswa) {
                const siswa = await siswaModel.findOne({
                    where: { id_siswa: request.body.id_siswa }
                });
                if (siswa) {
                    // Menggunakan nomor telepon dari data Siswa
                    await transaksiKurirSiswaModel.create(newTransaksiKurirSiswa);
                    await whatsappi.sendText(siswa.no_tlp+'@c.us', `New form created!`).then((response)=>{
                        status = true,
                        message = "berhasil dikirim"
                    });;
                }
            }
            const otpGenerated = generateOTP();

            return response.json({
                success: true,
                message: `New form has been inserted` 
            });
        } catch (error) {
            return response.json({
                success: false,
                message: error.message
            });
        }
    });
};
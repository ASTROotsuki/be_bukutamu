const { transaksi_kurir } = require('../models/index')
const tamuModel = require('../models/index').tamu
const transaksiKurirSiswaModel = require('../models/index').transaksi_kurirSiswa
const transaksiKurirGuruModel = require('../models/index').transaksi_kurirGuru
const siswaModel = require('../models/index').siswa
const guruModel = require('../models/index').guru
const { Op } = require(`sequelize`)
const multer = require('multer');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const wa = require('@open-wa/wa-automate')
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)
exports.getAllMoklet = async (request, response) => {
    try {
        const allSiswa = await siswaModel.findAll();
        const allGuru = await guruModel.findAll();
        const allData = [...allSiswa, ...allGuru];

        return response.json({
            success: true,
            data: {
                data: allData
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

        const transformedData = transaksiKurir.rows.map(row => {
            const { id_transaksiKurir, asal_instansi, tanggal_dititipkan, tanggal_diterima, foto, status, createdAt, updatedAt, tamu, transaksi_kurirGuru, transaksi_kurirSiswa } = row;

            const yangDiterima = {
                nama: (transaksi_kurirGuru && transaksi_kurirGuru.nama) || (transaksi_kurirSiswa && transaksi_kurirSiswa.nama) || null,
                no_tlp: (transaksi_kurirGuru && transaksi_kurirGuru.no_tlp) || (transaksi_kurirSiswa && transaksi_kurirSiswa.no_tlp) || null,
            };

            return {
                id_transaksiKurir,
                asal_instansi,
                tanggal_dititipkan,
                tanggal_diterima,
                foto,
                status,
                createdAt,
                updatedAt,
                tamu,
                yangDiterima,
            };
        });

        return response.status(200).json({
            success: true,
            data: transformedData,
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
            status: "Proses"

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

            const ultramsg = require('ultramsg-whatsapp-api');
            const instance_id = "instance1409" // Ultramsg.com instance id
            const ultramsg_token = "64be34eeb56d7"  // Ultramsg.com token
            const api = new ultramsg(instance_id, ultramsg_token);

            if (request.body.id_guru) {
                const guru = await guruModel.findOne({
                    where: { id_guru: request.body.id_guru }
                });
                if (guru) {
                    // Menggunakan nomor telepon dari data Guru
                    await transaksiKurirGuruModel.create(newTransaksiKurirGuru);
                    await api.sendChatMessage(guru.no_tlp, `New form created!`)
                    console.log(response)
                }
            }

            if (request.body.id_siswa) {
                const siswa = await siswaModel.findOne({
                    where: { id_siswa: request.body.id_siswa }
                });
                if (siswa) {
                    // Menggunakan nomor telepon dari data Siswa
                    await transaksiKurirSiswaModel.create(newTransaksiKurirSiswa);
                    await api.sendChatMessage(siswa.no_tlp, `New form created!`)
                    console.log(response)
                }
            }


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


exports.updateTransaksiKurir = async (request, response) => {
    upload(request, response, async (err) => {
        if (err) {
            return response.json({ message: err });
        }

        let id_transaksiKurir = request.params.id;
        let dataTransaksiKurir = {};

        if (!request.file) {
            dataTransaksiKurir = {
                asal_instansi: request.body.asal_instansi,
                tanggal_dititipkan: new Date(),
                tanggal_diterima: request.body.tanggal_diterima,
                status: request.body.status
            };
        } else {
            const selectedTransaksiKurir = await transaksi_kurir.findOne({
                where: { id_transaksiKurir: id_transaksiKurir },
            });

            if (!selectedTransaksiKurir) {
                return response.json({
                    success: false,
                    message: 'Transaksi Kurir not found',
                });
            }

            const oldFotoTransaksiKurir = selectedTransaksiKurir.foto;
            const pathImage = path.join(__dirname, `../foto`, oldFotoTransaksiKurir);

            if (fs.existsSync(pathImage)) {
                fs.unlink(pathImage, (error) => console.log(error));
            }
            dataTransaksiKurir = {
                asal_instansi: request.body.asal_instansi,
                tanggal_dititipkan: new Date(),
                tanggal_diterima: request.body.tanggal_diterima,
                foto: request.file.filename,
                status: request.body.status
            };
        }
        transaksi_kurir.update(dataTransaksiKurir, { where: { id_transaksiKurir: id_transaksiKurir } })
            .then((result) => {
                return response.json({
                    success: true,
                    message: `Data Form has been updated`,
                });
            })
            .catch((error) => {
                return response.json({
                    success: false,
                    message: error.message,
                });
            });
    });
};

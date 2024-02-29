const transaksiGuruModel = require('../models/index').transaksi_guru;
const tamuModel = require('../models/index').tamu;
const guruModel = require('../models/index').guru;
const Op = require(`sequelize`).Op
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)


exports.getAllTransaksiGuru = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const ITEMS_PER_PAGE = parseInt(request.query.limit) || 5;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        const filterOptions = {};

        // Tambahkan filter berdasarkan tanggal
        if (request.query.startDate && request.query.endDate) {
            filterOptions.createdAt = {
                [Op.between]: [new Date(request.query.startDate), new Date(request.query.endDate)],
            };
        }

        const searchQuery = request.query.search;
        if (searchQuery) {
            filterOptions[Op.or] = [
                { '$guru.nama_guru$': { [Op.like]: `%${searchQuery}%` } },
                { '$tamu.nama_tamu$': { [Op.like]: `%${searchQuery}%` } }
            ];
        }

        let transaksiGuru = await transaksiGuruModel.findAndCountAll({
            offset: offset,
            limit: ITEMS_PER_PAGE,
            where: filterOptions,
            include: [
                {
                    model: guruModel,
                    require: true
                },
                {
                    model: tamuModel,
                    require: true
                },
            ],
        });

        const totalItems = transaksiGuru.count;

        if (totalItems === 0) {
            return response.status(404).json({
                success: false,
                message: 'Data masih belum ada'
            });
        }

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        return response.status(200).json({
            success: true,
            data: transaksiGuru.rows,
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

exports.findTransaksiGuru= async (request, response) => {

    let keyword = request.body.keyword

    let transaksiGuru = await transaksiGuruModel.findAll({
        where: {
            [Op.or]: [
                { id_tamu__nama_tamu: { [Op.substring]: keyword } },
                { id_tamu__no_tlp: { [Op.substring]: keyword } },
                { id_guru__nama_guru: { [Op.substring]: keyword } },
                { janji: { [Op.substring]: keyword } },
                { jumlah_tamu: { [Op.substring]: keyword } }
            ]
        }
    })

    return response.json({
        success: true,
        data: transaksiGuru,
        message: `All transaksi have beed loaded`
    })
};

exports.addTransaksiGuru = (request, response) => {
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

        let newTransaksiGuru= {
            id_transaksiGuru: uuidv4(),
            id_tamu: newTamu.id_tamu,
            id_guru: request.body.id_guru,
            janji: request.body.janji,
            asal_instansi: request.body.asal_instansi,
            jumlah_tamu: request.body.jumlah_tamu,
            foto: request.file.filename,
            keterangan: request.body.keterangan

        };
        try {
            await tamuModel.create(newTamu);
            await transaksiGuruModel.create(newTransaksiGuru);


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


exports.updateTransaksiGuru = async (request, response) => {
    upload(request, response, async (err) => {
        if (err) {
            return response.json({ message: err });
        }

        let id_transaksiGuru = request.params.id;
        let dataTransaksiGuru = {};

        if (!request.file) {
            dataTransaksiGuru= {
                id_guru: request.body.id_guru,
                janji: request.body.janji,
                jumlah_tamu: request.body.jumlah_tamu,
                keterangan: request.body.keterangan
            };
        } else {
            const selectedTransaksiGuru = await transaksiGuruModel.findOne({
                where: { id_transaksiGuru: id_transaksiGuru },
            });

            if (!selectedTransaksiGuru) {
                return response.json({
                    success: false,
                    message: 'Transaksi Guru not found',
                });
            }

            const oldFotoTransaksiGuru = selectedTransaksiGuru.foto;
            const pathImage = path.join(__dirname, `../foto`, oldFotoTransaksiGuru);

            if (fs.existsSync(pathImage)) {
                fs.unlink(pathImage, (error) => console.log(error));
            }
            dataTransaksiGuru = {
                id_guru: request.body.id_guru,
                janji: request.body.janji,
                asal_instansi: request.body.asal_instansi,
                jumlah_tamu: request.body.jumlah_tamu,
                foto: request.file.filename,
                keterangan: request.body.keterangan
            };
        }
        transaksiGuruModel.update(dataTransaksiGuru, { where: { id_transaksiGuru: id_transaksiGuru } })
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

exports.deleteTransaksiGuru = async (request, response) => {
    const id_transaksiGuru = request.params.id
    const transaksiGuru = await transaksiGuruModel.findOne({ where: { id_transaksiGuru: id_transaksiGuru } })
    const oldFotoTransaksiGuru = transaksiGuru.foto
    const pathImage = path.join(__dirname, '../foto', oldFotoTransaksiGuru)

    if (fs.existsSync(pathImage)) {
        fs.unlink(pathImage, error => console.log(error))
    }

    transaksiGuruModel.destroy({ where: { id_transaksiGuru: id_transaksiGuru } })
        .then(result => {
            return response.json({
                success: true,
                message: "Data guru has been deleted"
            })
        })
};
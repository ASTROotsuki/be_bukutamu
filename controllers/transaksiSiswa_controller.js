const { transaksi_siswa} = require('../models/index');
const tamuModel = require('../models/index').tamu;
const siswaModel = require('../models/index').siswa;
const Op = require(`sequelize`).Op
const uuid = require('uuid');
const uuid4 = uuid.v4()
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)


exports.getAllTransaksiSiswa = async (request, response) => {
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
                { '$siswa.nama_siswa$': { [Op.like]: `%${searchQuery}%` } },
                { '$tamu.nama_tamu$': { [Op.like]: `%${searchQuery}%` } }
            ];
        }

        let transaksiSiswa = await transaksi_siswa.findAndCountAll({
            offset: offset,
            limit: ITEMS_PER_PAGE,
            where: filterOptions,
            include: [
                {
                    model: siswaModel,
                    require: true
                },
                {
                    model: tamuModel,
                    require: true
                },
            ],
        });

        const totalItems = transaksiSiswa.count;

        if (totalItems === 0) {
            return response.status(404).json({
                success: false,
                message: 'Data masih belum ada'
            });
        }

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        return response.status(200).json({
            success: true,
            data: transaksiSiswa.rows,
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

exports.findTransaksiSiswa = async (request, response) => {

    let keyword = request.body.keyword

    let transaksiSiswa = await transaksiSiswaModel.findAll({
        where: {
            [Op.or]: [
                { id_tamu__nama_tamu: { [Op.substring]: keyword } },
                { id_tamu__no_tlp: { [Op.substring]: keyword } },
                { id_siswa__nama_siswa: { [Op.substring]: keyword } },
                { janji: { [Op.substring]: keyword } },
                { jumlah_tamu: { [Op.substring]: keyword } },
                { status: { [Op.substring]: keyword } }
            ]
        }
    })

    return response.json({
        success: true,
        data: transaksiSiswa,
        message: `All transaksi have beed loaded`
    })
};

exports.addTransaksiSiswa = (request, response) => {
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

        let newTransaksiSiswa = {
            id_transaksiSiswa: uuid4,
            id_tamu: newTamu.id_tamu,
            id_siswa: request.body.id_siswa,
            janji: request.body.janji,
            jumlah_tamu: request.body.jumlah_tamu,
            keterangan: request.body.keterangan,
            foto: request.file.filename

        };
        try {
            await tamuModel.create(newTamu);
            const createdTransaksiSiswa = await transaksi_siswa.create(newTransaksiSiswa);
            const kodeUnik = createdTransaksiSiswa.id_transaksiSiswa.slice(-4);


            return response.json({
                success: true,
                message: `New form has been inserted`,
                kode : kodeUnik
            });
        } catch (error) {
            return response.json({
                success: false,
                message: error.message
            });
        }
    });
};

exports.updateTransaksiSiswa = async (request, response) => {
    upload(request, response, async (err) => {
        if (err) {
            return response.json({ message: err });
        }

        let id_transaksiSiswa = request.params.id;
        let dataTransaksiSiswa = {};

        if (!request.file) {
            dataTransaksiSiswa = {
                id_siswa: request.body.id_siswa,
                janji: request.body.janji,
                jumlah_tamu: request.body.jumlah_tamu,
                status: request.body.status,
            };
        } else {
            const selectedTransaksiSiswa = await transaksi_siswa.findOne({
                where: { id_transaksiSiswa: id_transaksiSiswa },
            });

            if (!selectedTransaksiSiswa) {
                return response.json({
                    success: false,
                    message: 'Transaksi Siswa not found',
                });
            }

            const oldFotoTransaksiSiswa = selectedTransaksiSiswa.foto;
            const pathImage = path.join(__dirname, `../foto`, oldFotoTransaksiSiswa);

            if (fs.existsSync(pathImage)) {
                fs.unlink(pathImage, (error) => console.log(error));
            }
            dataTransaksiSiswa = {
                id_siswa: request.body.id_siswa,
                janji: request.body.janji,
                jumlah_tamu: request.body.jumlah_tamu,
                status: request.body.status,
                foto: request.file.filename,
            };
        }
        transaksi_siswa.update(dataTransaksiSiswa, { where: { id_transaksiSiswa: id_transaksiSiswa } })
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

exports.deleteTransaksiSiswa = async (request, response) => {
    const id_transaksiSiswa = request.params.id
    const transaksiSiswa = await transaksi_siswa.findOne({ where: { id_transaksiSiswa: id_transaksiSiswa }})
    const oldFotoTransaksiSiswa = transaksiSiswa.foto
    const pathImage = path.join(__dirname, '../foto', oldFotoTransaksiSiswa)

    if(fs.existsSync(pathImage)){
        fs.unlink(pathImage, error => console.log(error))
    }
    
    transaksi_siswa.destroy({ where: { id_transaksiSiswa: id_transaksiSiswa } })
        .then(result => {
            return response.json({
                success: true,
                message: "Data siswa has been deleted"
            })
        })
};
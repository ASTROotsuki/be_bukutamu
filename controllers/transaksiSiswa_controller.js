const transaksiSiswaModel = require('../models/index').transaksi_siswa
const tamuModel = require('../models/index').tamu
const Op = require(`sequelize`).Op
const uuid = require('uuid');
const uuid4 = uuid.v4()
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)

exports.getAllTransaksiSiswa = async (request, response) => {
    let transaksiSiswa = await transaksiSiswaModel.findAll()
    try {
        if (transaksiSiswa.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Data not found'
            });
        }
        return response.json({
            success: true,
            data: transaksiSiswa,
            message: 'All Form have been loaded'
        })
    } catch (error) {
        console.error(error);
        console.log(transaksiSiswaModel);
        return response.status(500).json({ message: error });
    }
};

exports.findTransaksiSiwa = async (request, response) => {

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
            status: request.body.status,
            foto: request.file.filename

        };
        try {
            await tamuModel.create(newTamu);
            await transaksiSiswaModel.create(newTransaksiSiswa);

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

exports.updateTransaksiSiswa = async (request, response) => {
    upload(request, response, async (err) => {
        if (err) {
            return response.json({ message: err });
        }

        let id_transaksiSiswa = request.params.id;

        // Define dataTransaksiSiswa as an object
        let dataTransaksiSiswa = {};

        if (!request.file) {
            // If there's no file to upload, update only the relevant fields
            dataTransaksiSiswa = {
                id_siswa: request.body.id_siswa,
                janji: request.body.janji,
                jumlah_tamu: request.body.jumlah_tamu,
                status: request.body.status,
            };
        } else {
            // If there's a file to upload, first find the existing transaksi_siswa record
            const selectedTransaksiSiswa = await transaksiSiswaModel.findOne({
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
                // Delete the old image file if it exists
                fs.unlink(pathImage, (error) => console.log(error));
            }

            // Update the relevant fields and set the new foto
            dataTransaksiSiswa = {
                id_siswa: request.body.id_siswa,
                janji: request.body.janji,
                jumlah_tamu: request.body.jumlah_tamu,
                status: request.body.status,
                foto: request.file.filename,
            };
        }

        // Update the transaksi_siswa record with the new data
        transaksiSiswaModel.update(dataTransaksiSiswa, { where: { id_transaksiSiswa: id_transaksiSiswa } })
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
    const transaksiSiswa = await transaksiSiswaModel.findOne({ where: { id_transaksiSiswa: id_transaksiSiswa }})
    const oldFotoTransaksiSiswa = transaksiSiswa.foto
    const pathImage = path.join(__dirname, '../foto', oldFotoTransaksiSiswa)

    if(fs.existsSync(pathImage)){
        fs.unlink(pathImage, error => console.log(error))
    }
    
    transaksiSiswaModel.destroy({ where: { id_transaksiSiswa: id_transaksiSiswa } })
        .then(result => {
            return response.json({
                success: true,
                message: "Data siswa has been deleted"
            })
        })
};
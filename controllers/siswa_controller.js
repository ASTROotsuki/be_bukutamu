const siswaModel = require('../models/index').siswa
const Op = require(`sequelize`).Op
const { v4: uuidv4 } = require('uuid');

exports.getAllSiswa = async (request, response) => {
    let siswa = await siswaModel.findAll()
    try {
        if (siswa.length === 0) { 
            return response.status(404).json({
                success: false,
                message: 'Data not found'
            });
        }
        return response.json({
            success: true,
            data: siswa,
            message: 'All siswa have been loaded'
        })
    } catch (error) {
        console.error(error);
        console.log(siswaModel);
        return response.status(500).json({ message: error });
    }
};

exports.findSiswa = async (request, response) => {
    let keyword = request.body.keyword

    let siswa = await siswaModel.findAll({
        where: {
            [Op.or]: [
                { nama_siswa: { [Op.substring]: keyword } },
                { email: { [Op.substring]: keyword } },
                { no_tlp: { [Op.substring]: keyword } },
                { kelas: { [Op.substring]: keyword } }
            ]
        }
    })

    return response.json({
        success: true,
        data: siswa,
        message: `All siswa have beed loaded`
    })
};

exports.addSiswa = (request, response) => {
    let newSiswa = {
        id_siswa: uuidv4(),
        nama_siswa: request.body.nama_siswa,
        email: request.body.email,
        no_tlp: request.body.no_tlp,
        kelas: request.body.kelas

    }

    siswaModel.create(newSiswa)
        .then(result => {
            return response.json({
                success: true,
                data: result,
                message: `New siswa has been inserted`
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
};

exports.updateSiswa = (request, response) => {
    let dataSiswa = {
        nama_siswa: request.body.nama_siswa,
        email: request.body.email,
        no_tlp: request.body.no_tlp,
        kelas: request.body.kelas
    }

    let id_siswa = request.params.id

    siswaModel.update(dataSiswa, { where: { id_siswa: id_siswa } })
        .then(result => {
            return response.json({
                success: true,
                message: `Data siswa has been updated`
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
};

exports.deleteSiswa = (request, response) => {
    let id_siswa = request.params.id

    siswaModel.destroy({ where: { id_siswa: id_siswa } })
        .then(result => {
            return response.json({
                success: true,
                message: "Data siswa has been deleted"
            })
        })
};





const guruModel = require('../models/index').guru;
const Op = require(`sequelize`).Op;
const { v4: uuidv4 } = require('uuid');

exports.getAllGuru = async (request, response) => {
    let guru = await guruModel.findAll()
    try {
        if (guru.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Data not found'
            });
        }
        return response.json({
            success: true,
            data: guru,
            message: 'All guru have been loaded'
        })
    } catch (error) {
        console.error(error);
        console.log(guruModel);
        return response.status(500).json({ message: error });
    }
};

exports.findGuru = async (request, response) => {
    let keyword = request.body.keyword

    let guru = await guruModel.findAll({
        where: {
            [Op.or]: [
                { nama_guru: { [Op.substring]: keyword } },
                { email: { [Op.substring]: keyword } },
                { no_tlp: { [Op.substring]: keyword } }
            ]
        }
    })

    return response.json({
        success: true,
        data: guru,
        message: `All guru have beed loaded`
    })
};

exports.addGuru = (request, response) => {
    let newGuru = {
        id_guru: uuidv4(),
        nama_guru: request.body.nama_guru,
        email: request.body.email,
        no_tlp: request.body.no_tlp

    }

    guruModel.create(newGuru)
        .then(result => {
            return response.json({
                success: true,
                data: result,
                message: `New guru has been inserted`
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
};

exports.updateGuru = (request, response) => {
    let dataGuru = {
        nama_guru: request.body.nama_guru,
        email: request.body.email,
        no_tlp: request.body.no_tlp
    }

    let id_guru = request.params.id

    guruModel.update(dataGuru, { where: { id_guru: id_guru } })
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

exports.deleteGuru = (request, response) => {
    let id_guru = request.params.id

    guruModel.destroy({ where: { id_guru: id_guru } })
        .then(result => {
            return response.json({
                success: true,
                message: "Data siswa has been deleted"
            })
        })
};
const tamuModel = require('../models/index').tamu;
const Op = require( 'sequelize' ).Op;
const uuid = require('uuid');
const uuid4 = uuid.v4();

exports.getAllTamu = async (request, response) => {
    let tamu = await tamuModel.findAll()

    try {
        if (tamu.length === 0) {
            return response.status(404).json({
                success: false,
                message: "Data not found"
            });
        }
        return response.json({
            success: true,
            data: tamu,
            message: 'All tamu have been loaded'
        })
    } catch (error) {
        console.error(error);
        console.log(tamuModel);
        return response.status(500).json({ message: error });
    }
};

exports.findTamu = async (request, response) => {
    let keyword = request.body.keyword

    let tamu = await tamuModelfindAll({
        where: {
            [Op.or]: [
                { nama_tamu: { [Op.substring]: keyword }},
                { no_tlp: { [Op.substring]: keyword }}
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
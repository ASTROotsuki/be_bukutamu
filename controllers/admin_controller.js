const express = require('express');
const adminModel = require('../models/index').admin;
const uuid = require('uuid');
const uuid4 = uuid.v4();
const Op = require('sequelize').Op;
const bcrypt = require('bcrypt');
const upload = require('./upload_foto').single(`foto`);

exports.addAdmin = async (request, response) => {
    const { password } = request.body
    const hashPassword = await bcrypt.hash(password,10)
    let newAdmin = {
        id_admin: uuid4,
        nama_admin: request.body.nama_admin,
        email: request.body.email,
        no_tlp: request.body.no_tlp,
        password: hashPassword,
        foto: request.file.filename,
        role: request.body.role
    };

    adminModel.create(newAdmin)
        .then(result => {
            return response.json({
                success: true,
                data: result,
                message: 'New admin has been inserted'
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
};

exports.getAllAdmin = async (request, response) => {
    let admin = await adminModel.findAll()
    try {
        if (admin.length === 0){
            return response.status(404).json({
                success: false,
                message: 'Data not found'
            });
        }
        return response.json({
            success: true,
            data: admin,
            message: 'All admin have been loaded'
        })
    } catch (error) {
        console.error(error);
        console.log(adminModel);
        return response.status(500).json({ message: error });
    }
};

exports.findAdmin = async (request, response) => {
    let keyword = request.body.keyword

    let admin = await adminModel.findAll({
        where: {
            [Op.or]: [
                { nama_admin: { [Op.substring]: keyword } },
                { email: { [Op.substring]: keyword } },
                { no_tlp: { [Op.substring]: keyword } }
            ]
        }
    })
    return response.json({
        success: true,
        data: admin,
        message: 'All admin have been loaded'
    })
};

exports.updateAdmin = (request, response) => {
    let dataAdmin = {
        nama_admin: request.body.nama_admin,
        email: request.body.email,
        no_tlp: request.body.no_tlp
    }

    let id_admin = request.params.id

    adminModel.update(dataAdmin, { where: { id_admin: id_admin} })
        .then(result => {
            return response.json({
                success: true,
                message: 'Data admin has been updated'
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
};

exports.deleteAdmin = async (request, response) => {
    let id_admin = request.params.id

    adminModel.destroy({ where: { id_admin: id_admin } })
        .then(result => {
            return response.json({
                success: true,
                message: 'Data admin has been deleted'
            })
        })
};
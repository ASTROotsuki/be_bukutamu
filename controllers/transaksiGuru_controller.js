const { transaksi_guru } = require('../models/index');
const tamuModel = require('../models/index').tamu;
const guruModel = require('../models/index').guru;
const { Op } = require(`sequelize`);
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const multer = require('multer');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)
require('moment-timezone');

const deleteOldData = async () => {
    try {
        const today = moment().date();
        const dayOfMonth = 1;

        // Jika hari ini lebih besar dari tanggal 8, maka gunakan bulan berikutnya
        const targetMonth = today >= dayOfMonth ? moment().add(1, 'months') : moment();

        // Set tanggal menjadi 1
        targetMonth.date(dayOfMonth);

        const targetDate = targetMonth.format('YYYY-MM-DD HH:mm:ss');

        console.log('Tanggal penghapusan otomatis:', targetDate);

        const result = await transaksi_guru.destroy({
            where: {
                createdAt: {
                    [Op.lt]: targetDate,
                },
            },
        });

        console.log('Baris yang dihapus:', result);

        console.log('Data lama berhasil dihapus');
    } catch (error) {
        console.error('Error saat menghapus data lama:', error);
    }
};

cron.schedule('0 0 1 * *', async () => {
    console.log('Cron job untuk penghapusan otomatis dimulai');
    await deleteOldData();
    console.log('Penghapusan otomatis selesai');
});


exports.getAllTransaksiGuru = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const ITEMS_PER_PAGE = parseInt(request.query.limit) || 5;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        const filterOptions = {};
        const orderOptions = {
            order: [
                ['createdAt', 'DESC'],
            ],
        };

        // Tambahkan filter berdasarkan tanggal
        const startDate = request.query.startDate;

        if (startDate) {
            const startOfDay = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const endOfDay = moment(startDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

            filterOptions.createdAt = {
                [Op.between]: [startOfDay, endOfDay],
            };
        }

        const searchQuery = request.query.search;
        if (searchQuery) {

            const lowercaseSearchQuery = searchQuery.toLowerCase();

            filterOptions[Op.or] = [
                { '$guru.nama_guru$': { [Op.iLike]: `%${lowercaseSearchQuery}%` } },
                { '$tamu.nama_tamu$': { [Op.iLike]: `%${lowercaseSearchQuery}%` } }
            ];
        }

        let transaksiGuru = await transaksi_guru.findAndCountAll({
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
            order: orderOptions.order,
        });

        const totalItems = transaksiGuru.count;

        // if (totalItems === 0) {
        //     return response.status(404).json({
        //         success: false,
        //         message: 'Data masih belum ada'
        //     });
        // }

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (transaksiGuru.rows.length === 0) {
            return response.status(404).json({
                success: false,
                message: "Data masih belum ada"
            });
        }

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

exports.findTransaksiGuru = async (request, response) => {

    let keyword = request.body.keyword

    let transaksiGuru = await transaksi_guru.findAll({
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
    try {
        upload(request, response, async (error) => {
            if (error) {
                return response.json({ message: error });
            }
            console.log("ini jalan")

            if (!request.file) {
                return response.json({ message: `Nothing to Upload` });
            }

            let newTamu = {
                id_tamu: uuidv4(),
                nama_tamu: request.body.nama_tamu,
                no_tlp: request.body.no_tlp,

            };

            let newTransaksiGuru = {
                id_transaksiGuru: uuidv4(),
                id_tamu: newTamu.id_tamu,
                id_guru: request.body.id_guru,
                janji: request.body.janji,
                asal_instansi: request.body.asal_instansi,
                jumlah_tamu: request.body.jumlah_tamu,
                foto: request.file.filename,
                keterangan: request.body.keterangan

            };
            await tamuModel.create(newTamu);

            try {
                await transaksi_guru.create(newTransaksiGuru);

                const guru = await guruModel.findOne({ where: { id_guru: request.body.id_guru } });
                const email = guru.email;
                const namaGuru = guru.nama_guru;

                sendNotificationEmail(email, namaGuru);


                return response.json({
                    success: true,
                    message: `New form has been inserted`
                });
            } catch (createTransaksiGuru) {
                // If adding a transaksi siswa fails, rollback and delete tamu
                await tamuModel.destroy({ where: { id_tamu: newTamu.id_tamu } });

                throw createTransaksiGuru;
            }
        })
    } catch (error) {
        return response.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

function sendNotificationEmail(email, namaGuru) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Notification',
        html: `<h1><strong>Halo ${namaGuru}, ada yang ingin bertemu denganmu!</strong></h1>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error while sending notification email:', error);
        } else {
            console.log('Notification email sent:', info.response);
        }
    });
}


exports.updateTransaksiGuru = async (request, response) => {
    upload(request, response, async (err) => {
        if (err) {
            return response.json({ message: err });
        }

        let id_transaksiGuru = request.params.id;
        let dataTransaksiGuru = {};

        if (!request.file) {
            dataTransaksiGuru = {
                id_guru: request.body.id_guru,
                janji: request.body.janji,
                jumlah_tamu: request.body.jumlah_tamu,
                keterangan: request.body.keterangan
            };
        } else {
            const selectedTransaksiGuru = await transaksi_guru.findOne({
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
        transaksi_guru.update(dataTransaksiGuru, { where: { id_transaksiGuru: id_transaksiGuru } })
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
    const transaksiGuru = await transaksi_guru.findOne({ where: { id_transaksiGuru: id_transaksiGuru } })
    const oldFotoTransaksiGuru = transaksiGuru.foto
    const pathImage = path.join(__dirname, '../foto', oldFotoTransaksiGuru)

    if (fs.existsSync(pathImage)) {
        fs.unlink(pathImage, error => console.log(error))
    }

    transaksi_guru.destroy({ where: { id_transaksiGuru: id_transaksiGuru } })
        .then(result => {
            return response.json({
                success: true,
                message: "Data guru has been deleted"
            })
        })
};
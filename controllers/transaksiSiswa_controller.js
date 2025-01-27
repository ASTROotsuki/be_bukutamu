const { transaksi_siswa } = require('../models/index');
const tamuModel = require('../models/index').tamu;
const siswaModel = require('../models/index').siswa;
const { Op } = require(`sequelize`);
const moment = require('moment');
const multer = require('multer');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const uuid = require('uuid');
const uuid4 = uuid.v4();
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)


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

        await transaksi_siswa.destroy({
            where: {
                createdAt: {
                    [Op.lt]: targetDate,
                },
            },
        });

        console.log('Baris yang dihapus:', result);

        oldTransaksiSiswa.forEach(async (transaksiSiswa) => {
            const oldFotoTransaksiSiswa = transaksiSiswa.foto;
            const pathImage = path.join(__dirname, '../foto', oldFotoTransaksiSiswa);

            if (fs.existsSync(pathImage)) {
                fs.unlinkSync(pathImage); // Use fs.unlinkSync to remove the file synchronously
            }

            await transaksiSiswa.destroy();
        });

        console.log('Automated deletion completed');
    } catch (error) {
        console.error('Error during automated deletion:', error);
    }
};

cron.schedule('0 0 1 * *', async () => {
    await deleteOldData();
    console.log('Penghapusan otomatis selesai');
});

exports.getAllTransaksiSiswa = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const ITEMS_PER_PAGE = parseInt(request.query.limit) || 5;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        const filterOptions = {};
        const orderOptions = [['createdAt', 'DESC']];

        // Tambahkan filter berdasarkan tanggal jika startDate diberikan
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
            // Ubah searchQuery menjadi huruf kecil
            const lowercaseSearchQuery = searchQuery.toLowerCase();

            filterOptions[Op.or] = [
                { '$siswa.nama_siswa$': { [Op.iLike]: `%${lowercaseSearchQuery}%` } }, // Menggunakan iLike untuk pencarian case-insensitive
                { '$tamu.nama_tamu$': { [Op.iLike]: `%${lowercaseSearchQuery}%` } }
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
            order: orderOptions,
        });

        const totalItems = transaksiSiswa.count;

        // if (totalItems === 0) {
        //     return response.status(404).json({
        //         success: false,
        //         message: 'Data not found'
        //     });
        // }

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (transaksiSiswa.rows.length === 0) {
            return response.status(404).json({
                success: false,
                message: "Data masih belum ada"
            });
        }

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

    let transaksiSiswa = await transaksi_siswa.findAll({
        where: {
            [Op.or]: [
                { id_tamu__nama_tamu: { [Op.substring]: keyword } },
                { id_tamu__no_tlp: { [Op.substring]: keyword } },
                { id_siswa__nama_siswa: { [Op.substring]: keyword } },
                { janji: { [Op.substring]: keyword } },
                { jumlah_tamu: { [Op.substring]: keyword } }
            ]
        }
    })

    return response.json({
        success: true,
        data: transaksiSiswa,
        message: `All transaksi have beed loaded`
    })
};

exports.addTransaksiSiswa = async (request, response) => {
    try {
        upload(request, response, async (error) => {
            if (error) {
                return response.json({ message: error });
            }
            console.log("ini jalan")

            if (!request.file) {
                return response.json({ message: `Nothing to Upload` });
            }

            const newTamu = {
                id_tamu: uuidv4(),
                nama_tamu: request.body.nama_tamu,
                no_tlp: request.body.no_tlp,
            };

            const newTransaksiSiswa = {
                id_transaksiSiswa: uuidv4(),
                id_tamu: newTamu.id_tamu,
                id_siswa: request.body.id_siswa,
                janji: request.body.janji,
                jumlah_tamu: request.body.jumlah_tamu,
                foto: request.file.filename,
                keterangan: request.body.keterangan,
            };

            await tamuModel.create(newTamu);

            try {
                await transaksi_siswa.create(newTransaksiSiswa);

                const siswa = await siswaModel.findOne({ where: { id_siswa: request.body.id_siswa } });
                const email = siswa.email;
                const namaSiswa = siswa.nama_siswa;

                sendNotificationEmail(email, namaSiswa);

                return response.json({
                    success: true,
                    message: `New form has been inserted`,
                });
            } catch (createTransaksiSiswaError) {
                // If adding a transaksi siswa fails, rollback and delete tamu
                await tamuModel.destroy({ where: { id_tamu: newTamu.id_tamu } });

                throw createTransaksiSiswaError;
            }
        })
    } catch (error) {
        return response.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

function sendNotificationEmail(email, namaSiswa) {
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
        html: `<h1><strong>Halo ${namaSiswa}, ada yang ingin bertemu denganmu!</strong></h1>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error while sending notification email:', error);
        } else {
            console.log('Notification email sent:', info.response);
        }
    });
}


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
                keterangan: request.body.keterangan
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
                foto: request.file.filename,
                keterangan: request.body.keterangan
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
    const transaksiSiswa = await transaksi_siswa.findOne({ where: { id_transaksiSiswa: id_transaksiSiswa } })
    const oldFotoTransaksiSiswa = transaksiSiswa.foto
    const pathImage = path.join(__dirname, '../foto', oldFotoTransaksiSiswa)

    if (fs.existsSync(pathImage)) {
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
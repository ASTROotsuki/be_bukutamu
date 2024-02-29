const transaksiKurirModel = require('../models/index').transaksi_kurir
const tamuModel = require('../models/index').tamu
const transaksiKurirSiswaModel = require('../models/index').transaksi_kurirSiswa
const transaksiKurirGuruModel = require('../models/index').transaksi_kurirGuru
const siswaModel = require('../models/index').siswa
const guruModel = require('../models/index').guru
const Op = require(`sequelize`).Op
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const upload = require('./upload_foto').single(`foto`)

const dotenv = require('dotenv')
dotenv.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_ACCOUNT_TOKEN;
const fromNumber = 'whatsapp:+17815377402'

const twilio = require('twilio');
const { request } = require('http')
const client = twilio(accountSid, authToken);
async function sendWhatsAppNotification(phoneNumber, message) {
    try {
        const formattedPhoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;

        const messageResult = await client.messages.create({
            body: "p ada paket",
            from: fromNumber,
            to: `whatsapp:${formattedPhoneNumber}`
        });

        console.log(`WhatsApp message sent with SID: ${messageResult.sid}`);
    } catch (error) {
        console.error(`Error sending WhatsApp message: ${error.message}`);
    }
}

exports.getAllMoklet = async (request, response) =>{
    try {
        const allSiswa = await siswaModel.findAll();
        const allGuru = await guruModel.findAll();

        return response.json({
            success: true,
            data: {
                siswa: allSiswa,
                guru: allGuru,
            },
            message: 'All students and teachers data loaded successfully',
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: error.message });
    }
}
exports.getAllTransaksiKurir = async (request, response) => {
    let transaksiKurir = await transaksiKurirModel.findAll()
    try {
        if (transaksiKurir.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Data not found'
            });
        }
        return response.json({
            success: true,
            data: transaksiKurir,
            message: 'All Form have been loaded'
        })
    } catch (error) {
        console.error(error);
        console.log(transaksiKurirModel);
        return response.status(500).json({ message: error });
    }
};

// exports.findTransaksiKurir = async (request, response) => {

//     let keyword = request.body.keyword

//     let transaksiKurir = await transaksiKurirModel.findAll({
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
            foto: request.file.filename

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
            await transaksiKurirModel.create(newTransaksiKurir);

            if (request.body.id_guru) {
                const guru = await guruModel.findOne({
                    where: { id_guru: request.body.id_guru }
                });
                if (guru) {
                    // Menggunakan nomor telepon dari data Guru
                    await transaksiKurirGuruModel.create(newTransaksiKurirGuru);
                    await sendWhatsAppNotification(guru.no_tlp, `New form created!`);
                }
            }

            if (request.body.id_siswa) {
                const siswa = await siswaModel.findOne({
                    where: { id_siswa: request.body.id_siswa }
                });
                if (siswa) {
                    // Menggunakan nomor telepon dari data Siswa
                    await transaksiKurirSiswaModel.create(newTransaksiKurirSiswa);
                    await sendWhatsAppNotification(siswa.no_tlp, `New form created!`);
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
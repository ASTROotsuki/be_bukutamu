const db = require('../models');
const { Op } = require('sequelize');
const http = require('http');
const { transaksi_guru } = require('../models/index');
const { transaksi_kurir } = require('../models/index');
const { transaksi_siswa } = require('../models/index');

async function getTotalVisitors() {
    try {
        const totalTamuUmumGuru = await transaksi_guru.count();
        const totalTamuUmumSiswa = await transaksi_siswa.count();
        const totalTamuUmum = totalTamuUmumGuru + totalTamuUmumSiswa;
        const totalLayananKirim = await transaksi_kurir.count();
        const totalKeseluruhan = totalTamuUmum + totalLayananKirim;
        return { totalTamuUmum, totalLayananKirim, totalKeseluruhan };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Fungsi untuk menghitung jumlah pengunjung minggu ini
async function getWeeklyVisitors() {
    try {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalTamuUmumGuru, totalTamuUmumSiswa] = await Promise.all([
            transaksi_guru.count({
                where: {
                    createdAt: {
                        [Op.between]: [oneWeekAgo, today]
                    }
                }
            }),
            transaksi_siswa.count({
                where: {
                    createdAt: {
                        [Op.between]: [oneWeekAgo, today]
                    }
                }
            })
        ]);

        const totalTamuUmumMingguIni = totalTamuUmumGuru + totalTamuUmumSiswa;

        const totalLayananKirimMingguIni = await transaksi_kurir.count({
            where: {
                createdAt: {
                    [Op.between]: [oneWeekAgo, today]
                }
            }
        });

        const totalMingguIni = totalTamuUmumMingguIni + totalLayananKirimMingguIni;

        return { totalTamuUmumMingguIni, totalLayananKirimMingguIni, totalMingguIni };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Panggil fungsi untuk mendapatkan statistik pengunjung dan jumlah pengunjung minggu ini
async function main() {
    try {
        const totalVisitors = await getTotalVisitors();
        console.log('Total Pengunjung Tamu Umum:', totalVisitors.totalTamuUmum);
        console.log('Total Pengunjung Layanan Kirim:', totalVisitors.totalLayananKirim);
        console.log('Total Pengunjung Keseluruhan:', totalVisitors.totalKeseluruhan);

        const weeklyVisitors = await getWeeklyVisitors();
        console.log('Total Pengunjung Tamu Umum Minggu Ini:', weeklyVisitors.totalTamuUmumMingguIni);
        console.log('Total Pengunjung Layanan Kirim Minggu Ini:', weeklyVisitors.totalLayananKirimMingguIni);
        console.log('Total Pengunjung Minggu Ini:', weeklyVisitors.totalMingguIni);
    } catch (error) {
        console.error('Error:', error);
    }
}

const server = http.createServer(async (request, response) => {
    response.writeHead(200, { 'Content-Type': 'image/svg+xml' });

    try {
        // Panggil getTotalVisitors untuk mendapatkan total pengunjung
        const { totalTamuUmum, totalLayananKirim, totalKeseluruhan } = await getTotalVisitors();

        // Hitung presentase
        const percentageTamuUmum = (totalTamuUmum / totalKeseluruhan) * 100;
        const percentageLayananKirim = (totalLayananKirim / totalKeseluruhan) * 100;

        // Buat kode SVG
        const svg = `
            <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                <circle cx="200" cy="200" r="100" fill="#FF6384" stroke="white" stroke-width="2" />
                <circle cx="200" cy="200" r="100" fill="transparent" stroke="#36A2EB" stroke-width="2" stroke-dasharray="${percentageTamuUmum} ${100 - percentageTamuUmum}" stroke-dashoffset="25" transform="rotate(-90 200 200)" />
                <text x="100" y="200" font-family="Arial" font-size="20" fill="black">Tamu Umum</text>
                <text x="300" y="200" font-family="Arial" font-size="20" fill="black">Layanan Kirim</text>
            </svg>
        `;

        // kirim kode SVG sebagai respons
        response.end(svg);
    } catch (error) {
        console.error('Error:', error);
        response.statusCode = 500;
        response.end('Internal Server Error');
    }
});

module.exports = { getTotalVisitors, getWeeklyVisitors };
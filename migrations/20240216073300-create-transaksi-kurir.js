'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaksi_kurir', {
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      id_tamu: {
        type: Sequelize.UUID,
        references: {
          model: "tamu",
          key: "uuid"
        }
      },
      asal_instansi: {
        type: Sequelize.STRING
      },
      tanggal_dititipkan: {
        type: Sequelize.DATE
      },
      tanggal_diterima: {
        type: Sequelize.STRING
      },
      foto: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('Selesai', 'Proses', 'Gagal')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transaksi_kurir');
  }
};
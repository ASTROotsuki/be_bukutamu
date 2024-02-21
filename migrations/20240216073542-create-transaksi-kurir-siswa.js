'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaksi_kurirSiswa', {
      uuid: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      id_transaksiKurir: {
        type: Sequelize.UUID,
        references: {
          model: "transaksi_kurir",
          key: "uuid"
        }
      },
      id_siswa: {
        type: Sequelize.UUID,
        references: {
          model: "siswa",
          key: "uuid"
        }
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
    await queryInterface.dropTable('transaksi_kurirSiswa');
  }
};
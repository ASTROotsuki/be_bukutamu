'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaksi_siswa', {
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
      id_siswa: {
        type: Sequelize.UUID,
        references: {
          model: "siswa",
          key: "uuid"
        }
      },
      janji: {
        type: Sequelize.ENUM('Ada', 'TidakAda')
      },
      jumlah_tamu: {
        type: Sequelize.INTEGER
      },
      keterangan: {
        type: Sequelize.TEXT
      },
      foto: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('transaksi_siswa');
  }
};
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaksi_guru', {
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
      id_guru: {
        type: Sequelize.UUID,
        references: {
          model: "guru",
          key: "uuid"
        }
      },
      janji: {
        type: Sequelize.ENUM('Ada', 'TidakAda')
      },
      asal_instansi: {
        type: Sequelize.STRING
      },
      jumlah_tamu: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('Selesai', 'Proses', 'Gagal')
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
    await queryInterface.dropTable('transaksi_guru');
  }
};
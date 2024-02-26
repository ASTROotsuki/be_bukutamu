'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaksi_siswa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      transaksi_siswa.belongsTo(models.siswa, { foreignKey: 'id_siswa' });
      transaksi_siswa.belongsTo(models.tamu, { foreignKey: 'id_tamu' });
    }
  }
  transaksi_siswa.init({
    id_transaksiSiswa: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_tamu: DataTypes.UUID,
    id_siswa: DataTypes.UUID,
    janji: DataTypes.ENUM('Ada', 'TidakAda'),
    jumlah_tamu: DataTypes.INTEGER,
    status: DataTypes.ENUM('Selesai', 'Proses', 'Gagal'),
    foto: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'transaksi_siswa',
    tableName: 'transaksi_siswa'
  });
  return transaksi_siswa;
};
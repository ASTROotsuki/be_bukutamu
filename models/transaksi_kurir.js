'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaksi_kurir extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      transaksi_kurir.belongsTo(models.tamu, { foreignKey: 'id_tamu' });
      transaksi_kurir.belongsTo(models.kurirSiswa, { foreignKey: 'id_kurirSiswa' });
      transaksi_kurir.belongsTo(models.kurirGuru, { foreignKey: 'id_kurirGuru' });
    }
  }
  transaksi_kurir.init({
    id_transaksiKurir: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_tamu: DataTypes.UUID,
    asal_instansi: DataTypes.STRING,
    tanggal_dititipkan: DataTypes.DATE,
    tanggal_diterima: DataTypes.STRING,
    status: DataTypes.ENUM("Proses", "Gagal", "Selesai"),
    foto: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'transaksi_kurir',
    tableName: 'transaksi_kurir'
  });
  return transaksi_kurir;
};
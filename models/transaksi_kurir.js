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
      transaksi_kurir.belongsTo(models.tamu, { foreignKey: 'uuid' });
    }
  }
  transaksi_kurir.init({
    id_transaksiKurir: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    id_tamu: DataTypes.UUID,
    asal_instansi: DataTypes.STRING,
    tanggal_dititipkan: DataTypes.DATE,
    tanggal_diterima: DataTypes.STRING,
    foto: DataTypes.STRING,
    status: DataTypes.ENUM('Selesai', 'Proses', 'Gagal')
  }, {
    sequelize,
    modelName: 'transaksi_kurir',
    tableName: 'transaksi_kurir'
  });
  return transaksi_kurir;
};
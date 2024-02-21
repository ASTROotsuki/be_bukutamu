'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaksi_guru extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      transaksi_guru.belongsTo(models.tamu, { foreignKey: 'uuid' });
      transaksi_guru.belongsTo(models.guru, { foreignKey: 'uuid' });
    }
  }
  transaksi_guru.init({
    id_transaksiGuru: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    id_tamu: DataTypes.UUID,
    id_guru: DataTypes.UUID,
    janji: DataTypes.ENUM('Ada', 'TidakAda'),
    asal_instansi: DataTypes.STRING,
    jumlah_tamu: DataTypes.INTEGER,
    status: DataTypes.ENUM('Selesai', 'Proses', 'Gagal'),
    foto: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'transaksi_guru',
    tableName: 'transaksi_guru'
  });
  return transaksi_guru;
};
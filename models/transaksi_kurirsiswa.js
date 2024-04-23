'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaksi_kurirSiswas extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      transaksi_kurirSiswas.belongsTo(models.transaksi_kurir, { foreignKey: 'id_transaksiKurir' });
      transaksi_kurirSiswas.belongsTo(models.siswa, { foreignKey: 'id_siswa' });
    }
  }
  transaksi_kurirSiswas.init({
    id_kurirSiswa: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    id_transaksiKurir: DataTypes.UUID,
    id_siswa: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'transaksi_kurirSiswas',
    tableName: 'transaksi_kurirSiswas'
  });
  return transaksi_kurirSiswas;
};

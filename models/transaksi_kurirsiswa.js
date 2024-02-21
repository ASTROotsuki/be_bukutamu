'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaksi_kurirSiswa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      transaksi_kurirSiswa.belongsTo(models.transaksi_kurir, { foreignKey: 'id_transaksiKurir' });
      transaksi_kurirSiswa.belongsTo(models.siswa, { foreignKey: 'id_siswa' });
    }
  }
  transaksi_kurirSiswa.init({
    id_kurirSiswa: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    id_transaksiKurir: DataTypes.UUID,
    id_siswa: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'transaksi_kurirSiswa',
    tableName: 'transaksi_kurirSiswa'
  });
  return transaksi_kurirSiswa;
};
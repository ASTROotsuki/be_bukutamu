'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tamu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tamu.hasMany(models.transaksi_siswa, { foreignKey: 'id_tamu' });
      tamu.hasMany(models.transaksi_guru, { foreignKey: 'id_tamu' });
    }
  }
  tamu.init({
    id_tamu: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    nama_tamu: DataTypes.STRING,
    no_tlp: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'tamu',
    tableName: 'tamu'
  });
  return tamu;
};
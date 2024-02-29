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
      transaksi_guru.belongsTo(models.tamu, { foreignKey: 'id_tamu' });
      transaksi_guru.belongsTo(models.guru, { foreignKey: 'id_guru' });
    }
  }
  transaksi_guru.init({
    id_transaksiGuru: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_tamu: DataTypes.UUID,
    id_guru: DataTypes.UUID,
    janji: DataTypes.ENUM('Ada', 'TidakAda'),
    asal_instansi: DataTypes.STRING,
    jumlah_tamu: DataTypes.INTEGER,
    foto: DataTypes.STRING,
    keterangan: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'transaksi_guru',
    tableName: 'transaksi_guru'
  });
  return transaksi_guru;
};
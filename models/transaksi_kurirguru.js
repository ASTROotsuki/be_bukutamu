'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaksi_kurirGuru extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      transaksi_kurirGuru.belongsTo(models.transaksi_kurir, { foreignKey: 'id_transaksiKurir' });
      transaksi_kurirGuru.belongsTo(models.guru, { foreignKey: 'id_guru' });
    }
  }
  transaksi_kurirGuru.init({
    id_kurirGuru: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    id_transaksiKurir: DataTypes.UUID,
    id_guru: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'transaksi_kurirGuru',
    tableName: 'transaksi_kurirGuru'
  });
  return transaksi_kurirGuru;
};

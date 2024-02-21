'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class guru extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      guru.hasMany(models.transaksi_guru, { foreignKey: 'id_guru' });
    }
  }
  guru.init({
    id_guru: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    nama_guru: DataTypes.STRING,
    email: DataTypes.STRING,
    no_tlp: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'guru',
    tableName: 'guru'
  });
  return guru;
};
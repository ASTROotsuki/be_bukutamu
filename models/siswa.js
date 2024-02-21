'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class siswa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      siswa.hasMany(models.transaksi_siswa, { foreignKey: 'id_siswa' });
    }
  }
  siswa.init({
    id_siswa: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    nama_siswa: DataTypes.STRING,
    email: DataTypes.STRING,
    kelas: DataTypes.STRING,
    no_tlp: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'siswa',
    tableName: 'siswa'
  });
  return siswa;
};
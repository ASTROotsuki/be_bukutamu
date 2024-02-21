'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  admin.init({
    id_admin: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    nama_admin: DataTypes.STRING,
    email: DataTypes.STRING,
    no_tlp: DataTypes.STRING,
    password: DataTypes.STRING,
    foto: DataTypes.STRING,
    role: DataTypes.ENUM('Satpam', 'Resepsionis')
  }, {
    sequelize,
    modelName: 'admin',
    tableName: 'admin'
  });
  return admin;
};
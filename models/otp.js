'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class otp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The models/index file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  otp.init({
    id_otp: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    email: DataTypes.STRING,
    otp: DataTypes.STRING,
    otpExpiration: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'otp',
    tableName: 'otp'
  });
  return otp;
};
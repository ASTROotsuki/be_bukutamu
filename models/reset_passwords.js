'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class reset_passwords extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  reset_passwords.init({
    id_reset: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    email: DataTypes.STRING,
    token: DataTypes.STRING,
    expires_at: DataTypes.DATE,
    used: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'reset_passwords',
    tableName: 'reset_passwords'
  });
  return reset_passwords;
};
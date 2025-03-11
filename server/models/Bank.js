const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Bank extends Model {}

Bank.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prefix: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 3]
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jwksUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Bank',
  timestamps: true
});

module.exports = Bank;
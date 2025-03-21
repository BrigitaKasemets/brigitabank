const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Account extends Model {
  // Static method to generate account number
  static generateAccountNumber(bankPrefix) {
    // Generate a random 10-digit number
    const randomDigits = Math.floor(Math.random() * 9000000000) + 1000000000;
    // Ensure the bank prefix is properly used
    return `${bankPrefix}${randomDigits}`;
  }
}

Account.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 30.00
  },
  currency: {
    type: DataTypes.ENUM('EUR', 'USD', 'GBP'),
    defaultValue: 'EUR'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blocked'),
    defaultValue: 'active'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Account',
  timestamps: true
});

module.exports = Account;
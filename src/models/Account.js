const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

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
    type: DataTypes.STRING(50),
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Main Account'
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 30.00
  },
  currencyId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Currencies',
      key: 'id'
    },
    allowNull: true
  },
  currency: {
    type: DataTypes.ENUM('EUR', 'USD', 'GBP'),
    defaultValue: 'EUR',
    comment: 'Legacy field, use currencyId instead'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blocked'),
    defaultValue: 'active'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Is this the default account for the user?'
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Account',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['accountNumber'] },
    { fields: ['status'] }
  ]
});

// Define associations - will be called in models/index.js
Account.associate = (models) => {
  Account.belongsTo(models.User, { foreignKey: 'userId' });
  Account.belongsTo(models.Currency, { foreignKey: 'currencyId' });
  Account.hasMany(models.Transaction, {
    as: 'sentTransactions',
    foreignKey: 'accountFromId'
  });
  Account.hasMany(models.Transaction, {
    as: 'receivedTransactions',
    foreignKey: 'accountToId'
  });
};

module.exports = Account;
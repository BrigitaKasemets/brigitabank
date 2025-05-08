// server/models/Transaction.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Transaction extends Model {}

Transaction.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
    comment: 'UUID for the transaction'
  },
  accountFrom: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Source account number'
  },
  accountTo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Destination account number'
  },
  accountFromId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Accounts',
      key: 'id'
    },
    comment: 'Foreign key to source account'
  },
  accountToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Accounts',
      key: 'id'
    },
    comment: 'Foreign key to destination account'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isPositive(value) {
        if (parseFloat(value) <= 0) {
          throw new Error('Amount must be a positive number');
        }
      }
    }
  },
  currency: {
    type: DataTypes.ENUM('EUR', 'USD', 'GBP'),
    allowNull: false,
    comment: 'Legacy currency field - use currencyId instead'
  },
  currencyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Currencies',
      key: 'id'
    },
    comment: 'Foreign key to currency'
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: 'Exchange rate if currency conversion was applied'
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Transaction description'
  },
  reference: {
    type: DataTypes.STRING(35),
    allowNull: true,
    comment: 'Reference number or code'
  },
  senderName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  receiverName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'rejected'),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('internal', 'outgoing', 'incoming'),
    allowNull: false
  },
  processingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Fee charged for the transaction'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metaData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional JSON data about the transaction'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the transaction was completed'
  }
}, {
  sequelize,
  modelName: 'Transaction',
  timestamps: true,
  indexes: [
    // Add indexes for faster queries
    { fields: ['transactionId'] },
    { fields: ['accountFrom', 'accountTo'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
});

// Define associations - these will be called in an index file where all models are imported
Transaction.associate = (models) => {
  Transaction.belongsTo(models.Account, {
    as: 'fromAccount',
    foreignKey: 'accountFromId'
  });
  Transaction.belongsTo(models.Account, {
    as: 'toAccount',
    foreignKey: 'accountToId'
  });
  Transaction.belongsTo(models.Currency, {
    foreignKey: 'currencyId'
  });
};

// Static method to create transaction record with proper validation
Transaction.createTransaction = async function(transactionData, transaction) {
  // Validate transaction data
  if (!transactionData.accountFrom || !transactionData.accountTo) {
    throw new Error('Source and destination accounts are required');
  }

  if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // Create the transaction record
  return await Transaction.create(transactionData, { transaction });
};

module.exports = Transaction;
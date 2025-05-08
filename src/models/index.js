// server/models/index.js
const { sequelize } = require('../config/db');
const User = require('./User');
const Account = require('./Account');
const Transaction = require('./Transaction');
const BlacklistedToken = require('./BlacklistedToken');
const Role = require('./Role');
const Currency = require('./Currency');

// Define associations between models
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

User.hasMany(Account, { foreignKey: 'userId' });
Account.belongsTo(User, { foreignKey: 'userId' });

Account.belongsTo(Currency, { foreignKey: 'currencyId' });
Currency.hasMany(Account, { foreignKey: 'currencyId' });

// Transactions have two associations with accounts (from and to)
Transaction.belongsTo(Account, { as: 'fromAccount', foreignKey: 'accountFromId' });
Transaction.belongsTo(Account, { as: 'toAccount', foreignKey: 'accountToId' });
Account.hasMany(Transaction, { as: 'sentTransactions', foreignKey: 'accountFromId' });
Account.hasMany(Transaction, { as: 'receivedTransactions', foreignKey: 'accountToId' });

// Transactions are in a specific currency
Transaction.belongsTo(Currency, { foreignKey: 'currencyId' });
Currency.hasMany(Transaction, { foreignKey: 'currencyId' });

// Export all models
module.exports = {
    sequelize,
    User,
    Account,
    Transaction,
    BlacklistedToken,
    Role,
    Currency
};
require('dotenv').config();
const { sequelize } = require('./db');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Role = require('../models/Role');
const Currency = require('../models/Currency');

const initializeDatabase = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Kõik andmebaasi tabelid on edukalt loodud');

    // Create roles
    console.log('Rollide loomine...');
    const adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator with full access',
      permissions: JSON.stringify(['all'])
    });

    const userRole = await Role.create({
      name: 'user',
      description: 'Regular user',
      permissions: JSON.stringify(['read', 'create_transaction', 'manage_own_accounts'])
    });

    const guestRole = await Role.create({
      name: 'guest',
      description: 'Guest with limited access',
      permissions: JSON.stringify(['read'])
    });

    // Create currencies
    console.log('Valuutade loomine...');
    const eurCurrency = await Currency.create({
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      exchangeRate: 1.0,
      isActive: true,
      lastUpdated: new Date()
    });

    const usdCurrency = await Currency.create({
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      exchangeRate: 1.08,
      isActive: true,
      lastUpdated: new Date()
    });

    const gbpCurrency = await Currency.create({
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      exchangeRate: 0.85,
      isActive: true,
      lastUpdated: new Date()
    });

    // Create demo user - don't hash password manually
    const user = await User.create({
      fullName: 'Demo Kasutaja',
      username: 'user@brigitabank.com',
      password: 'user123',  // Raw password, hook will hash it
      roleId: userRole.id,
      role: 'user'
    });

    // Create admin user
    await User.create({
      fullName: 'Admin Kasutaja',
      username: 'admin@brigitabank.com',
      password: 'admin123',
      roleId: adminRole.id,
      role: 'admin'
    });

    // Create accounts for demo user
    const euroAccount = await Account.create({
      accountNumber: 'ABC12345678901234567890',
      userId: user.id,
      balance: 1000,
      currencyId: eurCurrency.id,
      currency: 'EUR',
      status: 'active'
    });

    const usdAccount = await Account.create({
      accountNumber: 'ABC98765432109876543210',
      userId: user.id,
      balance: 500,
      currencyId: usdCurrency.id,
      currency: 'USD',
      status: 'active'
    });

    // Create a sample transaction
    await Transaction.create({
      transactionId: '12345678-1234-1234-1234-123456789012',
      accountFrom: euroAccount.accountNumber,
      accountTo: usdAccount.accountNumber,
      accountFromId: euroAccount.id,
      accountToId: usdAccount.id,
      amount: 100,
      currencyId: eurCurrency.id,
      currency: 'EUR',
      explanation: 'Demo tehing',
      senderName: `${user.fullName}`,
      receiverName: `${user.fullName}`,
      status: 'completed',
      type: 'internal'
    });

    console.log('Demo andmed on edukalt lisatud andmebaasi');
    process.exit(0);
  } catch (err) {
    console.error('Andmebaasi initsialiseerimise viga:', err);
    process.exit(1);
  }
};

initializeDatabase();
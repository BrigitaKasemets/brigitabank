// server/config/init-db.js
require('dotenv').config();
const { sequelize } = require('./db');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const initializeDatabase = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Kõik andmebaasi tabelid on edukalt loodud');

    // Create demo user - don't hash password manually
    const user = await User.create({
      fullName: 'Demo Kasutaja',
      username: 'user@brigitabank.com',
      password: 'user123',  // Raw password, hook will hash it
    });

    // Create accounts for demo user
    const euroAccount = await Account.create({
      accountNumber: 'ABC12345678901234567890',
      userId: user.id,
      balance: 1000,
      currency: 'EUR'
    });

    const usdAccount = await Account.create({
      accountNumber: 'ABC98765432109876543210',
      userId: user.id,
      balance: 500,
      currency: 'USD'
    });

    // Create a sample transaction
    await Transaction.create({
      transactionId: '12345678-1234-1234-1234-123456789012',
      accountFrom: euroAccount.accountNumber,
      accountTo: usdAccount.accountNumber,
      amount: 100,
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
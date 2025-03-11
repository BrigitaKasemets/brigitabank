require('dotenv').config();
const { sequelize } = require('./db');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const bcrypt = require('bcryptjs');

const initializeDatabase = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Kõik andmebaasi tabelid on edukalt loodud');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@brigitabank.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create demo user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      firstName: 'Demo',
      lastName: 'User',
      email: 'user@brigitabank.com',
      password: userPassword,
      role: 'user'
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

    // Register our bank
    await Bank.create({
      prefix: 'ABC',
      name: 'Brigita Bank',
      transactionUrl: 'http://localhost:3000/transactions/b2b',
      jwksUrl: 'http://localhost:3000/transactions/jwks',
      apiKey: 'brigitabank-api-key'
    });

    // Register partner bank for testing
    await Bank.create({
      prefix: 'XYZ',
      name: 'Partner Bank',
      transactionUrl: 'http://localhost:3001/transactions/b2b',
      jwksUrl: 'http://localhost:3001/transactions/jwks',
      apiKey: 'partnerbank-api-key'
    });

    // Create a sample transaction
    await Transaction.create({
      transactionId: '12345678-1234-1234-1234-123456789012',
      accountFrom: euroAccount.accountNumber,
      accountTo: usdAccount.accountNumber,
      amount: 100,
      currency: 'EUR',
      explanation: 'Demo tehing',
      senderName: `${user.firstName} ${user.lastName}`,
      receiverName: `${user.firstName} ${user.lastName}`,
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
// Import required packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/db');
const swaggerSpec = require('./config/swagger');
const swaggerUi = require('swagger-ui-express');

// Import route files
const usersRoutes = require('./routes/users');
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const sessionsRoutes = require('./routes/sessions');
const banksRoutes = require('./routes/banks');
const b2bRoutes = require('./routes/b2b');

// Initialize Express app
const app = express();


// Central Bank mock routes (must be defined after app initialization)
if (process.env.TEST_MODE === 'true') {
  console.log('Running in TEST_MODE - Central Bank API mocked');

  app.get('/api/central-bank/banks', (req, res) => {
    const { centralBankApi } = require('./utils/centralBankApi');
    res.json(centralBankApi.getAllBanks());
  });

  app.get('/api/central-bank/banks/:prefix', (req, res) => {
    const { centralBankApi } = require('./utils/centralBankApi');
    const bank = centralBankApi.getBankByPrefix(req.params.prefix);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.json(bank);
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(cors());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/banks', banksRoutes);
app.use('/transactions/b2b', b2bRoutes);

// JWKS endpoint (separate from banks routes)
app.get('/transactions/jwks', (req, res) => {
  const keys = require('./config/keys');
  res.json(keys.getJwks());
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Server error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Set port and start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BrigitaBank server running on port ${PORT}`);
});

module.exports = app;
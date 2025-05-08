// server/brigitabank.js (Updated)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerSpec = require('./config/swagger');
const swaggerUi = require('swagger-ui-express');
const { setupMaintenanceTasks } = require('./utils/maintenanceTasks');

// Initialize database models and relationships
require('./models/index');

// Import route files
const usersRoutes = require('./routes/users');
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const sessionsRoutes = require('./routes/sessions');
const banksRoutes = require('./routes/banks');
const b2bRoutes = require('./routes/b2b');
const rolesRoutes = require('./routes/roles'); // New roles routes
const currenciesRoutes = require('./routes/currencies'); // New currencies routes

// Initialize Express app
const app = express();
setupMaintenanceTasks();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: 'http://localhost:5000' // Teie frontendi aadress arenduses
}));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.send('BrigitaBank API server is running');
});

// JWKS endpoints
app.get('/banks/jwks', (req, res) => {
  const keys = require('./config/keys');
  res.json(keys.getJwks());
});

app.get('/transactions/jwks', (req, res) => {
  const keys = require('./config/keys');
  res.json(keys.getJwks());
});

// API routes
app.use('/users', usersRoutes);
app.use('/accounts', accountsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/banks', banksRoutes);
app.use('/transactions/b2b', b2bRoutes);
app.use('/roles', rolesRoutes); // Add roles routes
app.use('/currencies', currenciesRoutes); // Add currencies routes

// API endpoint for system information
app.get('/api/system', (req, res) => {
  res.json({
    version: '1.0',
    name: 'BrigitaBank',
    description: 'Bank interoperability system',
    bankPrefix: process.env.BANK_PREFIX || 'N/A'
  });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BrigitaBank server running on port ${PORT}`);
});

module.exports = app;
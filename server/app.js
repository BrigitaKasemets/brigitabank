require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Keskpanga matkimine testimiseks
const TEST_MODE = process.env.TEST_MODE === 'true';

// Import models for association setup
const User = require('./models/User');
const Account = require('./models/Account');
const Transaction = require('./models/Transaction');
const Bank = require('./models/Bank');

// Set up database associations
User.hasMany(Account, { foreignKey: 'userId' });
Account.belongsTo(User, { foreignKey: 'userId' });

// Marsruutide import
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const b2bRoutes = require('./routes/b2b');

// Andmebaasi ühendus
const { connectDB, sequelize } = require('./config/db');
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// EJS vaateraamistiku seadistamine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Staatiliste failide serveerimine
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Marsruudid
app.use('/api/users', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/banks/transactions', b2bRoutes);

// Frontend routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.get('/accounts', (req, res) => {
  res.render('dashboard'); // For now reuse dashboard - can create dedicated view later
});

app.get('/transactions', (req, res) => {
  res.render('dashboard'); // For now reuse dashboard - can create dedicated view later
});

app.get('/profile', (req, res) => {
  res.render('dashboard'); // For now reuse dashboard - can create dedicated view later
});

// 404 leht
app.use((req, res) => {
  res.status(404).render('404');
});

// Sync database models (in development mode only)
if (process.env.NODE_ENV === 'development') {
 // sequelize.sync({ alter: true })
  //  .then(() => {
  //    console.log('Database synced');
   // })
   // .catch(err => {
  //   console.error('Error syncing database:', err);
   // });
}

// Pordi seadistamine
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server käib pordil ${PORT}`));

module.exports = app;
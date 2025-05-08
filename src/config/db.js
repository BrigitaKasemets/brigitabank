const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false,
});

// Function to connect to the database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite andmebaasi ühendus loodud');
  } catch (err) {
    console.error('SQLite andmebaasi ühenduse viga:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
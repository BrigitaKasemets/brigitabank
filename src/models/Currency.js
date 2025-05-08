const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Currency extends Model {}

Currency.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        unique: true,
        comment: 'ISO 4217 currency code (e.g., EUR, USD, GBP)'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    symbol: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    exchangeRate: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
        comment: 'Exchange rate relative to base currency (EUR)'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
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
    modelName: 'Currency',
    timestamps: true
});

module.exports = Currency;
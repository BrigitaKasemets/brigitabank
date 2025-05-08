const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * BlacklistedToken model
 * Used to store invalidated JWT tokens (from logouts, etc.)
 * until their natural expiration time
 */
const BlacklistedToken = sequelize.define('BlacklistedToken', {
    token: {
        type: DataTypes.TEXT, // TEXT type for potentially long JWT tokens
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        // Index on expiresAt for efficient cleanup queries
        { fields: ['expiresAt'] }
    ]

});

// Method to check if a token is blacklisted
BlacklistedToken.isBlacklisted = async function(token) {
    const blacklistedToken = await BlacklistedToken.findOne({ where: { token } });
    return !!blacklistedToken;
};

// Initialize model
(async () => {
    try {
        await BlacklistedToken.sync();
    } catch (error) {
        console.error('Error syncing BlacklistedToken model:', error);
    }
})();

module.exports = BlacklistedToken;
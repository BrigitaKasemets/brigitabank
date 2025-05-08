const BlacklistedToken = require('../models/BlacklistedToken');
const { Op } = require('sequelize');

// Clean up expired blacklisted tokens
const cleanupExpiredTokens = async () => {
    try {
        const now = new Date();
        const result = await BlacklistedToken.destroy({
            where: {
                expiresAt: { [Op.lt]: now }
            }
        });
        console.log(`Cleaned up ${result} expired tokens from blacklist`);
    } catch (error) {
        console.error('Error cleaning up blacklisted tokens:', error);
    }
};

// Schedule cleanup task to run periodically
const setupMaintenanceTasks = () => {
    // Run cleanup every hour
    setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

    // Run on startup too
    cleanupExpiredTokens();
};

module.exports = { setupMaintenanceTasks };
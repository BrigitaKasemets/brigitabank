const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');
const keys = require('../config/keys');
const User = require('../models/User');
const Role = require('../models/Role');

module.exports = async function(req, res, next) {
  // Get token from header - check both standard Authorization header and x-auth-token
  const authHeader = req.header('Authorization');
  const xAuthToken = req.header('x-auth-token');

  // Get token from Authorization header (Bearer token) or x-auth-token
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]; // Extract token from "Bearer [token]"
  } else if (xAuthToken) {
    token = xAuthToken;
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (isBlacklisted) {
      return res.status(401).json({
        message: 'Token has been revoked'
      });
    }

    // Verify token using the public key with RS256 algorithm
    const decoded = jwt.verify(token, keys.publicKey, { algorithms: ['RS256'] });

    // Add user info to request
    req.user = decoded.user;

    // If the token doesn't contain role information, fetch it from the database
    if (!req.user.role) {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Role, attributes: ['name', 'permissions'] }]
      });

      if (user) {
        req.user.role = user.Role ? user.Role.name : user.role;
        req.user.permissions = user.Role ? JSON.parse(user.Role.permissions || '[]') : [];
      }
    }

    // Add token to request for logout functionality
    req.token = token;

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({
      message: 'Authentication required'
    });
  }
};
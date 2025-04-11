// server/middleware/auth.js (modified)
const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');

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
    const isBlacklisted = await BlacklistedToken.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        message: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user info to request
    req.user = decoded.user;

    // Add token to request for logout functionality
    req.token = token;

    next();
  } catch (err) {
    res.status(401).json({
      message: 'Authentication required'
    });
  }
};
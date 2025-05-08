const jwt = require('jsonwebtoken')
const User = require('../models/User');
const Role = require('../models/Role');
const BlacklistedToken = require('../models/BlacklistedToken');
const keys = require('../config/keys');

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, username, password, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Get default user role
    const userRole = await Role.findOne({ where: { name: 'user' } });
    if (!userRole) {
      return res.status(500).json({
        status: 'error',
        message: 'Default user role not found'
      });
    }

    // Create new user
    const user = await User.create({
      fullName,
      username,
      password,
      email,
      roleId: userRole.id, // Associate with role
      role: 'user' // For backward compatibility
    });

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: userRole.name // Include role in token
      },
    };

    jwt.sign(
        payload,
        keys.privateKey,
        { algorithm: 'RS256', expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            token,
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              role: userRole.name
            }
          });
        }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error - failed to create user', err: err.message });
  }
};

// Log in
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({
      where: { username },
      include: [
        { model: Role, attributes: ['id', 'name', 'permissions'] }
      ]
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get role information
    const roleName = user.Role ? user.Role.name : user.role;
    const permissions = user.Role ? JSON.parse(user.Role.permissions || '[]') : [];

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: roleName,
        permissions: permissions
      },
    };

    jwt.sign(
        payload,
        keys.privateKey,
        { algorithm: 'RS256', expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            status: 'success',
            token,
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              role: roleName,
              permissions: permissions
            }
          });
        }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error - login failed'
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, attributes: ['id', 'name', 'permissions'] }
      ]
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Format response to include role information
    const userData = {
      ...user.toJSON(),
      role: user.Role ? user.Role.name : user.role,
      permissions: user.Role ? JSON.parse(user.Role.permissions || '[]') : []
    };

    // Remove duplicated role information
    if (userData.Role) {
      delete userData.Role;
    }

    res.json(userData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error - failed to load user info' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Only admins can see all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, attributes: ['id', 'name'] }
      ]
    });

    // Format response to include role name directly
    const formattedUsers = users.map(user => {
      const userData = user.toJSON();
      userData.roleName = userData.Role ? userData.Role.name : userData.role;
      delete userData.Role;
      return userData;
    });

    res.json(formattedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error - failed to load users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, attributes: ['id', 'name'] }
      ]
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Format response
    const userData = user.toJSON();
    userData.roleName = userData.Role ? userData.Role.name : userData.role;
    delete userData.Role;

    res.json(userData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error - failed to load user' });
  }
};

// Logout (delete session)
exports.logout = async (req, res) => {
  try {
    const token = req.token;
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await BlacklistedToken.create({
      token,
      expiresAt
    });

    // Return 200 with a message instead of 204
    return res.status(200).json({ message: 'User logged out!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization - only allow users to delete themselves or admin role
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    // Delete the user
    await user.destroy();

    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
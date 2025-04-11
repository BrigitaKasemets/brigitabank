const jwt = require('jsonwebtoken')
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Create new user
    const user = await User.create({
      fullName,
      username,
      password,
    });

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
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
              role: user.role
            }
          });
        }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serveri viga - kasutaja loomine ebaõnnestus', err: err.message });
  }
};

// Log in
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kontrolli, kas kasutaja eksisteerib
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ msg: 'Vigane kasutajanimi või parool' });
    }

    // Kontrolli parooli
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Vigane kasutajanimi või parool' });
    }

    // Loo JWT
    const payload = {
      user: {
        id: user.id
      },
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            status: 'success',
            token,
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
            }
          });
        }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serveri viga - sisselogimine ebaõnnestus', err: err.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ msg: 'Kasutajat ei leitud' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serveri viga - kasutaja info laadimine ebaõnnestus' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {

    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serveri viga - kasutajate laadimine ebaõnnestus' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
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
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET;
const User = require('../models/User');

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
      return res.status(400).json({ msg: 'Vigane kasutajanimi või parool' });
    }

    // Kontrolli parooli
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Vigane kasutajanimi või parool' });
    }

    // Loo JWT
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
          res.json({
            status: 'success',
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
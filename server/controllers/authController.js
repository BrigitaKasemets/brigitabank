const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registreerimine
exports.register = async (req, res) => {
  try {
    const { fullName, username, password } = req.body;

    // Kontrolli, kas kasutaja juba eksisteerib
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ msg: 'Kasutaja juba eksisteerib' });
    }

    // Loo uus kasutaja
    const user = await User.create({
      fullName,
      username,
      password,
    });

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

// Sisselogimine
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

// Praeguse kasutaja info
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
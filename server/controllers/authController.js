const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registreerimine
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Kontrolli, kas kasutaja juba eksisteerib
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: 'Kasutaja juba eksisteerib' });
    }

    // Loo uus kasutaja
    const user = await User.create({
      firstName,
      lastName,
      email,
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
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga');
  }
};

// Sisselogimine
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kontrolli, kas kasutaja eksisteerib
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Vigane email või parool' });
    }

    // Kontrolli parooli
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Vigane email või parool' });
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
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga');
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
    res.status(500).send('Serveri viga');
  }
};
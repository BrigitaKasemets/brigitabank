const Account = require('../models/Account');
const User = require('../models/User');

// Loo uus konto
exports.createAccount = async (req, res) => {
  try {
    const { currency, name } = req.body; // Extract name from request
    const bankPrefix = process.env.BANK_PREFIX || 'ABC';

    // Generate account number
    const accountNumber = Account.generateAccountNumber(bankPrefix);

    // Create new account with name
    const account = await Account.create({
      accountNumber,
      userId: req.user.id,
      currency: currency || 'EUR',
      name: name || `${currency || 'EUR'} Account`, // Default name if not provided
    });

    res.status(201).json(account);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serveri viga - konto loomine ebaõnnestus', err: err.message });
  }
};

// Kasutaja kontode nimekiri
exports.getMyAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({ 
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          attributes: ['fullName']
        }
      ]
    });
    
    res.json(accounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga - kontode nimekirja laadimine ebaõnnestus');
  }
};

// Konto info konto numbri järgi
exports.getAccountByNumber = async (req, res) => {
  try {
    if (!req.params.accountNumber) {
      return res.status(400).json({ msg: 'Konto number on vajalik' });
    }

    const account = await Account.findOne({
      where: { accountNumber: req.params.accountNumber },
      include: [
        {
          model: User,
          attributes: ['fullName']
        }
      ]
    });

    if (!account) {
      return res.status(404).json({ msg: 'Kontot ei leitud' });
    }

    // Check if this is the user's own account or admin
    if (account.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Ligipääs keelatud' });
    }

    res.json(account);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Serveri viga - konto laadimine ebaõnnestus', err: err.message });
  }
};

// Konto omaniku nimi
exports.getAccountOwnerName = async (req, res) => {
  try {
    const account = await Account.findOne({
      where: { accountNumber: req.params.accountNumber },
      include: [
        {
          model: User,
          attributes: ['fullName']
        }
      ]
    });

    if (!account) {
      return res.status(404).json({ msg: 'Kontot ei leitud' });
    }

    if (!account.User) {
      return res.status(404).json({ msg: 'Konto omanikku ei leitud' });
    }

    res.json({
      receiverName: account.User.fullName
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga - konto omaniku nime laadimine ebaõnnestus');
  }
};
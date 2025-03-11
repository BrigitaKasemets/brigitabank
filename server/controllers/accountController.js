const Account = require('../models/Account');
const User = require('../models/User');

// Loo uus konto
exports.createAccount = async (req, res) => {
  try {
    const { currency } = req.body;
    const bankPrefix = process.env.BANK_PREFIX || 'ABC';

    // Genereeri konto number
    const accountNumber = Account.generateAccountNumber(bankPrefix);

    // Loo uus konto
    const account = await Account.create({
      accountNumber,
      userId: req.user.id,
      currency: currency || 'EUR',
    });

    res.status(201).json(account);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga');
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
          attributes: ['firstName', 'lastName']
        }
      ]
    });
    
    res.json(accounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga');
  }
};

// Konto info konto numbri järgi
exports.getAccountByNumber = async (req, res) => {
  try {
    const account = await Account.findOne({ 
      where: { accountNumber: req.params.accountNumber },
      include: [
        {
          model: User,
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    if (!account) {
      return res.status(404).json({ msg: 'Kontot ei leitud' });
    }

    // Kontrolli, kas see on kasutaja enda konto
    if (account.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Ligipääs keelatud' });
    }

    res.json(account);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga');
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
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    if (!account) {
      return res.status(404).json({ msg: 'Kontot ei leitud' });
    }

    res.json({
      receiverName: `${account.User.firstName} ${account.User.lastName}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga');
  }
};
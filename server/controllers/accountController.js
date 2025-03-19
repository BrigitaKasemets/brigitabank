const Account = require('../models/Account');
const User = require('../models/User');

exports.createAccount = async (req, res) => {
  try {
    const { name, currency } = req.body;
    const userId = req.user.id;

    // Get bank prefix from environment variables
    const bankPrefix = process.env.BANK_PREFIX;

    // Generate account number with bank prefix
    const accountNumber = Account.generateAccountNumber(bankPrefix);

    // Create new account with the generated account number
    const account = await Account.create({
      accountNumber,
      name,
      currency,
      userId,
      balance: 0.00
    });

    res.status(201).json(account);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get user's accounts
exports.getMyAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { userId: req.user.id }
    });
    res.json(accounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get account by number
exports.getAccountByNumber = async (req, res) => {
  try {
    const account = await Account.findOne({
      where: { accountNumber: req.params.accountNumber }
    });

    if (!account) {
      return res.status(404).json({ msg: 'Account not found' });
    }

    // Check if the account belongs to the user
    if (account.userId !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(account);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
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
      return res.status(404).json({ msg: 'Account not found' });
    }

    res.json({
      accountNumber: account.accountNumber,
      ownerName: account.User.fullName
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
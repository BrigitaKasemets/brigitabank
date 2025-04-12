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
      name,
      accountNumber,
      balance: 100,
      currency,
      userId
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

    // Return 404 if no accounts found
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({
        message: "No accounts found"
      });
    }

    res.json(accounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get accounts by user ID
exports.getAccountsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    const accounts = await Account.findAll({
      where: { userId }
    });

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({
        message: "No accounts found for this user"
      });
    }

    res.json(accounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get account owner name by account number
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

// Delete account by account number
exports.deleteAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    // Find the account
    const account = await Account.findOne({
      where: { accountNumber }
    });

    // Check if account exists
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if the account belongs to the authenticated user
    if (account.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized - can only delete your own accounts' });
    }

    // Delete the account
    await account.destroy();

    // Return 204 status with no content
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
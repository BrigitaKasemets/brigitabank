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

    // Return 201 with the created account object
    return res.status(201).json(account);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Bad request' });
    }
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    return res.status(500).json({ message: 'Server error occurred' });
  }
};

// Get user's accounts
exports.getMyAccounts = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const accounts = await Account.findAll({
      where: { userId: req.user.id }
    });

    // Return 404 if no accounts found
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: 'No accounts found' });
    }

    // Return accounts array directly as per the schema
    return res.status(200).json(accounts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error occurred' });
  }
};

// Get accounts by user ID
exports.getAccountsByUserId = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.params.userId;
    const accounts = await Account.findAll({
      where: { userId }
    });

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: 'No accounts found' });
    }

    // Return accounts array directly as per the schema
    return res.status(200).json(accounts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error occurred' });
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
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.status(200).json({
      accountNumber: account.accountNumber,
      ownerName: account.User.fullName
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server error occurred' });
  }
};

// Delete account by account number
exports.deleteAccount = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required - please log in' });
    }

    const { accountNumber } = req.params;

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

    // Return 200 status with success message
    return res.status(200).json({ message: 'Account successfully deleted' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ message: 'Internal server error occurred while deleting the account' });
  }
};
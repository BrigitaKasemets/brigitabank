const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const centralBankApi = require('../utils/centralBankApi');
const jwtUtils = require('../utils/jwtUtils');
const { sequelize } = require('../config/db');

// Internal transaction (within the same bank)
exports.createInternalTransaction = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { accountFrom, accountTo, amount, currency, explanation } = req.body;

    // Check sender account
    const fromAccount = await Account.findOne({
      where: { accountNumber: accountFrom },
      transaction: t
    });

    if (!fromAccount) {
      await t.rollback();
      return res.status(404).json({ msg: 'Sender account not found' });
    }

    // Verify ownership
    if (fromAccount.userId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ msg: 'You can only send money from your own accounts' });
    }

    // Check sufficient funds
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(402).json({ msg: 'Insufficient funds' });
    }

    // Get sender information
    const sender = await User.findByPk(fromAccount.userId, { transaction: t });
    if (!sender) {
      await t.rollback();
      return res.status(500).json({ msg: 'Sender user not found' });
    }

    // Check receiver account
    const toAccount = await Account.findOne({
      where: { accountNumber: accountTo },
      transaction: t
    });

    if (!toAccount) {
      await t.rollback();
      return res.status(404).json({ msg: 'Recipient account not found' });
    }

    // Get receiver information
    const receiver = await User.findByPk(toAccount.userId, { transaction: t });
    if (!receiver) {
      await t.rollback();
      return res.status(500).json({ msg: 'Receiver user not found' });
    }

    // Update balances
    await fromAccount.update({
      balance: parseFloat(fromAccount.balance) - parseFloat(amount)
    }, { transaction: t });

    await toAccount.update({
      balance: parseFloat(toAccount.balance) + parseFloat(amount)
    }, { transaction: t });

    // Create transaction record
    const transactionRecord = await Transaction.create({
      transactionId: uuidv4(),
      accountFrom,
      accountTo,
      amount: parseFloat(amount),
      currency,
      explanation,
      senderName: sender.fullName,
      receiverName: receiver.fullName,
      status: 'completed',
      type: 'internal'
    }, { transaction: t });

    await t.commit();
    res.status(201).json(transactionRecord);
  } catch (err) {
    await t.rollback();
    console.error('Internal transaction error:', err);
    res.status(500).json({ message: 'Server error occurred', error: err.message });
  }
};

// External transaction (to another bank)
exports.createExternalTransaction = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { accountFrom, accountTo, amount, currency, explanation } = req.body;

    // Check sender account
    const fromAccount = await Account.findOne({
      where: { accountNumber: accountFrom },
      transaction: t
    });

    if (!fromAccount) {
      await t.rollback();
      return res.status(404).json({ msg: 'Sender account not found' });
    }

    // Verify ownership
    if (fromAccount.userId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ msg: 'You can only send money from your own accounts' });
    }

    // Check sufficient funds
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(402).json({ msg: 'Insufficient funds' });
    }

    // Get sender information
    const sender = await User.findByPk(fromAccount.userId, { transaction: t });
    if (!sender) {
      await t.rollback();
      return res.status(500).json({ msg: 'Sender user not found' });
    }

    // Extract bank prefix from target account
    const targetBankPrefix = accountTo.substring(0, 3);

    // Get target bank details from central bank
    const targetBank = await centralBankApi.getBankByPrefix(targetBankPrefix);
    if (!targetBank) {
      await t.rollback();
      return res.status(404).json({ msg: 'Target bank not found' });
    }

    // Create transaction in pending state
    const transactionRecord = await Transaction.create({
      transactionId: uuidv4(),
      accountFrom,
      accountTo,
      amount: parseFloat(amount),
      currency,
      explanation,
      senderName: sender.fullName,
      status: 'pending',
      type: 'outgoing'
    }, { transaction: t });

    // Create JWT payload
    const payload = {
      accountFrom,
      accountTo,
      amount: parseFloat(amount),
      currency,
      explanation,
      senderName: sender.fullName
    };

    // Create and sign JWT
    const token = jwtUtils.createJWT(payload);
    if (!token) {
      await t.rollback();
      return res.status(500).json({ msg: 'Failed to create transaction token' });
    }

    // Send transaction to target bank
    const response = await fetch(targetBank.transactionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jwt: token })
    });

    if (!response.ok) {
      await t.rollback();
      return res.status(response.status).json({
        msg: 'Transaction failed at target bank',
        details: await response.text()
      });
    }

    const result = await response.json();

    // Update transaction
    await transactionRecord.update({
      receiverName: result.receiverName,
      status: 'completed'
    }, { transaction: t });

    // Update sender's balance
    await fromAccount.update({
      balance: parseFloat(fromAccount.balance) - parseFloat(amount)
    }, { transaction: t });

    await t.commit();
    res.status(201).json({
      ...transactionRecord.toJSON(),
      receiverName: result.receiverName
    });
  } catch (err) {
    await t.rollback();
    console.error('External transaction error:', err);
    res.status(500).json({ message: 'Server error occurred', error: err.message });
  }
};
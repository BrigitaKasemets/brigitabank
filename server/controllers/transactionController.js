const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const centralBankApi = require('../utils/centralBankApi');
const jwtUtils = require('../utils/jwtUtils');
const { sequelize } = require('../config/db');

// Loo uus sisene tehing
exports.createInternalTransaction = async (req, res) => {
  // Start a transaction
  const t = await sequelize.transaction();

  try {
    const { accountFrom, accountTo, amount, currency, explanation } = req.body;

    // Kontrolli saatja kontot
    const fromAccount = await Account.findOne({ 
      where: { accountNumber: accountFrom },
      transaction: t
    });
    
    if (!fromAccount) {
      await t.rollback();
      return res.status(404).json({ msg: 'Saatja kontot ei leitud' });
    }

    // Kontrolli, kas see on kasutaja enda konto
    if (fromAccount.userId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ msg: 'Ligipääs keelatud' });
    }

    // Kontrolli, kas kontol on piisavalt raha
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({ msg: 'Kontol pole piisavalt raha' });
    }

    // Kontrolli saaja kontot
    const toAccount = await Account.findOne({ 
      where: { accountNumber: accountTo },
      transaction: t
    });
    
    if (!toAccount) {
      await t.rollback();
      return res.status(404).json({ msg: 'Saaja kontot ei leitud' });
    }

    // Saaja nimi
    const toUser = await User.findByPk(toAccount.userId, { transaction: t });
    const receiverName = `${toUser.fullName}`;

    // Saatja nimi
    const fromUser = await User.findByPk(fromAccount.userId, { transaction: t });
    const senderName = `${fromUser.fullName}`;

    // Loo transaktsioon
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      accountFrom,
      accountTo,
      amount,
      currency,
      explanation,
      senderName,
      receiverName,
      status: 'completed',
      type: 'internal'
    }, { transaction: t });

    // Uuenda kontode saldot
    await Account.update(
      { balance: sequelize.literal(`balance - ${parseFloat(amount)}`) },
      { where: { id: fromAccount.id }, transaction: t }
    );
    
    await Account.update(
      { balance: sequelize.literal(`balance + ${parseFloat(amount)}`) },
      { where: { id: toAccount.id }, transaction: t }
    );

    // Commit transaction
    await t.commit();

    res.status(201).json(transaction);
  } catch (err) {
    // Rollback transaction on error
    await t.rollback();
    console.error(err.message);
    res.status(500).send('Serveri viga');
  }
};

// Loo uus väline tehing
exports.createExternalTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { accountFrom, accountTo, amount, currency, explanation } = req.body;

    // Kontrolli saatja kontot
    const fromAccount = await Account.findOne({ 
      where: { accountNumber: accountFrom },
      transaction: t
    });
    
    if (!fromAccount) {
      await t.rollback();
      return res.status(404).json({ msg: 'Saatja kontot ei leitud' });
    }

    // Kontrolli, kas see on kasutaja enda konto
    if (fromAccount.userId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ msg: 'Ligipääs keelatud' });
    }

    // Kontrolli, kas kontol on piisavalt raha
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({ msg: 'Kontol pole piisavalt raha' });
    }

    // Määra sihtpanga kood
    const bankPrefix = accountTo.substring(0, 3);
    const ourBankPrefix = process.env.BANK_PREFIX || 'ABC';

    // Kui see on meie panga sisene tehing, kasuta sisest tehingu protsessimist
    if (bankPrefix === ourBankPrefix) {
      await t.rollback();
      return this.createInternalTransaction(req, res);
    }

    // Saatja nimi
    const fromUser = await User.findByPk(fromAccount.userId, { transaction: t });
    const senderName = `${fromUser.fullName}`;

    // Loo esialgne tehing ootel staatusega
    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      accountFrom,
      accountTo,
      amount,
      currency,
      explanation,
      senderName,
      status: 'pending',
      type: 'outgoing'
    }, { transaction: t });

    await t.commit();

    // Kutsu pankadevahelise tehingu töötleja
    const result = await processB2BTransaction(transaction);

    if (result.success) {
      const t2 = await sequelize.transaction();
      
      try {
        // Uuenda tehingu staatust ja saaja nime
        await Transaction.update({
          status: 'completed',
          receiverName: result.receiverName
        }, { 
          where: { id: transaction.id },
          transaction: t2
        });

        // Vähenda saatja kontol raha
        await Account.update(
          { balance: sequelize.literal(`balance - ${parseFloat(amount)}`) },
          { where: { id: fromAccount.id }, transaction: t2 }
        );

        await t2.commit();
        res.status(201).json({
          ...transaction.toJSON(),
          status: 'completed',
          receiverName: result.receiverName
        });
      } catch (err) {
        await t2.rollback();
        console.error(err.message);
        res.status(500).send('Serveri viga');
      }
    } else {
      await Transaction.update({
        status: 'failed',
        errorMessage: result.error
      }, { where: { id: transaction.id } });

      res.status(400).json({ msg: result.error });
    }
  } catch (err) {
    await t.rollback();
    console.error(err.message);
    res.status(500).send('Serveri viga');
  }
};

// Teosta pangadevaheline tehing
async function processB2BTransaction(transaction) {
  try {
    // Määra sihtpanga kood
    const bankPrefix = transaction.accountTo.substring(0, 3);

    // Hangi sihtpanga info keskpangast
    const targetBank = await centralBankApi.getBankByPrefix(bankPrefix);

    if (!targetBank) {
      return { success: false, error: 'Sihtpanka ei leitud' };
    }

    // Loo JWT payload
    const payload = {
      accountFrom: transaction.accountFrom,
      accountTo: transaction.accountTo,
      currency: transaction.currency,
      amount: transaction.amount,
      explanation: transaction.explanation,
      senderName: transaction.senderName
    };

    // Allkirjasta JWT
    const jwt = jwtUtils.createJWT(payload);

    // Saada tehing sihtpangale
    const response = await fetch(targetBank.transactionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jwt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.msg || 'Tehingu saatmine ebaõnnestus' };
    }

    const responseData = await response.json();

    // Tagasta eduka tehingu info
    return {
      success: true,
      receiverName: responseData.receiverName
    };
  } catch (err) {
    console.error('B2B tehingu töötlemise viga:', err.message);
    return { success: false, error: 'Tehingu töötlemine ebaõnnestus' };
  }
}

// Kasutaja tehingute nimekiri
exports.getMyTransactions = async (req, res) => {
  try {
    // Hangi kõik kasutaja kontod
    const accounts = await Account.findAll({ 
      where: { userId: req.user.id } 
    });
    
    const accountNumbers = accounts.map(account => account.accountNumber);

    // Hangi tehingud, kus kasutaja kontod on seotud
    const transactions = await Transaction.findAll({
      where: {
        [sequelize.Op.or]: [
          { accountFrom: { [sequelize.Op.in]: accountNumbers } },
          { accountTo: { [sequelize.Op.in]: accountNumbers } }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Serveri viga');
  }
};
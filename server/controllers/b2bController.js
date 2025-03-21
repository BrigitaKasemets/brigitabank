const { sequelize } = require('../config/db');
const jwtUtils = require('../utils/jwtUtils');
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const centralBankApi = require('../utils/centralBankApi');

// Sissetuleva tehingu töötlemine
exports.handleIncomingTransaction = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { jwt } = req.body;

    if (!jwt) {
      await t.rollback();
      return res.status(400).json({ msg: 'JWT puudub' });
    }

    // Valideeri JWT struktuur
    const payload = jwtUtils.decodeJWT(jwt);
    if (!payload) {
      await t.rollback();
      return res.status(400).json({ msg: 'Vigane JWT' });
    }

    // Ekstrakti payload andmed
    const { accountFrom, accountTo, currency, amount, explanation, senderName } = payload;

    // Kontrolli kontode formaati
    if (!accountFrom || !accountTo) {
      await t.rollback();
      return res.status(400).json({ msg: 'Vigane kontode formaat' });
    }

    // Kontrolli, kas sihtkoht on meie pangas
    const ourBankPrefix = process.env.BANK_PREFIX;
    if (!accountTo.startsWith(ourBankPrefix)) {
      await t.rollback();
      return res.status(400).json({ msg: 'Vale sihtpank' });
    }

    // Kontrolli, kas saaja konto eksisteerib
    const toAccount = await Account.findOne({
      where: { accountNumber: accountTo },
      transaction: t
    });

    if (!toAccount) {
      await t.rollback();
      return res.status(404).json({ msg: 'Saaja kontot ei leitud' });
    }

    // Valideeri saatev pank
    const bankPrefix = accountFrom.substring(0, 3);

    // Otsi panka otse keskpangast
    try {
      const remoteBankInfo = await centralBankApi.getBankByPrefix(bankPrefix);

      if (!remoteBankInfo) {
        await t.rollback();
        return res.status(400).json({ msg: 'Saatev pank pole registreeritud' });
      }

      // Valideeri JWT allkiri keskpanga info põhjal
      const isValidSignature = await jwtUtils.verifyJWT(jwt, remoteBankInfo.jwksUrl);
      if (!isValidSignature) {
        await t.rollback();
        return res.status(400).json({ msg: 'Vigane JWT allkiri' });
      }

      // Hangi saaja nimi
      const toUser = await User.findByPk(toAccount.userId, { transaction: t });
      const receiverName = toUser.fullName;

      // Loo tehingu kirje
      await Transaction.create({
        transactionId: uuidv4(),
        accountFrom,
        accountTo,
        amount,
        currency,
        explanation,
        senderName,
        receiverName,
        status: 'completed',
        type: 'incoming'
      }, { transaction: t });

      // Suurenda saaja kontol raha
      await Account.update(
          { balance: sequelize.literal(`balance + ${parseFloat(amount)}`) },
          { where: { id: toAccount.id }, transaction: t }
      );

      // Commit transaction
      await t.commit();

      // Tagasta saaja nimi
      return res.status(200).json({ receiverName });

    } catch (err) {
      await t.rollback();
      console.error('Keskpanga API viga:', err.message);
      return res.status(502).json({ msg: 'Keskpanga ühenduse viga', error: err.message });
    }

  } catch (err) {
    await t.rollback();
    console.error('Sissetuleva tehingu töötlemise viga:', err.message);
    return res.status(500).json({ msg: 'Tehingu töötlemine ebaõnnestus' });
  }
};

// JWKS Endpoint
exports.getJwks = (req, res) => {
  try {
    const keys = require('../config/keys');
    res.json(keys.getJwks());
  } catch (err) {
    console.error('JWKS päringu viga:', err.message);
    res.status(500).json({ msg: 'JWKS genereerimine ebaõnnestus' });
  }
};
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const { transactionValidation, validateRequest } = require('../middleware/validation');

router.post('/', auth, transactionValidation, validateRequest, (req, res) => {
  // Check if the account destination starts with the same bank prefix
  const bankPrefix = process.env.BANK_PREFIX || 'ABC';
  const isInternal = req.body.accountTo.startsWith(bankPrefix);
  
  if (isInternal) {
    return transactionController.createInternalTransaction(req, res);
  } else {
    return transactionController.createExternalTransaction(req, res);
  }
});

router.get('/:id', auth, (req, res) => {
  // This endpoint could be implemented for getting specific transaction details
  res.status(501).json({ msg: 'Not implemented yet' });
});

module.exports = router;
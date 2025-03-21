const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bankController = require('../controllers/bankController');

// Register with central bank
router.post('/register-with-central-bank', auth, bankController.registerWithCentralBank);

// Get all banks from central bank
router.get('/external', auth, bankController.getExternalBanks);

// Get specific external bank by prefix
router.get('/external/:prefix', auth, bankController.getExternalBankByPrefix);

// Refresh keys
router.post('/refresh-keys', auth, bankController.refreshKeys);

module.exports = router;
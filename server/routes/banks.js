const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bankController = require('../controllers/bankController');

// JWKS endpoint (must be before :bankId routes to avoid path conflicts)
router.get('/jwks', bankController.getJwks);

// Register with central bank
router.post('/register-with-central-bank', auth, bankController.registerWithCentralBank);

// Get external banks from central bank
router.get('/external', auth, bankController.getExternalBanks);

// Get external bank by prefix
router.get('/external/:prefix', auth, bankController.getExternalBankByPrefix);

// Get all banks
router.get('/', auth, bankController.getAllBanks);

// Register a new bank (admin only)
router.post('/', auth, bankController.createBank);

// Get bank by ID
router.get('/:bankId', auth, bankController.getBankById);

// Update bank (admin only)
router.put('/:bankId', auth, bankController.updateBank);

// Delete bank (admin only)
router.delete('/:bankId', auth, bankController.deleteBank);

module.exports = router;
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

// Add to routes/banks.js
router.get('/test-connection/:prefix', auth, async (req, res) => {
    try {
        const { prefix } = req.params;
        const centralBankApi = require('../utils/centralBankApi');

        console.log(`Testing connection for bank prefix: ${prefix}`);
        const bank = await centralBankApi.getBankByPrefix(prefix);

        if (!bank) {
            return res.status(404).json({ success: false, message: 'Bank not found' });
        }

        // Test basic connectivity to bank's transaction URL
        const testResponse = await fetch(`${bank.transactionUrl}/ping`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => ({ ok: false, error: err.message }));

        res.json({
            bank,
            connectionTest: {
                success: testResponse.ok,
                status: testResponse.status,
                error: testResponse.error || null
            }
        });
    } catch (err) {
        console.error('Bank connection test failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add to routes/banks.js
router.get('/test-connection/:prefix', auth, async (req, res) => {
    try {
        const { prefix } = req.params;
        const centralBankApi = require('server/utils/centralBankApi');

        console.log(`Testing connection for bank prefix: ${prefix}`);
        const bank = await centralBankApi.getBankByPrefix(prefix);

        if (!bank) {
            return res.status(404).json({ success: false, message: 'Bank not found' });
        }

        // Test basic connectivity to bank's transaction URL
        const testResponse = await fetch(`${bank.transactionUrl}/ping`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => ({ ok: false, error: err.message }));

        res.json({
            bank,
            connectionTest: {
                success: testResponse.ok,
                status: testResponse.status,
                error: testResponse.error || null
            }
        });
    } catch (err) {
        console.error('Bank connection test failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
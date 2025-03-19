const Bank = require('../models/Bank');
const keys = require('../config/keys');
// Dynamic import for node-fetch compatibility with CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Get JWKS for verifying transactions
exports.getJwks = (req, res) => {
    try {
        res.json(keys.getJwks());
    } catch (err) {
        console.error('JWKS request error:', err.message);
        res.status(500).json({ msg: 'Failed to generate JWKS' });
    }
};

// Register with external central bank
exports.registerWithCentralBank = async (req, res) => {
    try {
        // Use values from environment variables
        const bankData = {
            name: process.env.BANK_NAME,
            owners: process.env.BANK_OWNERS,
            jwksUrl: process.env.JWKS_URL,
            transactionUrl: process.env.TRANSACTION_URL
        };

        console.log('Registering with central bank:', bankData);

        // Send request to central bank API
        const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': process.env.API_KEY
            },
            body: JSON.stringify(bankData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Registration failed: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        console.log('Registration successful:', result);

        // Update our own database with the registration result
        // You might want to save the prefix and API key if returned
        if (result && result.prefix) {
            // Store or update the bank info in your database
            // For now, we just return the result
            return res.json({
                success: true,
                message: 'Bank registered successfully with central bank',
                data: {
                    prefix: result.prefix
                }
            });
        }

        res.json({
            success: true,
            message: 'Registration request sent successfully',
            data: result
        });
    } catch (err) {
        console.error('Bank registration error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get all banks from external central bank
exports.getExternalBanks = async (req, res) => {
    try {
        const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks`, {
            headers: {
                'X-API-KEY': process.env.API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get banks: ${response.statusText}`);
        }

        const banks = await response.json();
        res.json(banks);
    } catch (err) {
        console.error('Error getting external banks:', err);
        res.status(502).json({ message: 'Central Bank connectivity issue', error: err.message });
    }
};

// Get specific external bank by prefix
exports.getExternalBankByPrefix = async (req, res) => {
    try {
        const prefix = req.params.prefix;
        const response = await fetch(`${process.env.CENTRAL_BANK_URL}/banks/${prefix}`, {
            headers: {
                'X-API-KEY': process.env.API_KEY
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({ message: 'Bank not found in central bank registry' });
            }
            throw new Error(`Failed to get bank: ${response.statusText}`);
        }

        const bank = await response.json();
        res.json(bank);
    } catch (err) {
        console.error(`Error getting external bank with prefix ${req.params.prefix}:`, err);
        res.status(502).json({ message: 'Central Bank connectivity issue', error: err.message });
    }
};

// Get all banks
exports.getAllBanks = async (req, res) => {
    try {
        const banks = await Bank.findAll({
            attributes: { exclude: ['apiKey'] }
        });
        res.json(banks);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Create a new bank
exports.createBank = async (req, res) => {
    try {
        const { name, prefix, transactionUrl, jwksUrl } = req.body;

        // Check if bank already exists
        const existingBank = await Bank.findOne({ where: { prefix } });
        if (existingBank) {
            return res.status(400).json({ msg: 'Bank with this prefix already exists' });
        }

        // Create bank record
        const bank = await Bank.create({
            name,
            prefix,
            transactionUrl,
            jwksUrl
        });

        res.status(201).json({
            id: bank.id,
            name: bank.name,
            prefix: bank.prefix,
            transactionUrl: bank.transactionUrl,
            jwksUrl: bank.jwksUrl,
            status: bank.status,
            createdAt: bank.createdAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get bank by ID
exports.getBankById = async (req, res) => {
    try {
        const bank = await Bank.findByPk(req.params.bankId, {
            attributes: { exclude: ['apiKey'] }
        });

        if (!bank) {
            return res.status(404).json({ msg: 'Bank not found' });
        }

        res.json(bank);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update bank
exports.updateBank = async (req, res) => {
    try {
        const { name, transactionUrl, jwksUrl } = req.body;

        // Check if admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const bank = await Bank.findByPk(req.params.bankId);
        if (!bank) {
            return res.status(404).json({ msg: 'Bank not found' });
        }

        await bank.update({
            name: name || bank.name,
            transactionUrl: transactionUrl || bank.transactionUrl,
            jwksUrl: jwksUrl || bank.jwksUrl
        });

        res.json({
            id: bank.id,
            name: bank.name,
            prefix: bank.prefix,
            transactionUrl: bank.transactionUrl,
            jwksUrl: bank.jwksUrl,
            status: bank.status,
            updatedAt: bank.updatedAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete bank
exports.deleteBank = async (req, res) => {
    try {
        // Check if admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const bank = await Bank.findByPk(req.params.bankId);
        if (!bank) {
            return res.status(404).json({ msg: 'Bank not found' });
        }

        await bank.destroy();
        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
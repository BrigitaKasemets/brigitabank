const Bank = require('../models/Bank');
const keys = require('../config/keys');
const centralBankApi = require('../utils/centralBankApi');

// Get JWKS for verifying transactions
exports.getJwks = (req, res) => {
    try {
        res.json(keys.getJwks());
    } catch (err) {
        console.error('JWKS request error:', err.message);
        res.status(500).json({ msg: 'Failed to generate JWKS' });
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

        // Register with central bank
        const response = await centralBankApi.registerBank({
            name,
            prefix,
            transactionUrl,
            jwksUrl
        });

        // Create bank record
        const bank = await Bank.create({
            name,
            prefix,
            transactionUrl,
            jwksUrl,
            apiKey: response.apiKey
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
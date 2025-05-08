const fs = require('fs');
const path = require('path');
const Account = require('../models/Account');
const keys = require('../config/keys');
const dotenv = require('dotenv');
const { sequelize } = require('../config/db');

// Function to update .env file
const updateEnvFile = (newPrefix) => {
    const envPath = path.resolve(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update the BANK_PREFIX line
    envContent = envContent.replace(
        /BANK_PREFIX=.*/,
        `BANK_PREFIX=${newPrefix}`
    );

    fs.writeFileSync(envPath, envContent);

    // Update environment in current process
    process.env.BANK_PREFIX = newPrefix;

    console.log(`Updated .env file with new prefix: ${newPrefix}`);
};

// Function to update all account numbers
const updateAccountNumbers = async (oldPrefix, newPrefix) => {
    const t = await sequelize.transaction();

    try {
        // Get all accounts
        const accounts = await Account.findAll({ transaction: t });

        // Update each account with new prefix
        for (const account of accounts) {
            const oldAccountNumber = account.accountNumber;
            // Replace old prefix with new prefix at the beginning of account number
            const newAccountNumber = newPrefix + oldAccountNumber.substring(oldPrefix.length);

            await Account.update(
                { accountNumber: newAccountNumber },
                { where: { id: account.id }, transaction: t }
            );

            console.log(`Updated account ${oldAccountNumber} to ${newAccountNumber}`);
        }

        await t.commit();
        console.log(`Updated all account numbers with new prefix: ${newPrefix}`);
        return true;
    } catch (err) {
        await t.rollback();
        console.error('Failed to update account numbers:', err);
        throw err;
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

        // If we got a new prefix, update .env and account numbers
        if (result && result.prefix && result.prefix !== process.env.BANK_PREFIX) {
            const oldPrefix = process.env.BANK_PREFIX;

            // Update .env file
            updateEnvFile(result.prefix);

            // Update account numbers
            await updateAccountNumbers(oldPrefix, result.prefix);

            return res.json({
                success: true,
                message: 'Bank registered successfully with central bank. Prefix and accounts updated.',
                data: {
                    prefix: result.prefix,
                    oldPrefix: oldPrefix
                }
            });
        }

        res.json({
            success: true,
            message: 'Registration successful, no change in bank prefix',
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

// Get all external banks from central bank
exports.getExternalBanks = async (req, res) => {
    try {
        const centralBankApi = require('../utils/centralBankApi');
        const banks = await centralBankApi.getAllBanks();
        res.json(banks);
    } catch (err) {
        console.error('Failed to get external banks:', err);
        res.status(502).json({
            success: false,
            message: 'Central Bank connectivity issue',
            error: err.message
        });
    }
};

// Get a specific external bank by prefix
exports.getExternalBankByPrefix = async (req, res) => {
    try {
        const { prefix } = req.params;
        const centralBankApi = require('../utils/centralBankApi');
        const bank = await centralBankApi.getBankByPrefix(prefix);

        if (!bank) {
            return res.status(404).json({
                success: false,
                message: 'Bank not found'
            });
        }

        res.json(bank);
    } catch (err) {
        console.error(`Failed to get bank with prefix ${req.params.prefix}:`, err);
        res.status(502).json({
            success: false,
            message: 'Central Bank connectivity issue',
            error: err.message
        });
    }
};

// Key refresh functionality
exports.refreshKeys = async (req, res) => {
    try {
        // Generate new keys
        await keys.generateNewKeys();

        // Re-register with central bank to update JWKS URL
        await this.registerWithCentralBank(req, res);
    } catch (err) {
        console.error('Failed to refresh keys:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh keys',
            error: err.message
        });
    }
};
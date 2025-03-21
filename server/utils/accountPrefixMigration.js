require('dotenv').config();
const { sequelize, connectDB } = require('../config/db');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { Op } = require('sequelize');

async function updateAccountPrefixes() {
    const newPrefix = process.env.BANK_PREFIX;

    if (!newPrefix) {
        console.error('BANK_PREFIX not found in environment variables');
        return;
    }

    const transaction = await sequelize.transaction();

    try {
        // Get all accounts
        const accounts = await Account.findAll({ transaction });

        if (accounts.length === 0) {
            console.log('No accounts found in the database');
            await transaction.rollback();
            return;
        }

        // Automatically detect the old prefix from existing accounts
        // Extract prefixes (first 3 characters) and count occurrences
        const prefixCounts = {};
        accounts.forEach(account => {
            const prefix = account.accountNumber.substring(0, 3);
            prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
        });

        // Find the most common prefix
        const oldPrefix = Object.keys(prefixCounts).reduce((a, b) =>
            prefixCounts[a] > prefixCounts[b] ? a : b
        );

        // Skip if the detected prefix is already the new prefix
        if (oldPrefix === newPrefix) {
            console.log(`Accounts already using the correct prefix: ${newPrefix}`);
            await transaction.rollback();
            return;
        }

        console.log(`Detected old prefix: ${oldPrefix}`);
        console.log(`Migrating account numbers from prefix "${oldPrefix}" to "${newPrefix}"`);

        // Filter accounts that need updating (those with old prefix)
        const accountsToUpdate = accounts.filter(account =>
            account.accountNumber.startsWith(oldPrefix)
        );

        console.log(`Found ${accountsToUpdate.length} accounts with old prefix`);

        // Store old-to-new account number mapping
        const accountMap = {};

        // Update each account
        for (const account of accountsToUpdate) {
            const oldAccountNumber = account.accountNumber;
            // Replace only the prefix part (first 3 chars)
            const newAccountNumber = `${newPrefix}${oldAccountNumber.substring(oldPrefix.length)}`;

            accountMap[oldAccountNumber] = newAccountNumber;

            await account.update({
                accountNumber: newAccountNumber
            }, { transaction });

            console.log(`Updated account: ${oldAccountNumber} -> ${newAccountNumber}`);
        }

        // Update transactions with these account numbers
        // First update accountFrom field
        const fromTransactions = await Transaction.findAll({
            where: {
                accountFrom: Object.keys(accountMap)
            },
            transaction
        });

        for (const tx of fromTransactions) {
            await tx.update({
                accountFrom: accountMap[tx.accountFrom]
            }, { transaction });
            console.log(`Updated transaction ${tx.transactionId} (from)`);
        }

        // Then update accountTo field
        const toTransactions = await Transaction.findAll({
            where: {
                accountTo: Object.keys(accountMap)
            },
            transaction
        });

        for (const tx of toTransactions) {
            await tx.update({
                accountTo: accountMap[tx.accountTo]
            }, { transaction });
            console.log(`Updated transaction ${tx.transactionId} (to)`);
        }

        await transaction.commit();
        console.log('Migration completed successfully');

    } catch (error) {
        await transaction.rollback();
        console.error('Migration failed:', error);
    }
}

// Connect to DB and run migration
connectDB().then(() => {
    updateAccountPrefixes().then(() => {
        console.log('Done');
        process.exit(0);
    });
});
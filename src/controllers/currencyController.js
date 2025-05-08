const Currency = require('../models/Currency');

// Get all currencies
exports.getAllCurrencies = async (req, res) => {
    try {
        const currencies = await Currency.findAll();

        if (!currencies || currencies.length === 0) {
            return res.status(404).json({ message: 'No currencies found' });
        }

        res.status(200).json(currencies);
    } catch (err) {
        console.error('Error fetching currencies:', err);
        res.status(500).json({
            message: 'Server error occurred while fetching currencies',
            error: err.message
        });
    }
};

// Get currency by ID
exports.getCurrencyById = async (req, res) => {
    try {
        const { id } = req.params;

        const currency = await Currency.findByPk(id);

        if (!currency) {
            return res.status(404).json({ message: 'Currency not found' });
        }

        res.status(200).json(currency);
    } catch (err) {
        console.error('Error fetching currency:', err);
        res.status(500).json({
            message: 'Server error occurred while fetching currency',
            error: err.message
        });
    }
};

// Get currency by code
exports.getCurrencyByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const currency = await Currency.findOne({
            where: { code: code.toUpperCase() }
        });

        if (!currency) {
            return res.status(404).json({ message: 'Currency not found' });
        }

        res.status(200).json(currency);
    } catch (err) {
        console.error('Error fetching currency by code:', err);
        res.status(500).json({
            message: 'Server error occurred while fetching currency',
            error: err.message
        });
    }
};

// Create new currency (admin only)
exports.createCurrency = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create currencies' });
        }

        const { code, name, symbol, exchangeRate } = req.body;

        // Validate input
        if (!code || !name || !symbol || !exchangeRate) {
            return res.status(400).json({
                message: 'Missing required fields: code, name, symbol, and exchangeRate are required'
            });
        }

        // Check if currency already exists
        const existingCurrency = await Currency.findOne({
            where: { code: code.toUpperCase() }
        });

        if (existingCurrency) {
            return res.status(409).json({ message: 'Currency already exists' });
        }

        // Create new currency
        const currency = await Currency.create({
            code: code.toUpperCase(),
            name,
            symbol,
            exchangeRate,
            isActive: true,
            lastUpdated: new Date()
        });

        res.status(201).json(currency);
    } catch (err) {
        console.error('Error creating currency:', err);
        res.status(500).json({
            message: 'Server error occurred while creating currency',
            error: err.message
        });
    }
};

// Update currency (admin only)
exports.updateCurrency = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update currencies' });
        }

        const { id } = req.params;
        const { name, symbol, exchangeRate, isActive } = req.body;

        const currency = await Currency.findByPk(id);

        if (!currency) {
            return res.status(404).json({ message: 'Currency not found' });
        }

        // Update fields
        if (name) currency.name = name;
        if (symbol) currency.symbol = symbol;
        if (exchangeRate !== undefined) currency.exchangeRate = exchangeRate;
        if (isActive !== undefined) currency.isActive = isActive;

        currency.lastUpdated = new Date();

        await currency.save();

        res.status(200).json(currency);
    } catch (err) {
        console.error('Error updating currency:', err);
        res.status(500).json({
            message: 'Server error occurred while updating currency',
            error: err.message
        });
    }
};

// Delete currency (admin only) - soft delete by setting isActive to false
exports.deleteCurrency = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete currencies' });
        }

        const { id } = req.params;

        const currency = await Currency.findByPk(id);

        if (!currency) {
            return res.status(404).json({ message: 'Currency not found' });
        }

        // Check if currency is in use
        const accountCount = await currency.countAccounts();

        if (accountCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete currency that is in use by accounts',
                accountCount
            });
        }

        // Soft delete by setting isActive to false
        currency.isActive = false;
        await currency.save();

        res.status(200).json({
            message: 'Currency successfully deactivated',
            currency
        });
    } catch (err) {
        console.error('Error deleting currency:', err);
        res.status(500).json({
            message: 'Server error occurred while deleting currency',
            error: err.message
        });
    }
};
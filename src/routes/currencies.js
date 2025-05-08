// server/routes/currencies.js
const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');


router.get('/', currencyController.getAllCurrencies);


router.get('/:id', currencyController.getCurrencyById);


router.get('/code/:code', currencyController.getCurrencyByCode);


router.post('/',
    auth,
    [
        check('code', 'Currency code is required').not().isEmpty().isLength({ min: 3, max: 3 }),
        check('name', 'Currency name is required').not().isEmpty(),
        check('symbol', 'Currency symbol is required').not().isEmpty(),
        check('exchangeRate', 'Exchange rate must be a positive number').isFloat({ gt: 0 })
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    currencyController.createCurrency
);


router.put('/:id',
    auth,
    [
        check('exchangeRate', 'Exchange rate must be a positive number').optional().isFloat({ gt: 0 })
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    currencyController.updateCurrency
);


router.delete('/:id', auth, currencyController.deleteCurrency);

module.exports = router;
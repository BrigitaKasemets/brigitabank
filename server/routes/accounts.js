const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');
const { accountValidation, validateRequest } = require('../middleware/validation');

router.post('/', auth, accountValidation, validateRequest, accountController.createAccount);

router.get('/', auth, accountController.getMyAccounts);

router.get('/:accountNumber', auth, accountController.getAccountByNumber);

router.get('/:accountNumber/owner', auth, accountController.getAccountOwnerName);

module.exports = router;
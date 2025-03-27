const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');
const { accountValidation, validateRequest } = require('../middleware/validation');
const users = require("../middleware/auth");
const authController = require("../controllers/authController");

router.post('/', auth, accountValidation, validateRequest, accountController.createAccount);

router.get('/', auth, accountController.getMyAccounts);

router.get('/user/:userId', auth, accountController.getAccountsByUserId);

router.delete('/:accountNumber', auth, accountController.deleteAccount);

module.exports = router;
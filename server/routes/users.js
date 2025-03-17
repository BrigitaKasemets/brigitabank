const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const users = require('../middleware/auth');
const { registerValidation, loginValidation, validateRequest } = require('../middleware/validation');


router.post('/', registerValidation, validateRequest, authController.register);

router.get('/me', users, authController.getMe);

module.exports = router;
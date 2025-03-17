const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const users = require('../middleware/auth');
const { registerValidation, loginValidation, validateRequest } = require('../middleware/validation');



// In server/routes/sessions.js
router.post('/', loginValidation, validateRequest, authController.login);


module.exports = router;
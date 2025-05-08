const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidation, validateRequest } = require('../middleware/validation');
const auth = require('../middleware/auth');

router.post('/', loginValidation, validateRequest, authController.login);
router.delete('/current', auth, authController.logout);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const users = require('../middleware/auth');
const { registerValidation, loginValidation, validateRequest } = require('../middleware/validation');
const auth = require ('../middleware/auth');

// TEST: kas üldse jõuab siia?
router.delete('/:userId', (req, res) => {
    console.log('DELETE /users/:userId endpoint aktiveerus ID-ga:', req.params.userId);
    res.send('Jõudis kohale!');
});

router.get('/', users, authController.getAllUsers);
router.post('/', registerValidation, validateRequest, loginValidation, authController.register);
router.get('/:userId', users, authController.getUserById);
router.get('/me', users, authController.getMe);
router.delete('/:userId', auth, authController.deleteUser);

module.exports = router;
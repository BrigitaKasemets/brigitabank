const express = require('express');
const router = express.Router();
const b2bController = require('../controllers/b2bController');


router.post('/', b2bController.handleIncomingTransaction);

router.get('/keys', b2bController.getJwks);

module.exports = router;
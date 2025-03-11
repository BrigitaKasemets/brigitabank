const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');
const { accountValidation, validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Kontode haldamise API
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Loo uus konto
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 enum: [EUR, USD, GBP]
 *                 default: EUR
 *     responses:
 *       201:
 *         description: Konto edukalt loodud
 *       401:
 *         description: Puudub autoriseering
 */
router.post('/', auth, accountValidation, validateRequest, accountController.createAccount);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Hangi kasutaja kontode nimekiri
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kontode nimekiri
 *       401:
 *         description: Puudub autoriseering
 */
router.get('/', auth, accountController.getMyAccounts);

/**
 * @swagger
 * /api/accounts/{accountNumber}:
 *   get:
 *     summary: Hangi konto info konto numbri järgi
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Konto info
 *       401:
 *         description: Puudub autoriseering
 *       404:
 *         description: Kontot ei leitud
 */
router.get('/:accountNumber', auth, accountController.getAccountByNumber);

module.exports = router;
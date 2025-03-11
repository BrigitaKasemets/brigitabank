const express = require('express');
const router = express.Router();
const b2bController = require('../controllers/b2bController');

/**
 * @swagger
 * tags:
 *   name: BankToBankTransactions
 *   description: Pankadevaheliste tehingute API
 */

/**
 * @swagger
 * /api/banks/transactions:
 *   post:
 *     summary: Sissetuleva tehingu töötlemine
 *     tags: [BankToBankTransactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jwt
 *             properties:
 *               jwt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tehing edukalt töödeldud
 *       400:
 *         description: Vigane sisend või JWT
 *       404:
 *         description: Kontot ei leitud
 */
router.post('/', b2bController.handleIncomingTransaction);

/**
 * @swagger
 * /api/banks/keys:
 *   get:
 *     summary: Hangi panga avalikud võtmed JWKS formaadis
 *     tags: [BankToBankTransactions]
 *     responses:
 *       200:
 *         description: JWKS avalike võtmetega
 */
router.get('/keys', b2bController.getJwks);

module.exports = router;
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const { transactionValidation, validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Tehingute haldamise API
 */

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Loo uus tehing (sisene või väline)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountFrom
 *               - accountTo
 *               - amount
 *               - currency
 *               - explanation
 *             properties:
 *               accountFrom:
 *                 type: string
 *               accountTo:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [EUR, USD, GBP]
 *               explanation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tehing edukalt loodud
 *       400:
 *         description: Vigane sisend või ebapiisav raha
 *       401:
 *         description: Puudub autoriseering
 *       404:
 *         description: Kontot ei leitud
 */
router.post('/', auth, transactionValidation, validateRequest, (req, res) => {
  // Check if the account destination starts with the same bank prefix
  const bankPrefix = process.env.BANK_PREFIX || 'ABC';
  const isInternal = req.body.accountTo.startsWith(bankPrefix);
  
  if (isInternal) {
    return transactionController.createInternalTransaction(req, res);
  } else {
    return transactionController.createExternalTransaction(req, res);
  }
});

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Hangi kasutaja tehingute nimekiri
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tehingute nimekiri
 *       401:
 *         description: Puudub autoriseering
 */
router.get('/', auth, transactionController.getMyTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Hangi tehingu detailid ID järgi
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tehingu unikaalne ID
 *     responses:
 *       200:
 *         description: Tehingu detailid
 *       401:
 *         description: Puudub autoriseering
 *       403:
 *         description: Puudub ligipääsuõigus
 *       404:
 *         description: Tehingut ei leitud
 */
router.get('/:id', auth, (req, res) => {
  // This endpoint could be implemented for getting specific transaction details
  res.status(501).json({ msg: 'Not implemented yet' });
});

module.exports = router;
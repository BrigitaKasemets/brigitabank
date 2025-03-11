const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerValidation, loginValidation, validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Autentimise API
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Registreeri uus kasutaja
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Kasutaja edukalt registreeritud
 *       400:
 *         description: Vigane sisend või kasutaja juba eksisteerib
 */
router.post('/', registerValidation, validateRequest, authController.register);

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Logi sisse olemasoleva kasutajana
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Kasutaja edukalt sisse logitud, tagastab JWT
 *       400:
 *         description: Vigane email või parool
 */
router.post('/sessions', loginValidation, validateRequest, authController.login);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Hangi sisselogitud kasutaja info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kasutaja info
 *       401:
 *         description: Puudub autoriseering
 */
router.get('/me', auth, authController.getMe);

module.exports = router;
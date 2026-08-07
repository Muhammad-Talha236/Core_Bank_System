const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth.Controller');
const { loginLimiter } = require('../../middleware/rateLimiter');
const { verifyToken } = require('../../middleware/auth');

router.post('/login',loginLimiter, authController.login);
router.get('/me', verifyToken, authController.me);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
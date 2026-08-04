const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth.Controller');
const { verifyToken } = require('../../middleware/auth');

router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;

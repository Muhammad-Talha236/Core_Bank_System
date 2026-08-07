const express = require('express');
const router = express.Router();
const otpController = require('../../controllers/auth/otp.Controller');

router.post('/send', otpController.sendOtp);

module.exports = router;
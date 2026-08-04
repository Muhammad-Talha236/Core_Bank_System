const express = require('express');
const router = express.Router();
const customerAuthController = require('../../controllers/customerPortal/CustomerAuth.Controller');
const { verifyCustomerToken } = require('../../middleware/customerAuth');

router.post('/register', customerAuthController.register);
router.post('/login', customerAuthController.login);
router.get('/me', verifyCustomerToken, customerAuthController.me);
router.put('/change-password', verifyCustomerToken, customerAuthController.changePassword);

module.exports = router;
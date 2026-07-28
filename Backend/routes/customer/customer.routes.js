const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customer/customer.controller');

router.get('/', customerController.getAllCustomers);
router.post('/', customerController.addCustomer);

module.exports = router;

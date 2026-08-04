const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customer/Customer.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Any staff member who deals with customers day-to-day can view the list
router.get('/', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'), customerController.getAllCustomers);

// Only staff who actually onboard customers can create new ones (not Auditor - read-only role)
router.post('/', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller'), customerController.addCustomer);

module.exports = router;

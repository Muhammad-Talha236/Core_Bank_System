const express = require('express');
const router = express.Router();
const accountController = require('../../controllers/account/account.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

router.get('/', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'), accountController.getAllAccounts);
router.get('/check/:customerId', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller'), accountController.checkCustomerAccount);
router.post('/', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller'), accountController.createAccount);

module.exports = router;
const express = require('express');
const router = express.Router();
const accountController = require('../../controllers/account/account.Controller');
const accountProductController = require('../../controllers/account/accountProduct.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

const CAN_VIEW = ['SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'];
const CAN_MANAGE = ['SuperAdmin', 'Admin', 'BranchManager', 'Teller'];

router.get('/', verifyToken, requireRole(...CAN_VIEW), accountController.getAllAccounts);
router.get('/products', verifyToken, requireRole(...CAN_VIEW), accountProductController.getProducts);
router.get('/check/:customerId', verifyToken, requireRole(...CAN_MANAGE), accountController.checkCustomerAccount);
router.post('/', verifyToken, requireRole(...CAN_MANAGE), accountController.createAccount);
router.post('/:accountNo/close-term-deposit', verifyToken, requireRole(...CAN_MANAGE), accountController.closeTermDeposit);

module.exports = router;
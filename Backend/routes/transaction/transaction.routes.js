const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transaction/transaction.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

const CAN_TRANSACT = ['SuperAdmin', 'Admin', 'BranchManager', 'Teller'];
const CAN_APPROVE = ['SuperAdmin', 'Admin', 'BranchManager'];

router.post('/deposit', verifyToken, requireRole(...CAN_TRANSACT), transactionController.deposit);
router.post('/withdraw', verifyToken, requireRole(...CAN_TRANSACT), transactionController.withdraw);
router.post('/transfer', verifyToken, requireRole(...CAN_TRANSACT), transactionController.transfer);

// Maker-checker approval queue
router.get('/pending', verifyToken, requireRole(...CAN_APPROVE), transactionController.getPendingTransactions);
router.post('/:transId/approve', verifyToken, requireRole(...CAN_APPROVE), transactionController.approveTransaction);
router.post('/:transId/reject', verifyToken, requireRole(...CAN_APPROVE), transactionController.rejectTransaction);

router.get('/ledger/:accountNo', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'), transactionController.getAccountLedger);

module.exports = router;

const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transaction/transaction.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');
const { transactionLimiter } = require('../../middleware/rateLimiter');
const CAN_TRANSACT = ['SuperAdmin', 'Admin', 'BranchManager', 'Teller'];
const CAN_APPROVE = ['SuperAdmin', 'Admin', 'BranchManager'];
const { checkIdempotency } = require('../../middleware/idempotency');
router.post('/deposit', verifyToken, requireRole(...CAN_TRANSACT),transactionLimiter, checkIdempotency,transactionController.deposit);
router.post('/withdraw', verifyToken, requireRole(...CAN_TRANSACT), transactionLimiter,checkIdempotency,transactionController.withdraw);
router.post('/transfer', verifyToken, requireRole(...CAN_TRANSACT),transactionLimiter, checkIdempotency,transactionController.transfer);

// Maker-checker approval queue
router.get('/pending', verifyToken, requireRole(...CAN_APPROVE), transactionController.getPendingTransactions);
router.post('/:transId/approve', verifyToken, requireRole(...CAN_APPROVE), transactionController.approveTransaction);
router.post('/:transId/reject', verifyToken, requireRole(...CAN_APPROVE), transactionController.rejectTransaction);

router.get('/ledger/:accountNo', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'), transactionController.getAccountLedger);

module.exports = router;
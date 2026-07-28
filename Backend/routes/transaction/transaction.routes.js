const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transaction/transaction.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Only roles that actually process money movements can initiate these -
// Auditor is deliberately excluded here (read-only role)
router.post('/deposit', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller'), transactionController.deposit);
router.post('/withdraw', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller'), transactionController.withdraw);
router.post('/transfer', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller'), transactionController.transfer);

// Ledger history is read-only, so Auditor can see it too
router.get('/ledger/:accountNo', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'), transactionController.getAccountLedger);

module.exports = router;
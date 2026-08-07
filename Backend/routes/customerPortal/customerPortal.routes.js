const express = require('express');
const router = express.Router();
const customerPortalController = require('../../controllers/customerPortal/CustomerPortal.Controller');
const { verifyCustomerToken } = require('../../middleware/customerAuth');
const { transactionLimiter } = require('../../middleware/rateLimiter'); 
router.use(verifyCustomerToken); // every route below requires a logged-in customer

router.get('/accounts', customerPortalController.getMyAccounts);
router.get('/ledger/:accountNo', customerPortalController.getMyLedger);
router.post('/transfer', transactionLimiter,customerPortalController.transfer);
router.get('/billers', transactionLimiter,customerPortalController.getBillers);
router.post('/bill-payment', transactionLimiter,customerPortalController.payBill);
router.get('/bill-payments', transactionLimiter,customerPortalController.getMyBillPayments);

module.exports = router;
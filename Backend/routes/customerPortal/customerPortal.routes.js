const express = require('express');
const router = express.Router();
const customerPortalController = require('../../controllers/customerPortal/customerPortal.controller');
const { verifyCustomerToken } = require('../../middleware/customerAuth');

router.use(verifyCustomerToken); // every route below requires a logged-in customer

router.get('/accounts', customerPortalController.getMyAccounts);
router.get('/ledger/:accountNo', customerPortalController.getMyLedger);
router.post('/transfer', customerPortalController.transfer);
router.get('/billers', customerPortalController.getBillers);
router.post('/bill-payment', customerPortalController.payBill);
router.get('/bill-payments', customerPortalController.getMyBillPayments);

module.exports = router;
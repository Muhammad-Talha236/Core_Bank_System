const express = require('express');
const router = express.Router();
const auditController = require('../../controllers/audit/audit.controller');

router.get('/', auditController.getAllAuditLogs);

module.exports = router;

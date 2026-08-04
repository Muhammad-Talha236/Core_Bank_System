const express = require('express');
const router = express.Router();
const auditController = require('../../controllers/audit/audit.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Audit trail viewing - the roles whose job is oversight/compliance
router.get('/', verifyToken, requireRole('SuperAdmin', 'Admin', 'BranchManager', 'Auditor'), auditController.getAllAuditLogs);

module.exports = router;
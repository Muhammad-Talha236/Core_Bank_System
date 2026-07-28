const express = require('express');
const router = express.Router();
const branchController = require('../../controllers/superadmin/branch.controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Any logged-in employee can view branches (needed for dropdowns etc.)
router.get('/', verifyToken, branchController.getAllBranches);

// Only SuperAdmin can create new branches
router.post('/', verifyToken, requireRole('SuperAdmin'), branchController.createBranch);

module.exports = router;

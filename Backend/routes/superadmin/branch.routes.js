const express = require('express');
const router = express.Router();
const branchController = require('../../controllers/superadmin/branch.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Any logged-in employee can view branches (needed for dropdowns etc.)
router.get('/', verifyToken, branchController.getAllBranches);

// Only SuperAdmin can create, edit, or activate/deactivate branches
router.post('/', verifyToken, requireRole('SuperAdmin'), branchController.createBranch);
router.put('/:branchId', verifyToken, requireRole('SuperAdmin'), branchController.updateBranch);
router.patch('/:branchId/status', verifyToken, requireRole('SuperAdmin'), branchController.updateBranchStatus);

module.exports = router;
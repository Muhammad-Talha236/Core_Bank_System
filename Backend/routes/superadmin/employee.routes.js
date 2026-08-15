const express = require('express');
const router = express.Router();
const employeeController = require('../../controllers/superadmin/employee.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Every route here requires: logged in AND role = SuperAdmin
router.use(verifyToken, requireRole('SuperAdmin'));

router.get('/', employeeController.getAllEmployees);
router.get('/roles', employeeController.getAllRoles);
router.post('/', employeeController.createEmployee);
router.put('/:employeeId', employeeController.updateEmployee);
router.patch('/:employeeId/status', employeeController.updateEmployeeStatus);
router.patch('/:employeeId/reset-password', employeeController.resetPassword);

module.exports = router;
const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/superadmin/settings.Controller');
const { verifyToken, requireRole } = require('../../middleware/auth');

// Every route here requires: logged in AND role = SuperAdmin
router.use(verifyToken, requireRole('SuperAdmin'));

router.get('/', settingsController.getSettings);
router.put('/:key', settingsController.updateSettingValue);

module.exports = router;
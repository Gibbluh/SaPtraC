const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Only Super Admin and Administrator can manage schedules
const adminRoles = ['Super Admin', 'Administrator', 'Operational Manager'];

// Create Schedule
router.post(
  '/',
  verifyToken,
  authorizeRoles(...adminRoles),
  scheduleController.createSchedule
);

// Get Schedules (list)
router.get(
  '/',
  verifyToken,
  authorizeRoles(...adminRoles),
  scheduleController.getSchedules
);

// Get Single Schedule
router.get(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  scheduleController.getSingleSchedule
);

// Update Schedule
router.put(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  scheduleController.updateSchedule
);

// Delete Schedule (soft delete)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  scheduleController.deleteSchedule
);

module.exports = router;

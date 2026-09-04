const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const maintenanceUpload = require('../middleware/maintenanceUploadMiddleware');

// Only Super Admin, Administrator, and Mechanic can access maintenance endpoints
const allowedRoles = ['Super Admin', 'Administrator', 'Mechanic'];

// Create Maintenance
router.post(
  '/',
  verifyToken,
  authorizeRoles(...allowedRoles),
  maintenanceUpload.maintenanceUploadFields,
  maintenanceController.createMaintenance
);

// Get Maintenance (list)
router.get(
  '/',
  verifyToken,
  authorizeRoles(...allowedRoles),
  maintenanceController.getMaintenance
);

// Driver Issue Report
router.post(
  "/driver-report",
  maintenanceController.driverReportIssue
);

// Public maintenance history per unit
router.get(
  "/unit/:unitId",
  maintenanceController.getMaintenanceByUnit
);

router.get(
  "/summary/unit/:unitId",
  maintenanceController.getUnitMaintenanceSummary
);

router.get(
  "/health/unit/:unitId",
  maintenanceController.getUnitHealth
);

router.get(
  "/decision/unit/:unitId",
  maintenanceController.getMaintenanceDecision
);

// Get Single Maintenance
router.get(
  '/:id',
  verifyToken,
  authorizeRoles(...allowedRoles),
  maintenanceController.getSingleMaintenance
);

// Update Maintenance
router.put(
  '/:id',
  verifyToken,
  authorizeRoles(...allowedRoles),
  maintenanceUpload.maintenanceUploadFields,
  maintenanceController.updateMaintenance
);

// Delete Maintenance (soft delete)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles(...allowedRoles),
  maintenanceController.deleteMaintenance
);

// Update Maintenance Status
router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles(...allowedRoles),
  maintenanceController.updateMaintenanceStatus
);

// Assign Mechanic
router.patch(
  '/:id/assign-mechanic',
  verifyToken,
  authorizeRoles(...allowedRoles),
  maintenanceController.assignMechanic
);

module.exports = router;

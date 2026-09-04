const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Only Super Admin and Administrator can manage drivers
const adminRoles = ['Super Admin', 'Administrator'];

const readRoles = ['Super Admin', 'Administrator', 'Operational Manager', 'Cashier', 'Fuel Pump Attendant'];

// Create Driver
router.post(
  '/',
  verifyToken,
  authorizeRoles(...adminRoles),
  uploadMiddleware.driverUploadFields,
  driverController.createDriver
);

router.get(
   "/qr/:code",
   verifyToken,
   authorizeRoles(...adminRoles, "Operational Manager", "Cashier", "Fuel Pump Attendant"),
   driverController.getDriverByQR
);

router.get(
  "/dropdown",
  verifyToken,
  authorizeRoles(...readRoles),
  driverController.getDriversDropdown
);

// Get Drivers (list)
router.get(
  '/',
  verifyToken,
  authorizeRoles(...readRoles),
  driverController.getDrivers
);

router.get(
  "/public/:id",
  driverController.getPublicDriver
);

// Get Single Driver
router.get(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  driverController.getSingleDriver
);

// Update Driver
router.put(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  uploadMiddleware.driverUploadFields,
  driverController.updateDriver
);

// Update Driver Status
router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles(...adminRoles),
  driverController.updateDriverStatus
);

// Delete Driver (soft delete)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  driverController.deleteDriver
);

module.exports = router;

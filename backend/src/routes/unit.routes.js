const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Only Super Admin and Administrator can manage units
const adminRoles = ['Super Admin', 'Administrator'];

const readRoles = ['Super Admin', 'Administrator', 'Operational Manager', 'Cashier', 'Fuel Pump Attendant'];

console.log(__filename);
console.log(require.resolve("../controllers/unit.controller"));
console.log(unitController);

// Create Unit
router.post(
  '/',
  verifyToken,
  authorizeRoles(...adminRoles),
  unitController.createUnit
);

// Get Units (list)
router.get(
  '/',
  verifyToken,
  authorizeRoles(...readRoles),
  unitController.getUnits
);

router.get(
    "/qr/:code",
    unitController.getUnitByQR
);

router.get(
    "/public/:id",
    unitController.getPublicUnit
);

router.get(
  "/dropdown/public",
  unitController.getUnitsDropdown
);

router.get(
  "/dropdown",
  verifyToken,
  authorizeRoles(...readRoles),
  unitController.getUnitsDropdown
);

// Get Single Unit
router.get(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  unitController.getSingleUnit
);

// Update Unit
router.put(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  unitController.updateUnit
);

// Update Unit Availability Status
router.patch(
  '/:id/availability',
  verifyToken,
  authorizeRoles(...adminRoles),
  unitController.updateUnitAvailability
);

// Update Unit Maintenance Status
router.patch(
  '/:id/maintenance',
  verifyToken,
  authorizeRoles(...adminRoles),
  unitController.updateUnitMaintenance
);

// Delete Unit (soft delete)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles(...adminRoles),
  unitController.deleteUnit
);

module.exports = router;

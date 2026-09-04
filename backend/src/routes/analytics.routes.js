const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Roles allowed to access dashboard analytics
const dashboardRoles = [ "Super Admin", "Administrator", "Operational Manager", "Cashier", "Mechanic", "Fuel Pump Attendant",];

// Dashboard Summary
router.get(
  '/dashboard',
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getDashboard
);

// Revenue Analytics
router.get(
  '/revenue',
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getRevenue
);

// Fuel Analytics
router.get(
  '/fuel',
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getFuel
);

// Maintenance Analytics
router.get(
  '/maintenance',
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getMaintenance
);

// Driver Performance Analytics
router.get(
  '/drivers',
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getDrivers
);

// Remittance Analytics
router.get(
  '/remittances',
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getRemittances
);

// Unit Availability Analytics
router.get(
  '/units',
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getUnits
);

router.get(
    "/fleet-health",
    verifyToken,
    authorizeRoles(...dashboardRoles),
    analyticsController.getFleetHealth
);

router.get(
  "/executive",
  verifyToken,
  authorizeRoles(...dashboardRoles),
  analyticsController.getExecutiveSummary
);

module.exports = router;

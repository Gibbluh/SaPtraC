const express = require('express');
const router = express.Router();
const remittanceController = require('../controllers/remittance.controller');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Only Super Admin, Administrator, and Cashier can access remittance endpoints
const allowedRoles = ['Super Admin', 'Administrator', 'Cashier'];

// Create Remittance
router.post(
  '/',
  verifyToken,
  authorizeRoles(...allowedRoles),
  remittanceController.createRemittance
);

// Get Remittances (list)
router.get(
  '/',
  verifyToken,
  authorizeRoles(...allowedRoles),
  remittanceController.getRemittances
);

// Get Single Remittance
router.get(
  '/:id',
  verifyToken,
  authorizeRoles(...allowedRoles),
  remittanceController.getSingleRemittance
);

// Update Remittance
router.put(
  '/:id',
  verifyToken,
  authorizeRoles(...allowedRoles),
  remittanceController.updateRemittance
);

// Delete Remittance (soft delete)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles(...allowedRoles),
  remittanceController.deleteRemittance
);

// Verify Remittance
router.patch(
  '/:id/verify',
  verifyToken,
  authorizeRoles(...allowedRoles),
  remittanceController.verifyRemittance
);

// Reject Remittance
router.patch(
  '/:id/reject',
  verifyToken,
  authorizeRoles(...allowedRoles),
  remittanceController.rejectRemittance
);

module.exports = router;

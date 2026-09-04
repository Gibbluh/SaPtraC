const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Create User
router.post(
  '/',
  verifyToken,
  authorizeRoles('Super Admin'),
  userController.createUser
);

// Get Users (list)
router.get(
  '/',
  verifyToken,
  authorizeRoles('Super Admin', 'Administrator'),
  userController.getUsers
);

// Get Single User
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Super Admin', 'Administrator'),
  userController.getSingleUser
);

// Update User
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Super Admin', 'Administrator'),
  userController.updateUser
);

// Deactivate/Activate User
router.patch(
  '/:id/deactivate',
  verifyToken,
  authorizeRoles('Super Admin', 'Administrator'),
  userController.deactivateUser
);

// Delete User (Super Admin only)
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Super Admin'),
  userController.deleteUser
);

module.exports = router;

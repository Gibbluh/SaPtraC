const { body } = require('express-validator');

const allowedRoles = [
  'Super Admin',
  'Administrator',
  'Cashier',
  'Fuel Pump Attendant',
  'Operational Manager',
  'Mechanic',
];

// Validation for creating/updating a user
const userValidationRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2 }).withMessage('Full name must be at least 2 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email format.'),

  body('password')
    .optional({ checkFalsy: true }) // allow optional for update
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),

  body('role')
    .optional()
    .isIn(allowedRoles).withMessage('Invalid role.'),
];

module.exports = {
  userValidationRules,
};

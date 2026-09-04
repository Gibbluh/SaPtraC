const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');
const validationMiddleware = require('../middleware/validationMiddleware');
const jwt = require("jsonwebtoken");

// NOTE: replace this with real user lookup
const DUMMY_USERS = [
  { id: "1", email: "super@local", password: "pass", role: "Super Admin", name: "Super" },
  { id: "2", email: "admin@local", password: "pass", role: "Administrator", name: "Admin" },
  { id: "3", email: "cashier@local", password: "pass", role: "Cashier", name: "Cashier" },
  { id: "4", email: "pump@local", password: "pass", role: "Fuel Pump Attendant", name: "Pump" },
  { id: "5", email: "op@local", password: "pass", role: "Operational Manager", name: "Ops" },
  { id: "6", email: "mech@local", password: "pass", role: "Mechanic", name: "Mech" },
];

router.post('/register', validationMiddleware.register, authController.registerUser);
router.post('/login', validationMiddleware.login, authController.loginUser);
router.get('/me', verifyToken, authController.getCurrentUser);
router.post('/logout', verifyToken, authController.logoutUser);
// local dummy login endpoint (keeps backward compatibility)
router.post('/login-local', (req, res) => {
  const { email, password } = req.body;
  const user = DUMMY_USERS.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const secret = process.env.JWT_SECRET || "dev_secret";
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, secret, { expiresIn: "8h" });

  return res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, token });
});

module.exports = router;

console.log("TOKEN VALUE:", process.env.TOKEN);
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.TOKEN;
const JWT_EXPIRES = '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
};

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    // Prevent role assignment by user
    const user = new User({ fullName, email, password });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive },
      token,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Registration failed.' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(
  password,
  user.password
);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = generateToken(user);
    res.json({
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive },
      token,
    });
  } catch (err) {
  console.error("LOGIN ERROR:", err);

  res.status(500).json({
    message: err.message,
  });
}
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
};

exports.logoutUser = async (req, res) => {
  // On frontend, just remove token. Optionally, you can blacklist token here.
  res.json({ message: 'Logged out successfully.' });
};

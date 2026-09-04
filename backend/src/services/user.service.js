const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const allowedRoles = [
  'Super Admin',
  'Administrator',
  'Cashier',
  'Fuel Pump Attendant',
  'Operational Manager',
  'Mechanic',
];

const userProjection = '-password -__v';

// Create User Service
async function createUserService({ fullName, email, password, role }) {
  if (!fullName || !email || !password) {
    throw { status: 400, message: 'All fields are required.' };
  }
  if (role && !allowedRoles.includes(role)) {
    throw { status: 400, message: 'Invalid role.' };
  }
  const existing = await User.findOne({ email });
  if (existing) {
    throw { status: 409, message: 'Email already exists.' };
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    fullName,
    email,
    password: hashedPassword,
    role: role || 'Cashier',
  });
  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

// Get Users Service (pagination, search, filter, sort)
async function getUsersService({ page = 1, limit = 10, search = '', role, sort = 'desc' }) {
  page = parseInt(page);
  limit = parseInt(limit);
  const query = { deleted: { $ne: true } };
  if (role && allowedRoles.includes(role)) {
    query.role = role;
  }
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select(userProjection)
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Get Single User Service
async function getSingleUserService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid user ID.' };
  }
  const user = await User.findOne({ _id: id, deleted: { $ne: true } }).select(userProjection);
  if (!user) throw { status: 404, message: 'User not found.' };
  return user;
}

// Update User Service
async function updateUserService(id, { fullName, email, role, password }) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid user ID.' };
  }
  const user = await User.findOne({ _id: id, deleted: { $ne: true } });
  if (!user) throw { status: 404, message: 'User not found.' };
  if (email && email !== user.email) {
    const exists = await User.findOne({ email });
    if (exists) {
      throw { status: 409, message: 'Email already exists.' };
    }
    user.email = email;
  }
  if (fullName) user.fullName = fullName;
  if (role && allowedRoles.includes(role)) user.role = role;
  if (password) user.password = await bcrypt.hash(password, 10);
  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

// Deactivate/Activate User Service
async function deactivateUserService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid user ID.' };
  }
  const user = await User.findOne({ _id: id, deleted: { $ne: true } });
  if (!user) throw { status: 404, message: 'User not found.' };
  user.isActive = !user.isActive;
  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  return { user: userObj, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` };
}

// Soft Delete User Service
async function deleteUserService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid user ID.' };
  }
  const user = await User.findOne({ _id: id, deleted: { $ne: true } });
  if (!user) throw { status: 404, message: 'User not found.' };
  user.deleted = true;
  user.isActive = false;
  await user.save();
  return { message: 'User deleted (soft delete).' };
}

module.exports = {
  createUserService,
  getUsersService,
  getSingleUserService,
  updateUserService,
  deactivateUserService,
  deleteUserService,
};

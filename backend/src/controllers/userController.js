const userService = require('../services/user.service');

// 1. Create User
exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUserService(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

// 2. Get Users (with pagination, search, filter, sort)
exports.getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsersService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 3. Get Single User
exports.getSingleUser = async (req, res, next) => {
  try {
    const user = await userService.getSingleUserService(req.params.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// 4. Update User
exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUserService(req.params.id, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// 5. Deactivate/Activate User
exports.deactivateUser = async (req, res, next) => {
  try {
    const result = await userService.deactivateUserService(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 6. Soft Delete User
exports.deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUserService(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

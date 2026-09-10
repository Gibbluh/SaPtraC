const Driver = require('../models/driver.model');
const mongoose = require('mongoose');
const generateQRCode = require('../utils/generateQRCode');
const Remittance = require("../models/remittance.model");
const {
  buildEntityQRPayload,
  decodeEntityQRPayload,
  extractEntityId,
} = require("../utils/qrPayload");

async function getNextDriverCode() {
  const latest = await Driver.findOne({ driverCode: /^DRV-\d+$/ })
    .sort({ driverCode: -1 })
    .select({ driverCode: 1 })
    .lean();

  const nextNumber = latest?.driverCode
    ? Number(latest.driverCode.replace("DRV-", "")) + 1
    : (await Driver.countDocuments({})) + 1;

  return `DRV-${String(nextNumber).padStart(4, "0")}`;
}

// Create Driver Service
async function createDriverService(data) {
  const { email, licenseNumber, firstName, lastName, middleName, profileImage, documents } = data;
  // Check for duplicate email
  const emailExists = await Driver.findOne({ email, deletedAt: null });
  if (emailExists) {
    throw { status: 409, message: 'Email already exists.' };
  }
  // Check for duplicate license number
  const licenseExists = await Driver.findOne({ licenseNumber, deletedAt: null });
  if (licenseExists) {
    throw { status: 409, message: 'License number already exists.' };
  }
  if (data.driverCode) {
    const codeExists = await Driver.findOne({
      driverCode: String(data.driverCode).toUpperCase(),
      deletedAt: null,
    });
    if (codeExists) {
      throw { status: 409, message: 'Driver code already exists.' };
    }
  }
  const driver = new Driver(data);
  driver.driverCode = data.driverCode || await getNextDriverCode();
  // If file uploads present, set fields
  if (profileImage) driver.profileImage = profileImage;
  if (documents && Array.isArray(documents) && documents.length > 0) driver.documents = documents;

  driver.qrCode = await generateQRCode(
    buildEntityQRPayload("driver", driver.driverCode)
  );

  try {
    await driver.save();
    return driver;
  } catch (err) {
    if (err?.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];
      if (duplicateField === "email") {
        throw { status: 409, message: "Email already exists." };
      }
      if (duplicateField === "licenseNumber") {
        throw { status: 409, message: "License number already exists." };
      }
      if (duplicateField === "driverCode") {
        throw { status: 409, message: "Driver code already exists." };
      }
      throw { status: 409, message: "Duplicate driver record." };
    }

    if (err?.name === "ValidationError") {
      const message = Object.values(err.errors || {})
        .map((item) => item.message)
        .join(" ");
      throw {
        status: 400,
        message: message || "Driver validation failed.",
      };
    }

    throw err;
  }
}
async function getDriverByQRService(code) {
  const payload = decodeEntityQRPayload(code);
  const id = extractEntityId(payload, "driver");

  if (!id) {
    throw {
      status: 400,
      message: "Invalid QR Code"
    };
  }

  const driver = await Driver.findOne({
    $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { driverCode: String(id).toUpperCase() }],
    deletedAt: null,
  });

  if (!driver) {
    throw {
      status: 404,
      message: "Driver not found"
    };
  }

  return driver;
}

async function getDriversDropdownService() {
  return Driver.find(
    {
      deletedAt: null,
      status: "Active",
    },
    {
      firstName: 1,
      middleName: 1,
      lastName: 1,
    }
  );
}

// Get Drivers Service (pagination, search, filter, sort)
async function getDriversService({ page = 1, limit = 1000, search = '', status }) {
  page = parseInt(page);
  limit = parseInt(limit);
  const query = { deletedAt: null };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { licenseNumber: { $regex: search, $options: 'i' } },
    ];
  }
  const drivers = await Driver.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Driver.countDocuments(query);
  return {
    drivers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Get Single Driver Service
async function getSingleDriverService(id) {
  // Driver Information
  const driver = await Driver.findOne({
    ...(mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { driverCode: String(id).toUpperCase() }),
    deletedAt: null,
  }).lean();

  if (!driver) {
    throw {
      status: 404,
      message: "Driver not found.",
    };
  }

  // Lifetime Statistics
  const summary = await Remittance.aggregate([
    {
      $match: {
        driver: driver._id,
        verificationStatus: "Verified",
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$driver",

        totalLifetimeFuelCost: {
          $sum: "$fuelDeduction",
        },

        totalLifetimeDieselConsumption: {
          $sum: "$totalDieselConsumption",
        },

        totalLifetimeRemit: {
          $sum: "$totalBoundary"
        }
      },
    },
  ]);

  driver.totalLifetimeFuelCost =
    summary[0]?.totalLifetimeFuelCost || 0;

  driver.totalLifetimeDieselConsumption =
    summary[0]?.totalLifetimeDieselConsumption || 0;

  driver.totalLifetimeRemit =
    summary[0]?.totalLifetimeRemit || 0;

  return driver;
}

// Update Driver Service
async function updateDriverService(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid driver ID.' };
  }
  // Prevent duplicate email
  if (data.email) {
    const emailExists = await Driver.findOne({ email: data.email, _id: { $ne: id }, deletedAt: null });
    if (emailExists) {
      throw { status: 409, message: 'Email already exists.' };
    }
  }
  // Prevent duplicate license number
  if (data.licenseNumber) {
    const licenseExists = await Driver.findOne({ licenseNumber: data.licenseNumber, _id: { $ne: id }, deletedAt: null });
    if (licenseExists) {
      throw { status: 409, message: 'License number already exists.' };
    }
  }
  const updateData = { ...data };
  // If file uploads present, set fields
  if (data.profileImage) updateData.profileImage = data.profileImage;
  if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) updateData.documents = data.documents;
  const driver = await Driver.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: updateData },
    { new: true }
  );
  if (!driver) {
    throw { status: 404, message: 'Driver not found.' };
  }
  return driver;
}

// Soft Delete Driver Service
async function deleteDriverService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid driver ID.' };
  }
  const driver = await Driver.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!driver) {
    throw { status: 404, message: 'Driver not found.' };
  }
  return { message: 'Driver deleted successfully.' };
}

// Update Driver Status Service
async function updateDriverStatusService(id, status) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid driver ID.' };
  }
  const driver = await Driver.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { status } },
    { new: true }
  );
  if (!driver) {
    throw { status: 404, message: 'Driver not found.' };
  }
  return driver;
}

module.exports = {
  createDriverService,
  getDriverByQRService,
  getDriversService,
  getSingleDriverService,
  updateDriverService,
  deleteDriverService,
  updateDriverStatusService,
  getDriversDropdownService,
};

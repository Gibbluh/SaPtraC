const mongoose = require('mongoose');

const driverStatusEnum = ['Active', 'Inactive', 'Suspended'];

const driverSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    emergencyContact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      relation: { type: String, trim: true },
    },
    licenseNumber: { type: String, required: true, unique: true, trim: true, index: true },
    licenseType: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date, required: true },
    status: { type: String, enum: driverStatusEnum, default: 'Active', index: true },
    profileImage: { type: String }, // URL or path
    documents: [{ type: String }], // Array of URLs/paths
    qrCode: { type: String }, // URL or data string
    assignedUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null, index: true }, // Soft delete

    // Additive lifetime statistics
    totalLifetimeRemit: { type: Number, default: 0, min: 0 },
    totalLifetimeFuelCost: { type: Number, default: 0, min: 0, },
    totalLifetimeDieselConsumption: { type: Number, default: 0, min: 0 },
    totalPilaTrips: { type: Number, default: 0, min: 0 },
    totalSalubongTrips: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

driverSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

driverSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, deletedAt: null });
};

module.exports = mongoose.model('Driver', driverSchema);

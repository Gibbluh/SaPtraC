const mongoose = require('mongoose');

const availabilityStatusEnum = ['Available', 'On Route', 'Under Maintenance', 'Inactive'];
const maintenanceStatusEnum = ['Good', 'Needs Maintenance', 'Under Repair'];

const unitSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true, trim: true, index: true },
    bodyNumber: { type: String, required: true, unique: true, trim: true, index: true },
    route: { type: String, trim: true },
    driverAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', index: true },
    unitType: { type: String, required: true, trim: true },
    fuelType: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    totalLifetimeDieselConsumption: { type: Number, default: 0, min: 0, },
    totalLifetimeFuelCost: { type: Number, default: 0, min: 0, },
    totalLifetimeMaintenanceCost: { type: Number, default: 0, min: 0, },
    healthPercentage: { type: Number, default: 100, min: 0, max: 100, },
    healthStatus: { type: String, default: "Excellent", },
    availabilityStatus: { type: String, enum: availabilityStatusEnum, default: 'Available', index: true },
    maintenanceStatus: { type: String, enum: maintenanceStatusEnum, default: 'Good', index: true },
    registrationExpiry: { type: Date, required: true },
    insuranceExpiry: { type: Date, required: true },
    qrCode: { type: String }, // URL or data string
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null, index: true }, // Soft delete
  },
  { timestamps: true }
);

unitSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

unitSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, deletedAt: null });
};

module.exports = mongoose.model('Unit', unitSchema);

const mongoose = require('mongoose');

const scheduleStatusEnum = ['Scheduled', 'Active', 'Completed', 'Cancelled'];
const scheduleTypeEnum = ['Regular', 'Emergency'];

const scheduleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true,
    },
    route: {
      type: String,
      trim: true,
      required: true,
    },
    shiftDate: {
      type: Date,
      required: true,
      index: true,
    },
    shiftStart: {
    type: String,
    required: true,
},

shiftEnd: {
    type: String,
    required: true,
},

shiftType: {
    type: String,
    enum: ["First Shift", "Second Shift"],
    required: true,
},
    status: {
      type: String,
      enum: scheduleStatusEnum,
      default: 'Scheduled',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relieverDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
    conflictDetected: {
      type: Boolean,
      default: false,
      index: true,
    },
    scheduleType: {
      type: String,
      enum: scheduleTypeEnum,
      default: 'Regular',
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate active schedules for the same driver/unit/shiftDate/shiftStart/shiftEnd
// Only one active (Scheduled/Active) schedule per driver/unit/shift
// Compound unique index with partialFilterExpression
scheduleSchema.index(
  {
    driver: 1,
    unit: 1,
    shiftDate: 1,
    shiftStart: 1,
    shiftEnd: 1,
    deletedAt: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['Scheduled', 'Active'] },
      deletedAt: null,
    },
    name: 'unique_active_schedule',
  }
);

scheduleSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

scheduleSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, deletedAt: null });
};

module.exports = mongoose.model('Schedule', scheduleSchema);

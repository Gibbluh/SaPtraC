const mongoose = require('mongoose');

const verificationStatusEnum = ['Pending', 'Verified', 'Rejected'];

const routeEnum = [
  'Langgam',
  'Villarosa',
  'Bayan-Bayanan',
  'Estrella',
  'Calamba',
];

const remittanceSchema = new mongoose.Schema(
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

    fuelTransaction: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "FuelTransaction",
  required: false,
  index: true,
  },

    route: {
     type: String,
     required: true,
     trim: true,
     enum: routeEnum,
     index: true,
  },


    totalBoundary: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelDeduction: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    salaryDeduction: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    otherExpenses: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    cooperativeIncome: {
      type: Number,
      required: true,
      min: 0,
    },
    driverNetIncome: {
      type: Number,
      default: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    negativeBalance: {
      type: Number,
      default: 0,
    },
    remittanceDate: {
      type: Date,
      required: true,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: verificationStatusEnum,
      default: 'Pending',
      index: true,
    },
   
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    verificationTimestamp: {
      type: Date,
      default: null,
    },

    // ... Additive fields for simplified remittance tracking (do not remove existing fields)
    totalDieselConsumption: { type: Number, default: 0, min: 0 },
    pilaTrips: { type: Number, default: 0, min: 0 },
    salubongTrips: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

remittanceSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

remittanceSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, deletedAt: null });
};

module.exports = mongoose.model('Remittance', remittanceSchema);

const mongoose = require('mongoose');

const shiftTypeEnum = ['First Shift', 'Second Shift'];

const fuelTransactionSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    unit: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Unit",
  required: true,
  index: true,
},

route: {
  type: String,
  enum: [
    "Langgam",
    "Villarosa",
    "Bayan-Bayanan",
    "Estrella",
    "Calamba",
  ],
},

totalBoundary: {
  type: Number,
  default: 0,
},

totalDieselConsumption: {
  type: Number,
  default: 0,
},

pilaTrips: {
  type: Number,
  default: 0,
},

salubongTrips: {
  type: Number,
  default: 0,
},

totalRemit: {
  type: Number,
  default: 0,
},

receiptNumber: {
  type: String,
},

 qrCodeData: {
      type: String,
      trim: true,
    },

qrImage: {
  type: String,
},

    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: false,
      index: true,
    },
    fuelLiters: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelCost: {
      type: Number,
      required: true,
      min: 0,
    },
    odometerIn: {
      type: Number,
      required: true,
      min: 0,
    },
    odometerOut: {
      type: Number,
      min: 0,
    },
    fuelStation: {
      type: String,
      required: true,
      trim: true,
    },
    shiftType: {
      type: String,
      enum: shiftTypeEnum,
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    anomalyDetected: {
      type: Boolean,
      default: false,
      index: true,
    },
    anomalyReason: {
      type: String,
      trim: true,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

fuelTransactionSchema.pre("save", function (next) {
  this.totalRemit =
  Number(this.totalBoundary || 0);

  next();
});

fuelTransactionSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

fuelTransactionSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, deletedAt: null });
};

module.exports = mongoose.model('FuelTransaction', fuelTransactionSchema);

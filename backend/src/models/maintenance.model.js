const mongoose = require('mongoose');

const priorityLevels = ['Low', 'Medium', 'High', 'Critical'];
const maintenanceStatuses = [
  'Pending',
  'Diagnosed',
  'In Progress',
  'Waiting Parts',
  'Completed',
  'Cancelled',
];
const maintenanceTypes = ['Preventive', 'Corrective', 'Emergency'];

const maintenanceSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedMechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    issueTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    issueDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    issueCategory: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    priorityLevel: {
      type: String,
      enum: priorityLevels,
      required: true,
      index: true,
    },
    maintenanceStatus: {
      type: String,
      enum: maintenanceStatuses,
      default: 'Pending',
      index: true,
    },
    maintenanceType: {
      type: String,
      enum: maintenanceTypes,
      required: true,
      index: true,
    },
   
    reportSource: {
  type: String,
  enum: ["Admin", "Driver"],
  default: "Admin",
},

verificationStatus: {
  type: String,
  enum: ["Pending", "Verified", "Rejected"],
  default: "Verified",
},

    issueImages: [{
      type: String,
      trim: true,
    }],
    repairDocuments: [{
      type: String,
      trim: true,
    }],
    reportedDate: {
      type: Date,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedCompletionDate: {
      type: Date,
      default: null,
    },

    repairNotes: {
  type: String,
  trim: true,
  default: "",
},

partsReplaced: [
  {
    type: String,
    trim: true,
  },
],

laborHours: {
  type: Number,
  default: 0,
},

    recurringIssueDetected: {
      type: Boolean,
      default: false,
      index: true,
    },
    recurringIssueCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    laborCost: {
  type: Number,
  default: 0,
  min: 0,
},

partsCost: {
  type: Number,
  default: 0,
  min: 0,
},

miscellaneousCost: {
  type: Number,
  default: 0,
  min: 0,
},

totalCost: {
  type: Number,
  default: 0,
  min: 0,
},
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

maintenanceSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

maintenanceSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, deletedAt: null });
};

module.exports = mongoose.model('Maintenance', maintenanceSchema);

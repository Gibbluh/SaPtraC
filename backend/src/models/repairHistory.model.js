const mongoose = require('mongoose');
const RepairHistory = require("../models/repairHistory.model");

const actionTypes = [
  'IssueCreated',
  'MechanicAssigned',
  'StatusUpdated',
  'RepairStarted',     
  'RepairCompleted',
  'PartsReplaced',
  'MaintenanceNoteAdded',
];

const repairHistorySchema = new mongoose.Schema(
  {
    maintenance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Maintenance',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: actionTypes,
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    previousData: {
      type: Object,
      default: null,
    },
    newData: {
      type: Object,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

repairHistorySchema.index({ maintenance: 1, actionType: 1 });

module.exports = mongoose.model('RepairHistory', repairHistorySchema);

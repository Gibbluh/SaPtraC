const mongoose = require('mongoose');

const actionTypes = [
  'Created',
  'Updated',
  'Deleted',
  'DriverReplaced',
  'StatusChanged',
];

const scheduleHistorySchema = new mongoose.Schema(
  {
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
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
  },
  { timestamps: true }
);

scheduleHistorySchema.index({ schedule: 1, actionType: 1 });

module.exports = mongoose.model('ScheduleHistory', scheduleHistorySchema);

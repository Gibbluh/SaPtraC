const mongoose = require('mongoose');

const actionTypes = [
  'Created',
  'Updated',
  'Verified',
  'Rejected',
  'Deleted',
];

const remittanceHistorySchema = new mongoose.Schema(
  {
    remittance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Remittance',
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

remittanceHistorySchema.index({ remittance: 1, actionType: 1 });

module.exports = mongoose.model('RemittanceHistory', remittanceHistorySchema);

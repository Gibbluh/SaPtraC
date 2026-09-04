const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'ScheduleAssigned',
        'DriverReplaced',
        'ScheduleCancelled',
        'ConflictDetected',
        // Maintenance notification types
        'MaintenanceAssigned',
        'MaintenanceCritical',
        'MaintenanceCompleted',
        'MaintenanceStatusChanged',
      ],
      required: true,
      index: true,
    },
    readStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readStatus: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

const Notification = require('../models/notification.model');
const User = require('../models/User');
const { getIO } = require('../socket/socket');

/**
 * Create and send a notification (with Socket.io emit)
 * @param {Object} options
 * @param {ObjectId} options.recipient - User ID
 * @param {String} options.title
 * @param {String} options.message
 * @param {String} options.type - One of: ScheduleAssigned, DriverReplaced, ScheduleCancelled, ConflictDetected
 * @returns {Promise<Notification>}
 */
async function createNotification({ recipient, title, message, type }) {
  const notification = await Notification.create({
    recipient,
    title,
    message,
    type,
  });
  // Emit real-time notification to recipient (namespace: 'notification', event: 'newNotification')
  try {
    const io = getIO();
    io.to(String(recipient)).emit('newNotification', notification);
  } catch (err) {
    // Socket not initialized or error, skip emit
  }
  return notification;
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId) {
  return Notification.findByIdAndUpdate(notificationId, { readStatus: true }, { new: true });
}

/**
 * Get notifications for a user
 */
async function getUserNotifications(userId, { unreadOnly = false } = {}) {
  const filter = { recipient: userId };
  if (unreadOnly) filter.readStatus = false;
  return Notification.find(filter).sort({ createdAt: -1 });
}

/**
 * Notify assigned mechanic
 */
async function notifyMechanicAssignment({ mechanicId, maintenance }) {
  return createNotification({
    recipient: mechanicId,
    title: 'New Maintenance Assignment',
    message: `You have been assigned to maintenance issue: ${maintenance.issueTitle}`,
    type: 'MaintenanceAssigned',
  });
}

/**
 * Notify all admins on critical maintenance issue
 */
async function notifyAdminsOnCritical({ maintenance }) {
  const admins = await User.find({ role: { $in: ['Super Admin', 'Administrator'] }, isActive: true });
  const notifications = admins.map(admin =>
    createNotification({
      recipient: admin._id,
      title: 'Critical Maintenance Issue',
      message: `Critical issue reported: ${maintenance.issueTitle}`,
      type: 'MaintenanceCritical',
    })
  );
  return Promise.all(notifications);
}

/**
 * Notify relevant users when maintenance is completed
 */
async function notifyMaintenanceCompleted({ maintenance }) {
  const recipients = [maintenance.reportedBy];
  if (maintenance.assignedMechanic) recipients.push(maintenance.assignedMechanic);
  const notifications = recipients.map(userId =>
    createNotification({
      recipient: userId,
      title: 'Maintenance Completed',
      message: `Maintenance issue completed: ${maintenance.issueTitle}`,
      type: 'MaintenanceCompleted',
    })
  );
  return Promise.all(notifications);
}

/**
 * Notify on maintenance status change
 */
async function notifyStatusChange({ maintenance, newStatus }) {
  const recipients = [maintenance.reportedBy];
  if (maintenance.assignedMechanic) recipients.push(maintenance.assignedMechanic);
  const notifications = recipients.map(userId =>
    createNotification({
      recipient: userId,
      title: 'Maintenance Status Updated',
      message: `Status changed to ${newStatus} for: ${maintenance.issueTitle}`,
      type: 'MaintenanceStatusChanged',
    })
  );
  return Promise.all(notifications);
}

module.exports = {
  createNotification,
  markAsRead,
  getUserNotifications,
  notifyMechanicAssignment,
  notifyAdminsOnCritical,
  notifyMaintenanceCompleted,
  notifyStatusChange,
};

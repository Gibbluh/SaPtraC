const RepairHistory = require('../models/repairHistory.model');

/**
 * Log repair history for maintenance actions (scalable audit-trail)
 * @param {Object} options
 * @param {ObjectId} options.maintenance - Maintenance record ID
 * @param {String} options.actionType - One of: IssueCreated, MechanicAssigned, StatusUpdated, RepairCompleted, PartsReplaced, MaintenanceNoteAdded
 * @param {ObjectId} options.performedBy - User ID
 * @param {Object} [options.previousData] - Previous state (optional)
 * @param {Object} [options.newData] - New state (optional)
 * @param {String} [options.notes] - Notes (optional)
 * @returns {Promise<RepairHistory>}
 */
async function logRepairHistory({ maintenance, actionType, performedBy, previousData = null, newData = null, notes = '' }) {
  return RepairHistory.create({
    maintenance,
    actionType,
    performedBy,
    previousData,
    newData,
    notes,
  });
}

module.exports = { logRepairHistory };

const Maintenance = require('../models/maintenance.model');
const Unit = require('../models/unit.model');
const Driver = require("../models/driver.model");
const mongoose = require('mongoose');
const { logRepairHistory } = require('./repairHistory.service');
const { notifyMechanicAssignment, notifyAdminsOnCritical, notifyMaintenanceCompleted, notifyStatusChange, } = require('./notification.service');
const maintenanceDecisionService = require("./maintenanceDecision.service");

const DEFAULT_RECURRENCE_THRESHOLD = 3; // Can be overridden via options or env

/**
 * Detects recurring issues for a unit and issue category.
 * @param {ObjectId} unitId - The unit ObjectId
 * @param {String} issueCategory - The issue category string
 * @param {Number} threshold - The minimum number of recurrences to flag
 * @returns {Promise<{detected: boolean, count: number}>}
 */
async function detectRecurringIssue(unitId, issueCategory, threshold = DEFAULT_RECURRENCE_THRESHOLD) {
  const filter = {
    unit: unitId,
    deletedAt: null,
  };
  if (issueCategory) filter.issueCategory = issueCategory;
  const count = await Maintenance.countDocuments(filter);
  return {
    detected: count + 1 >= threshold, // +1 for the new issue being created
    count: count + 1,
  };
}

/**
 * Analytics: Get recurring issue stats grouped by unit and/or category
 * @param {Object} options - { groupBy: 'unit' | 'category' | 'unit-category', minCount: number }
 * @returns {Promise<Array>}
 */
async function getRecurringIssueAnalytics({ groupBy = 'unit-category', minCount = DEFAULT_RECURRENCE_THRESHOLD } = {}) {
  const groupStage = (() => {
    if (groupBy === 'unit') return { _id: '$unit', count: { $sum: 1 } };
    if (groupBy === 'category') return { _id: '$issueCategory', count: { $sum: 1 } };
    return { _id: { unit: '$unit', issueCategory: '$issueCategory' }, count: { $sum: 1 } };
  })();
  return Maintenance.aggregate([
    { $match: { deletedAt: null } },
    { $group: groupStage },
    { $match: { count: { $gte: minCount } } },
    { $sort: { count: -1 } },
  ]);
}

// Create Maintenance Record
async function createMaintenanceService(data, { recurrenceThreshold = DEFAULT_RECURRENCE_THRESHOLD } = {}) {
  console.log("SERVICE UNIT");
  console.log(data.unit);
  
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Detect recurring issue BEFORE creation
    const { detected, count } = await detectRecurringIssue(
      data.unit,
      data.issueCategory,
      recurrenceThreshold
    );
    // Attach recurring issue fields
    data.recurringIssueDetected = detected;
    data.recurringIssueCount = count;

    if (!data.reportedDate) {
    data.reportedDate = new Date();
 }
 
   data.partsCost = Number(data.partsCost || 0);

   data.laborCost = Number(data.laborCost || 0);

  data.miscellaneousCost = Number(data.miscellaneousCost || 0);

  data.totalCost =
    data.partsCost +
    data.laborCost +
    data.miscellaneousCost;

    const maintenance = await Maintenance.create([data], { session });
  
    console.log(maintenance[0]);
    console.log("PARTS COST SAVED");
    console.log(maintenance[0].partsCost);
    console.log("TOTAL COST SAVED");
    console.log(maintenance[0].totalCost);
    // Set unit availability to 'Under Maintenance' when maintenance is created
  await Unit.findOneAndUpdate(
  { _id: data.unit, deletedAt: null },
  { $set: { availabilityStatus: 'Under Maintenance' } },
  { session }
);
    const summary = await Maintenance.aggregate([
    {
        $match: {
            unit: maintenance[0].unit,
            deletedAt: null,
        },
    },
    {
        $group: {
            _id: "$unit",
            total: {
                $sum: "$totalCost",
            },
        },
    },
]);

await Unit.findByIdAndUpdate(
    maintenance[0].unit,
    {
        totalLifetimeMaintenanceCost:
            summary[0]?.total || 0,
    },
    { session }
);

/*const health = await getUnitHealthService(
    maintenance[0].unit
);

await Unit.findByIdAndUpdate(
    maintenance[0].unit,
    {
        healthPercentage: health.score,
        healthStatus: health.health,
    },
    { session }
); */

    // Log repair history: IssueCreated
    await logRepairHistory({
    maintenance: maintenance[0]._id,
    actionType: "IssueCreated",
    performedBy: data.reportedBy,
    newData: maintenance[0],
    notes: "Maintenance record created."
});
    // Notify admins if critical issue
    if (data.priorityLevel === 'Critical') {
      await notifyAdminsOnCritical({ maintenance: maintenance[0] });
    }
    await session.commitTransaction();

try {
  await refreshUnitMaintenanceMetrics(maintenance[0].unit);
} catch (refreshErr) {
  console.error("REFRESH UNIT METRICS ERROR:", refreshErr);
}

return maintenance[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// Get Maintenance Records (pagination, search, filter, status, priority, mechanic)
async function getMaintenanceService({
  page = 1,
  limit = 10,
  search = '',
  maintenanceStatus,
  priorityLevel,
  assignedMechanic,
  unit,
  maintenanceType,
  sort = 'desc',
}) {
  page = parseInt(page);
  limit = parseInt(limit);
  const query = { deletedAt: null };
  if (maintenanceStatus) query.maintenanceStatus = maintenanceStatus;
  if (priorityLevel) query.priorityLevel = priorityLevel;
  if (assignedMechanic) query.assignedMechanic = assignedMechanic;
  if (unit) query.unit = unit;
  if (maintenanceType) query.maintenanceType = maintenanceType;
  if (search) {
    query.$or = [
      { issueTitle: { $regex: search, $options: 'i' } },
      { issueDescription: { $regex: search, $options: 'i' } },
      { issueCategory: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Maintenance.countDocuments(query);
  const maintenances = await Maintenance.find(query)
    .populate('unit reportedBy assignedMechanic')
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return {
    maintenances,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Get Single Maintenance Record
async function getSingleMaintenanceService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid maintenance ID.' };
  }
  const maintenance = await Maintenance.findOne({ _id: id, deletedAt: null })
    .populate('unit reportedBy assignedMechanic');
  if (!maintenance) {
    throw { status: 404, message: 'Maintenance record not found.' };
  }
  return maintenance;
}

// Update Maintenance Record
async function updateMaintenanceService(id, data, performedBy) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid maintenance ID." };
  }

  data.partsCost =
  Number(data.partsCost || 0);

  data.totalCost =
  data.partsCost;

  const prev = await Maintenance.findOne({
    _id: id,
    deletedAt: null,
  });

  const maintenance = await Maintenance.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: data },
    { new: true }
  );

    if (!maintenance) {
    throw {
        status:404,
        message:"Maintenance record not found."
    };
}
  const summary = await Maintenance.aggregate([
  {
    $match: {
      unit: maintenance.unit,
      deletedAt: null,
    },
  },
  {
    $group: {
      _id: "$unit",
      total: {
        $sum: "$totalCost",
      },
    },
  },
]);

await Unit.findByIdAndUpdate(
  maintenance.unit,
  {
    totalLifetimeMaintenanceCost:
      summary[0]?.total || 0,
  }
);

const health = await getUnitHealthService(
    maintenance.unit
);

await Unit.findByIdAndUpdate(
    maintenance.unit,
    {
        healthPercentage: health.score,
        healthStatus: health.health,
    }
);

  // Status Updated
  if (
    data.maintenanceStatus &&
    data.maintenanceStatus !== prev.maintenanceStatus
  ) {
    await logRepairHistory({
      maintenance: id,
      actionType: "StatusUpdated",
      performedBy,
      previousData: {
        maintenanceStatus: prev.maintenanceStatus,
      },
      newData: {
        maintenanceStatus: data.maintenanceStatus,
      },
      notes: data.statusNotes || "",
    });
  }

  // Parts replaced
  if (data.partsReplaced) {
    await logRepairHistory({
      maintenance: id,
      actionType: "PartsReplaced",
      performedBy,
      previousData: {
        partsReplaced: prev.partsReplaced,
      },
      newData: {
        partsReplaced: data.partsReplaced,
      },
      notes: data.partsNotes || "",
    });
  }

  // Maintenance notes
  if (data.maintenanceNotes) {
    await logRepairHistory({
      maintenance: id,
      actionType: "MaintenanceNoteAdded",
      performedBy,
      newData: {
        maintenanceNotes: data.maintenanceNotes,
      },
      notes: data.maintenanceNotes,
    });
  }

  try {
  await refreshUnitMaintenanceMetrics(maintenance.unit);
} catch (refreshErr) {
  console.error("REFRESH UNIT METRICS ERROR:", refreshErr);
}

  return maintenance;
}

// Soft Delete Maintenance Record
async function deleteMaintenanceService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid maintenance ID.' };
  }
  const maintenance = await Maintenance.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );

  try {
  await refreshUnitMaintenanceMetrics(maintenance.unit);
} catch (refreshErr) {
  console.error("REFRESH UNIT METRICS ERROR:", refreshErr);
}

  if (!maintenance) {
    throw { status: 404, message: 'Maintenance record not found.' };
  }
  return { message: 'Maintenance record deleted successfully.' };
}

// Update Maintenance Status (and update unit availability if needed)
async function updateMaintenanceStatusService(id, maintenanceStatus, performedBy) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid maintenance ID.' };
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const prev = await Maintenance.findOne({ _id: id, deletedAt: null });
    const maintenance = await Maintenance.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { maintenanceStatus } },
      { new: true, session }
    );
    if (!maintenance) {
      throw { status: 404, message: 'Maintenance record not found.' };
    }
    // If status is 'In Progress', set unit availability to 'Under Maintenance'
    if (maintenanceStatus === 'In Progress') {
      await Unit.findOneAndUpdate(
        { _id: maintenance.unit, deletedAt: null },
        { $set: { availabilityStatus: 'Under Maintenance' } },
        { session }
      );
    }
    // If status is 'Completed', set unit availability to 'Available'
    if (maintenanceStatus === 'Completed') {
      await Unit.findOneAndUpdate(
        { _id: maintenance.unit, deletedAt: null },
        { $set: { availabilityStatus: 'Available' } },
        { session }
      );
    }
    
    // Log repair history: StatusUpdated, RepairCompleted
  if (
  maintenanceStatus === "In Progress" &&
  prev.maintenanceStatus !== "In Progress"
) {
  await logRepairHistory({
    maintenance: id,
    actionType: "RepairStarted",
    performedBy,
    previousData: prev,
    newData: maintenance,
    notes: "Repair started.",
  });
}
    // Notify on status change
    await notifyStatusChange({ maintenance, newStatus: maintenanceStatus });
    if (maintenanceStatus === 'Completed') {
      await logRepairHistory({
        maintenance: id,
        actionType: 'RepairCompleted',
        performedBy,
        previousData: prev,
        newData: maintenance,
        notes: 'Repair marked as completed.',
      });
      // Notify on completion
      await notifyMaintenanceCompleted({ maintenance });
    }
    await session.commitTransaction();

try {
  await refreshUnitMaintenanceMetrics(maintenance.unit);
} catch (refreshErr) {
  console.error("REFRESH UNIT METRICS ERROR:", refreshErr);
}

return maintenance;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// Assign Mechanic to Maintenance
async function assignMechanicService(id, mechanicId, performedBy) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid maintenance ID.' };
  }
  if (!mongoose.Types.ObjectId.isValid(mechanicId)) {
    throw { status: 400, message: 'Invalid mechanic ID.' };
  }
  const prev = await Maintenance.findOne({ _id: id, deletedAt: null });
  const maintenance = await Maintenance.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { assignedMechanic: mechanicId } },
    { new: true }
  );
  if (!maintenance) {
    throw { status: 404, message: 'Maintenance record not found.' };
  }
  // Log repair history: MechanicAssigned
  await logRepairHistory({
    maintenance: id,
    actionType: 'MechanicAssigned',
    performedBy,
    previousData: { assignedMechanic: prev.assignedMechanic },
    newData: { assignedMechanic: mechanicId },
    notes: '',
  });
  // Notify mechanic on assignment
  await notifyMechanicAssignment({ mechanicId, maintenance });
  return maintenance;
}

async function driverReportIssueService(driverId, secret, data) {

  console.log("========== DRIVER REPORT ==========");

  console.log("Driver ID:", driverId);

  console.log("Secret:", secret);

  console.log("Body:", data);

  console.log("==================================");

  const driver = await Driver.findById(driverId);

  if (!driver) {
    throw {
      status: 404,
      message: "Driver not found.",
    };
  }

  const maintenance =
    await createMaintenanceService({
  unit: data.unit,
  reportedBy: driver._id,

  issueTitle: data.issueTitle,
  issueDescription: data.issueDescription,
  issueCategory: data.issueCategory,

  priorityLevel: data.priorityLevel,

  maintenanceType: "Corrective",
  maintenanceStatus: "Pending",

  assignedMechanic: null,

  reportSource: "Driver",
  verificationStatus: "Pending",

  reportedDate: new Date(),
});

  return maintenance;

}

// =====================================
// MAINTENANCE HISTORY PER UNIT
// =====================================
async function getMaintenanceByUnitService(unitId) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw {
      status: 400,
      message: "Invalid unit ID.",
    };
  }

  return await Maintenance.find({
    unit: unitId,
    deletedAt: null,
  })
    .populate("assignedMechanic", "fullName")
    .sort({
      reportedDate: -1,
    });
}

// =====================================
// UNIT MAINTENANCE SUMMARY
// =====================================
async function getUnitMaintenanceSummaryService(unitId) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw {
      status: 400,
      message: "Invalid unit ID.",
    };
  }

  const result = await Maintenance.aggregate([
    {
      $match: {
        unit: new mongoose.Types.ObjectId(unitId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$unit",

        lifetimeMaintenanceCost: {
          $sum: "$totalCost",
        },

        totalRepairs: {
          $sum: 1,
        },

        preventiveMaintenance: {
          $sum: {
            $cond: [
              { $eq: ["$maintenanceType", "Preventive"] },
              1,
              0,
            ],
          },
        },

        correctiveMaintenance: {
          $sum: {
            $cond: [
              { $eq: ["$maintenanceType", "Corrective"] },
              1,
              0,
            ],
          },
        },

        emergencyMaintenance: {
          $sum: {
            $cond: [
              { $eq: ["$maintenanceType", "Emergency"] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    result[0] || {
      lifetimeMaintenanceCost: 0,
      totalRepairs: 0,
      preventiveMaintenance: 0,
      correctiveMaintenance: 0,
      emergencyMaintenance: 0,
    }
  );
}

// =====================================
// UNIT HEALTH SCORE (PURE COMPUTATION ONLY)
// =====================================
async function getUnitHealthService(unitId) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw {
      status: 400,
      message: "Invalid unit ID.",
    };
  }

  const maintenances = await Maintenance.find({
    unit: new mongoose.Types.ObjectId(unitId),
    deletedAt: null,
  });

  let score = 100;

  const total = maintenances.length;
  const pending = maintenances.filter(
    (m) => m.maintenanceStatus === "Pending"
  ).length;

  const inProgress = maintenances.filter(
    (m) => m.maintenanceStatus === "In Progress"
  ).length;

  const recurring = maintenances.filter(
    (m) => m.recurringIssueDetected
  ).length;

  score -= pending * 5;
  score -= inProgress * 3;
  score -= recurring * 10;

  if (score < 0) score = 0;

  let health = "Excellent";
  if (score <= 80) health = "Good";
  if (score <= 60) health = "Needs Maintenance";
  if (score <= 40) health = "Critical";

  return {
    score,
    health,
    totalMaintenance: total,
    pending,
    inProgress,
    recurring,
  };
}

async function refreshUnitMaintenanceMetrics(unitId) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) return null;

  const summary = await Maintenance.aggregate([
    {
      $match: {
        unit: new mongoose.Types.ObjectId(unitId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$unit",
        total: {
          $sum: "$totalCost",
        },
      },
    },
  ]);

  const health = await getUnitHealthService(unitId);

  await Unit.findByIdAndUpdate(unitId, {
    totalLifetimeMaintenanceCost: summary[0]?.total || 0,
    healthPercentage: health.score,
    healthStatus: health.health,
  });

  return {
    lifetimeMaintenanceCost: summary[0]?.total || 0,
    health,
  };
}

module.exports = {
  createMaintenanceService,
  getMaintenanceService,
  getSingleMaintenanceService,
  updateMaintenanceService,
  deleteMaintenanceService,
  updateMaintenanceStatusService,
  assignMechanicService,
  driverReportIssueService,
  // Recurring issue detection and analytics exports
  detectRecurringIssue,
  getRecurringIssueAnalytics,
  getMaintenanceByUnitService,
  getUnitMaintenanceSummaryService,
  getUnitHealthService,
  maintenanceDecisionService,
};

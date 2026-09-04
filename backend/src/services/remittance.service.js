const Remittance = require('../models/remittance.model');
const Schedule = require('../models/schedule.model');
const FuelTransaction = require('../models/fuelTransaction.model');
const Driver = require('../models/driver.model');
const RemittanceHistory = require('../models/remittanceHistory.model');
const Unit = require('../models/unit.model');
const receiptGenerator = require('../utils/receiptGenerator');
const mongoose = require('mongoose');
const remittanceAnalytics = require('./remittanceAnalytics.service');

/**
 * Helper: Compute remittance breakdown
 * Returns: { totalExpense, totalFuelDeduction, totalSalaryDeduction, cooperativeIncome, driverNetIncome, remainingBalance, hasNegativeBalance }
 */
async function computeRemittance({ scheduleId, driverId, baseSalary = 0, totalEarnings = 0 }) {
  if (!scheduleId || !driverId) {
    return {
      totalExpense: 0,
      totalFuelDeduction: 0,
      totalSalaryDeduction: 0,
      cooperativeIncome: totalEarnings * 0.05,
      driverNetIncome: totalEarnings,
      remainingBalance: totalEarnings,
      hasNegativeBalance: false,
    };
  }
  // Validate schedule
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw { status: 404, message: 'Schedule not found.' };
  // Validate driver
  const driver = await Driver.findById(driverId);
  if (!driver) throw { status: 404, message: 'Driver not found.' };

  // Get all fuel transactions for this schedule and driver (not soft deleted)
  const fuelTxns = await FuelTransaction.find({
    schedule: scheduleId,
    driver: driverId,
    deletedAt: null,
  });

  // Validate linked fuel transactions
  if (!fuelTxns || fuelTxns.length === 0) throw { status: 400, message: 'No fuel transactions found for this schedule/driver.' };

  // Compute total fuel deduction
  const totalFuelDeduction = fuelTxns.reduce((sum, tx) => sum + (tx.fuelCost || 0), 0);

  // Compute total expense (can include other expenses in future)
  const totalExpense = totalFuelDeduction; // Add more expense types if needed

  // Compute salary deduction (example: 10% of base salary if any deduction logic)
  const totalSalaryDeduction = baseSalary * 0.1; // Example: 10% deduction

  // Cooperative income (example: 5% of total earnings)
  const cooperativeIncome = totalEarnings;

  // Driver net income
  const driverNetIncome = totalEarnings - totalExpense - totalSalaryDeduction;

  // Remaining balance (if any advance/previous balance logic)
  const remainingBalance = driverNetIncome;

  // Negative balance detection
  const hasNegativeBalance = remainingBalance < 0;

  // Prevent negative computations
  if (totalFuelDeduction < 0 || totalExpense < 0 || totalSalaryDeduction < 0 || cooperativeIncome < 0) {
    throw { status: 400, message: 'Invalid negative computation in remittance.' };
  }

  return {
    totalExpense,
    totalFuelDeduction,
    totalSalaryDeduction,
    cooperativeIncome,
    driverNetIncome,
    remainingBalance,
    hasNegativeBalance,
  };
}

/**
 * Helper: Log remittance history (scalable, audit-trail)
 */
async function logRemittanceHistory({ remittance, actionType, performedBy, previousData, newData }) {
  await RemittanceHistory.create({
    remittance: remittance._id,
    actionType,
    performedBy,
    previousData,
    newData,
  });
}

/**
 * Create Remittance
 */
async function createRemittanceService(data, performedBy) {
  // Accept frontend minimal payload: { driver, unit, amount, transactionDate, scheduleId?, baseSalary?, totalEarnings? }
  const {
  scheduleId,
  fuelTransaction,
  driverId,
  driver: driverField,
  unit: unitField,
  route,
  amount,
  transactionDate,
  baseSalary = 0,
  totalEarnings = 0,
  totalDieselConsumption,
  pilaTrips,
  salubongTrips,
} = data || {};

  // concrete values (cooperativeIncome, driverNetIncome, remainingBalance, etc.) are computed
  // later in the schedule and non-schedule flows to keep a single source of truth.

  const driverToUse = driverField || driverId;

  // If scheduleId is provided, keep strict flow and prevent duplicates by schedule+driver
  if (scheduleId && driverToUse) {
    const exists = await Remittance.findOne({ schedule: scheduleId, driver: driverToUse, deletedAt: null });
    if (exists) throw { status: 409, message: 'Remittance already exists for this schedule/driver.' };

    const breakdown = await computeRemittance({ scheduleId, driverId: driverToUse, baseSalary, totalEarnings });

    // Fetch schedule, driver, unit for receipt
    const schedule = await Schedule.findById(scheduleId);
    const driver = await Driver.findById(driverToUse);
    const unit = schedule && schedule.unit ? await Unit.findById(schedule.unit) : null;

    // Generate unique receipt number
    const tempRemittance = new Remittance({});
    const receiptNumber = receiptGenerator.generateReceiptNumber(tempRemittance._id || String(Date.now()));

    const remittance = new Remittance({
      schedule: scheduleId,
      driver: driverToUse,
      unit: unitField || (schedule && schedule.unit) || null,
      route,

      baseSalary,
      totalEarnings,

      totalBoundary: Number(totalEarnings || 0),
      salaryDeduction: 0,

      ...breakdown,
    });
    await remittance.save();

    const receiptData = receiptGenerator.formatReceipt({ driver, unit, remittance, schedule });
    remittance.printableReceipt = receiptGenerator.generatePrintableReceipt(receiptData);
    await remittance.save();

    await logRemittanceHistory({ remittance, actionType: 'Created', performedBy, previousData: null, newData: remittance.toObject() });
    return remittance;
  }

  // No schedule: accept frontend minimal payload and create a simple remittance record
  if (!driverToUse) throw { status: 400, message: 'Driver is required.' };
  if (!unitField) throw { status: 400, message: 'Unit is required.' };

let fuelDeduction = 0;

if (fuelTransaction) {
  const fuel = await FuelTransaction.findById(fuelTransaction);

  if (fuel) {
    fuelDeduction = fuel.fuelCost || 0;
  }
}

const remittance = new Remittance({
    driver: driverToUse,
    unit: unitField,
    fuelTransaction,

    route,

    totalBoundary: Number(amount || 0),

    fuelDeduction: 0,
    salaryDeduction: 0,
    otherExpenses: 0,
    totalExpenses: 0,

    cooperativeIncome: Number(amount || 0),

    driverNetIncome: Number(amount || 0),

    remainingBalance: Number(amount || 0),

    negativeBalance: 0,

    remittanceDate: transactionDate,

    totalDieselConsumption: Number(totalDieselConsumption || 0),

    pilaTrips: Number(pilaTrips || 0),

    salubongTrips: Number(salubongTrips || 0),

    verificationStatus: "Pending",
});

await remittance.save();



  // Optionally generate printable receipt; try to populate driver/unit for formatting
  const driverDoc = await Driver.findById(driverToUse);
  const unitDoc = await Unit.findById(unitField);
  const receiptData = receiptGenerator.formatReceipt({ driver: driverDoc, unit: unitDoc, remittance, schedule: null });
  remittance.printableReceipt = receiptGenerator.generatePrintableReceipt(receiptData);
  await remittance.save();

  await logRemittanceHistory({ remittance, actionType: 'Created', performedBy, previousData: null, newData: remittance.toObject() });
  return remittance;
}

/**
 * Get Remittances (pagination, filtering, sorting)
 */
async function getRemittancesService({ page = 1, limit = 10, filter = {}, sort = '-createdAt' }) {
  page = parseInt(page);
  limit = parseInt(limit);
  const query = { deletedAt: null, ...filter };
  const total = await Remittance.countDocuments(query);
  const remittances = await Remittance.find(query)
  .sort(sort)
  .skip((page - 1) * limit)
  .limit(limit)
  .populate("driver", "firstName lastName")
  .populate("unit", "bodyNumber plateNumber")
  .populate({
    path: "fuelTransaction",
    select: `
      transactionDate
      fuelLiters
      fuelCost
      odometerIn
      odometerOut
      fuelStation
      shiftType
      anomalyDetected
      receiptNumber
      totalBoundary
      totalRemit
      pilaTrips
      salubongTrips
      route
      qrImage
      qrCodeData
    `,
  });
console.log(
  JSON.stringify(remittances[0], null, 2)
);
  // Map backend model to frontend expected shape
  const mapped = remittances.map((r) => {
    const obj = r.toObject();
    const fuel = obj.fuelTransaction || {};

obj.route = fuel.route || obj.route;

obj.totalRemit = fuel.totalRemit ?? 0;

obj.totalBoundary = fuel.totalBoundary ?? obj.totalBoundary;

obj.fuelLiters = fuel.fuelLiters ?? 0;

obj.fuelCost = fuel.fuelCost ?? 0;

obj.odometerIn = fuel.odometerIn ?? "-";

obj.odometerOut = fuel.odometerOut ?? "-";

obj.station = fuel.fuelStation ?? "-";

obj.shift = fuel.shiftType ?? "-";

obj.pilaTrips = fuel.pilaTrips ?? 0;

obj.salubongTrips = fuel.salubongTrips ?? 0;

obj.amount = obj.totalBoundary;
obj.transactionDate = obj.remittanceDate;
obj.verified = obj.verificationStatus === "Verified";
obj.hasNegativeBalance = obj.remainingBalance < 0;
    return obj;
  });

  return {
    data: mapped,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get Single Remittance
 */
async function getSingleRemittanceService(remittanceId) {
  if (!mongoose.Types.ObjectId.isValid(remittanceId)) throw { status: 400, message: 'Invalid remittance ID.' };
  const remittance = await Remittance.findById(remittanceId).populate('schedule driver unit');
  if (!remittance || remittance.deletedAt) throw { status: 404, message: 'Remittance not found.' };
  const obj = remittance.toObject();
  obj.amount = obj.totalBoundary;
  obj.transactionDate = obj.remittanceDate;
  obj.verified = obj.verificationStatus === 'Verified';
  obj.hasNegativeBalance = obj.remainingBalance < 0;
  return obj;
}

/**
 * Update Remittance (recompute breakdown)
 */
async function updateRemittanceService(remittanceId, data, performedBy) {
  if (!mongoose.Types.ObjectId.isValid(remittanceId)) throw { status: 400, message: 'Invalid remittance ID.' };
  const remittance = await Remittance.findById(remittanceId);
  if (!remittance || remittance.deletedAt) throw { status: 404, message: 'Remittance not found.' };
  if (remittance.verificationStatus === 'Verified' || remittance.verificationStatus === 'Rejected') {
    throw { status: 403, message: 'Cannot edit a verified or rejected remittance.' };
  }
  const previousData = remittance.toObject();

  // If schedule exists on record or scheduleId provided, recompute using computeRemittance
  const { baseSalary = remittance.baseSalary, totalEarnings = remittance.totalEarnings, amount, transactionDate, route } = data || {};

  // Extract additive fields so they get saved and trigger pre-validate recompute
  const {
    totalDieselConsumption,
    pilaTrips,
    salubongTrips,
  } = data || {};

  if (remittance.schedule || data.scheduleId) {
    const scheduleId = data.scheduleId || remittance.schedule;
    const driverId = remittance.driver;
    const breakdown = await computeRemittance({ scheduleId, driverId, baseSalary, totalEarnings });
    Object.assign(remittance, { baseSalary, totalEarnings, ...breakdown });
  } else {
    // No schedule: accept frontend minimal updates
    if (typeof amount !== 'undefined') {
      remittance.driverNetIncome = Number(amount) || 0;
      // Recompute cooperativeIncome and balances based on totalEarnings or amount
      const totEarn = Number(totalEarnings) || remittance.totalEarnings || remittance.driverNetIncome || 0;
      remittance.cooperativeIncome = remittance.driverNetIncome; const remaining = remittance.driverNetIncome;
      remittance.remainingBalance = remaining < 0 ? 0 : remaining;
      remittance.negativeBalance = remaining < 0 ? Math.abs(remaining) : 0;
      remittance.totalEarnings = totEarn;
    }
  }

  // Apply additive fields before save so pre('validate') computes/validates totalRemit
  if (typeof totalDieselConsumption !== 'undefined') remittance.totalDieselConsumption = totalDieselConsumption;
  if (typeof pilaTrips !== 'undefined') remittance.pilaTrips = pilaTrips;
  if (typeof salubongTrips !== 'undefined') remittance.salubongTrips = salubongTrips;

  if (transactionDate) {
    remittance.remittanceDate = new Date(transactionDate);
  }

    if (route) {
    remittance.route = route;
}

  await remittance.save();
  await logRemittanceHistory({ remittance, actionType: 'Updated', performedBy, previousData, newData: remittance.toObject() });
  return remittance;
}

/**
 * Soft Delete Remittance
 */
async function deleteRemittanceService(remittanceId, performedBy) {
  if (!mongoose.Types.ObjectId.isValid(remittanceId)) throw { status: 400, message: 'Invalid remittance ID.' };
  const remittance = await Remittance.findById(remittanceId);
  if (!remittance || remittance.deletedAt) throw { status: 404, message: 'Remittance not found.' };
  const previousData = remittance.toObject();
  remittance.deletedAt = new Date();
  await remittance.save();
  await logRemittanceHistory({ remittance, actionType: 'Deleted', performedBy, previousData, newData: remittance.toObject() });
  return { message: 'Remittance deleted successfully.' };
}

/**
 * Verify/Reject Remittance (admin verification)
 */
async function verifyRemittanceService(remittanceId, status = 'Verified', performedBy) {
  if (!mongoose.Types.ObjectId.isValid(remittanceId)) throw { status: 400, message: 'Invalid remittance ID.' };
  if (!['Verified', 'Rejected'].includes(status)) throw { status: 400, message: 'Invalid verification status.' };
  const remittance = await Remittance.findById(remittanceId);
  if (!remittance || remittance.deletedAt) throw { status: 404, message: 'Remittance not found.' };

  // Idempotent: if status is unchanged, do nothing
  if (remittance.verificationStatus === status) return remittance;

  const previousStatus = remittance.verificationStatus;

  // Allow status transitions but only increment driver totals when moving INTO 'Verified' from a non-Verified state
  remittance.verificationStatus = status;
  remittance.verifiedBy = performedBy;
  remittance.verificationTimestamp = new Date();
  await remittance.save();

  // If newly verified and it wasn't verified before, increment driver lifetime stats
  if (status === 'Verified' && previousStatus !== 'Verified') {
    try {
      if (remittance.driver) {
        const inc = {
          totalLifetimeRemit:
            Number(
          remittance.totalBoundary ||
          remittance.driverNetIncome ||
          remittance.totalRemit ||
          0
          ),
          totalLifetimeDieselConsumption: Number(remittance.totalDieselConsumption || 0),
          totalPilaTrips: Number(remittance.pilaTrips || 0),
          totalSalubongTrips: Number(remittance.salubongTrips || 0),
        };
        // Use atomic update to avoid race conditions
        await Driver.updateOne({ _id: remittance.driver }, { $inc: inc });
      }
    } catch (e) {
      // Log or rethrow depending on desired behavior; here we rethrow to surface the error
      throw e;
    }
  }

  await logRemittanceHistory({ remittance, actionType: status === 'Verified' ? 'Verified' : 'Rejected', performedBy, previousData: { verificationStatus: previousStatus }, newData: remittance.toObject() });
  return remittance;
}

/**
 * Remittance Report Service
 * Delegates to analytics for scalable reporting
 */
async function getRemittanceReportService({
  startDate,
  endDate,
  driverId,
  unitId,
  verificationStatus,
  exportFormat = 'json',
  sort,
}) {
  return remittanceAnalytics.generateRemittanceReport({
    startDate,
    endDate,
    driverId,
    unitId,
    verificationStatus,
    exportFormat,
    sort,
  });
}

module.exports = {
  computeRemittance,
  createRemittanceService,
  getRemittancesService,
  getSingleRemittanceService,
  updateRemittanceService,
  deleteRemittanceService,
  verifyRemittanceService,
  getRemittanceReportService, // <-- export new report service
};

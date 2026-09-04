const Remittance = require('../models/remittance.model');
const Driver = require('../models/driver.model');
const Unit = require('../models/unit.model');
const mongoose = require('mongoose');

/**
 * Remittance Analytics Service
 * Uses MongoDB aggregation pipelines for scalable analytics.
 */

// Helper: Get date range for today, week, month
function getDateRange(type) {
  const now = new Date();
  let start, end;
  switch (type) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'week': {
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day));
      break;
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    default:
      start = null;
      end = null;
  }
  return { start, end };
}

// Daily remittance totals (last 30 days)
async function getDailyRemittanceTotals() {
  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  return Remittance.aggregate([
    { $match: { deletedAt: null, remittanceDate: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$remittanceDate' } },
        totalAmount: { $sum: '$cooperativeIncome' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        totalAmount: 1,
        count: 1,
        _id: 0,
      },
    },
  ]);
}

// Weekly remittance totals (last 12 weeks)
async function getWeeklyRemittanceTotals() {
  const from = new Date();
  from.setDate(from.getDate() - 7 * 11);
  from.setHours(0, 0, 0, 0);
  return Remittance.aggregate([
    { $match: { deletedAt: null, remittanceDate: { $gte: from } } },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$remittanceDate' },
          week: { $isoWeek: '$remittanceDate' },
        },
        totalAmount: { $sum: '$cooperativeIncome' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
    {
      $project: {
        year: '$_id.year',
        week: '$_id.week',
        totalAmount: 1,
        count: 1,
        _id: 0,
      },
    },
  ]);
}

// Monthly remittance totals (last 12 months)
async function getMonthlyRemittanceTotals() {
  const from = new Date();
  from.setMonth(from.getMonth() - 11);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);
  return Remittance.aggregate([
    { $match: { deletedAt: null, remittanceDate: { $gte: from } } },
    {
      $group: {
        _id: {
          year: { $year: '$remittanceDate' },
          month: { $month: '$remittanceDate' },
        },
        totalAmount: { $sum: '$cooperativeIncome' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        year: '$_id.year',
        month: '$_id.month',
        totalAmount: 1,
        count: 1,
        _id: 0,
      },
    },
  ]);
}

// Average daily remittance (last 30 days)
async function getAverageDailyRemittance() {
  const daily = await getDailyRemittanceTotals();
  if (!daily.length) return 0;
  const total = daily.reduce((sum, d) => sum + d.totalAmount, 0);
  return total / daily.length;
}

// Top earning drivers (by cooperativeIncome, last 30 days)
async function getTopEarningDrivers(limit = 5) {
  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  const pipeline = [
    { $match: { deletedAt: null, remittanceDate: { $gte: from } } },
    {
      $group: {
        _id: '$driver',
        totalIncome: { $sum: '$cooperativeIncome' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalIncome: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'drivers',
        localField: '_id',
        foreignField: '_id',
        as: 'driver',
      },
    },
    { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        driver: '$driver.name',
        totalIncome: 1,
        count: 1,
      },
    },
  ];
  return Remittance.aggregate(pipeline);
}

// Top earning units (by cooperativeIncome, last 30 days)
async function getTopEarningUnits(limit = 5) {
  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  const pipeline = [
    { $match: { deletedAt: null, remittanceDate: { $gte: from } } },
    {
      $group: {
        _id: '$unit',
        totalIncome: { $sum: '$cooperativeIncome' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalIncome: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'units',
        localField: '_id',
        foreignField: '_id',
        as: 'unit',
      },
    },
    { $unwind: { path: '$unit', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        unit: '$unit.name',
        totalIncome: 1,
        count: 1,
      },
    },
  ];
  return Remittance.aggregate(pipeline);
}

// Negative balance statistics (last 30 days)
async function getNegativeBalanceStats() {
  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  const pipeline = [
    { $match: { deletedAt: null, remittanceDate: { $gte: from }, negativeBalance: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalNegative: { $sum: '$negativeBalance' },
      },
    },
    {
      $project: {
        count: 1,
        totalNegative: 1,
        _id: 0,
      },
    },
  ];
  const [result] = await Remittance.aggregate(pipeline);
  return result || { count: 0, totalNegative: 0 };
}

// Cooperative income summaries (last 30 days)
async function getCooperativeIncomeSummary() {
  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  const pipeline = [
    { $match: { deletedAt: null, remittanceDate: { $gte: from } } },
    {
      $group: {
        _id: null,
        totalCoopIncome: { $sum: '$cooperativeIncome' },
        avgCoopIncome: { $avg: '$cooperativeIncome' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        totalCoopIncome: 1,
        avgCoopIncome: 1,
        count: 1,
        _id: 0,
      },
    },
  ];
  const [result] = await Remittance.aggregate(pipeline);
  return result || { totalCoopIncome: 0, avgCoopIncome: 0, count: 0 };
}

// Main analytics aggregator
async function getRemittanceAnalytics() {
  const [
    dailyTotals,
    weeklyTotals,
    monthlyTotals,
    avgDaily,
    topDrivers,
    topUnits,
    negativeStats,
    coopSummary,
  ] = await Promise.all([
    getDailyRemittanceTotals(),
    getWeeklyRemittanceTotals(),
    getMonthlyRemittanceTotals(),
    getAverageDailyRemittance(),
    getTopEarningDrivers(),
    getTopEarningUnits(),
    getNegativeBalanceStats(),
    getCooperativeIncomeSummary(),
  ]);
  return {
    dailyTotals,
    weeklyTotals,
    monthlyTotals,
    avgDaily,
    topDrivers,
    topUnits,
    negativeStats,
    coopSummary,
  };
}

/**
 * Generate Remittance Report
 * Supports: date range, driver, unit, verification status filtering
 * Returns: export-ready and printable report data
 */
async function generateRemittanceReport({
  startDate,
  endDate,
  driverId,
  unitId,
  verificationStatus,
  exportFormat = 'json', // 'json' | 'csv' | 'printable'
  sort = '-remittanceDate',
}) {
  const filter = { deletedAt: null };
  if (startDate || endDate) {
    filter.remittanceDate = {};
    if (startDate) filter.remittanceDate.$gte = new Date(startDate);
    if (endDate) filter.remittanceDate.$lte = new Date(endDate);
  }
  if (driverId) filter.driver = driverId;
  if (unitId) filter.unit = unitId;
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  // Populate driver, unit, schedule for reporting
  const remittances = await Remittance.find(filter)
    .sort(sort)
    .populate('driver unit schedule');

  // Export-ready format (array of plain objects)
  const reportData = remittances.map(r => ({
    remittanceId: r._id,
    date: r.remittanceDate,
    driver: r.driver ? r.driver.name : '',
    unit: r.unit ? r.unit.name : '',
    schedule: r.schedule ? r.schedule._id : '',
    baseSalary: r.baseSalary,
    totalEarnings: r.totalEarnings,
    totalExpense: r.totalExpense,
    totalFuelDeduction: r.totalFuelDeduction,
    totalSalaryDeduction: r.totalSalaryDeduction,
    cooperativeIncome: r.cooperativeIncome,
    driverNetIncome: r.driverNetIncome,
    remainingBalance: r.remainingBalance,
    verificationStatus: r.verificationStatus,
    receiptNumber: r.receiptNumber,
  }));

  if (exportFormat === 'csv') {
    // Simple CSV conversion (for export)
    const headers = Object.keys(reportData[0] || {}).join(',');
    const rows = reportData.map(obj => Object.values(obj).map(v => `"${v ?? ''}"`).join(','));
    return [headers, ...rows].join('\n');
  }

  if (exportFormat === 'printable') {
    // Return printable HTML table (for print preview)
    const headers = Object.keys(reportData[0] || {});
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const rows = reportData.map(obj => `<tr>${headers.map(h => `<td>${obj[h] ?? ''}</td>`).join('')}</tr>`);
    return `<table border='1'><thead><tr>${headerRow}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  }

  // Default: JSON array
  return reportData;
}

module.exports = {
  getDailyRemittanceTotals,
  getWeeklyRemittanceTotals,
  getMonthlyRemittanceTotals,
  getAverageDailyRemittance,
  getTopEarningDrivers,
  getTopEarningUnits,
  getNegativeBalanceStats,
  getCooperativeIncomeSummary,
  getRemittanceAnalytics,
  generateRemittanceReport, // <-- export new report function
};

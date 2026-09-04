const FuelTransaction = require('../models/fuelTransaction.model');
const Unit = require('../models/unit.model');
const Driver = require('../models/driver.model');
const mongoose = require('mongoose');

// Helper: Date range for day/week/month
function getDateRange(period) {
  const now = new Date();
  let start, end;
  switch (period) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    default:
      throw new Error('Invalid period');
  }
  return { start, end };
}

// Daily Fuel Usage (grouped by day for a date range)
async function getDailyFuelUsage({ startDate, endDate }) {
  return FuelTransaction.aggregate([
    {
      $match: {
        deletedAt: null,
        transactionDate: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactionDate' },
          month: { $month: '$transactionDate' },
          day: { $dayOfMonth: '$transactionDate' },
        },
        totalLiters: { $sum: '$fuelLiters' },
        totalCost: { $sum: '$fuelCost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);
}

// Weekly Fuel Usage (grouped by week for a date range)
async function getWeeklyFuelUsage({ startDate, endDate }) {
  return FuelTransaction.aggregate([
    {
      $match: {
        deletedAt: null,
        transactionDate: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactionDate' },
          week: { $isoWeek: '$transactionDate' },
        },
        totalLiters: { $sum: '$fuelLiters' },
        totalCost: { $sum: '$fuelCost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);
}

// Monthly Fuel Usage (grouped by month for a date range)
async function getMonthlyFuelUsage({ startDate, endDate }) {
  return FuelTransaction.aggregate([
    {
      $match: {
        deletedAt: null,
        transactionDate: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactionDate' },
          month: { $month: '$transactionDate' },
        },
        totalLiters: { $sum: '$fuelLiters' },
        totalCost: { $sum: '$fuelCost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
}

// Fuel Cost Summaries (total, average, min, max)
async function getFuelCostSummary({ startDate, endDate }) {
  const [summary] = await FuelTransaction.aggregate([
    {
      $match: {
        deletedAt: null,
        transactionDate: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalCost: { $sum: '$fuelCost' },
        avgCost: { $avg: '$fuelCost' },
        minCost: { $min: '$fuelCost' },
        maxCost: { $max: '$fuelCost' },
        totalLiters: { $sum: '$fuelLiters' },
        avgLiters: { $avg: '$fuelLiters' },
      },
    },
  ]);
  return summary || {};
}

// Top Fuel-Consuming Units
async function getTopFuelConsumingUnits({ startDate, endDate, limit = 5 }) {
  return FuelTransaction.aggregate([
    {
      $match: {
        deletedAt: null,
        transactionDate: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: '$unit',
        totalLiters: { $sum: '$fuelLiters' },
        totalCost: { $sum: '$fuelCost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalLiters: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'units',
        localField: '_id',
        foreignField: '_id',
        as: 'unit',
      },
    },
    { $unwind: '$unit' },
  ]);
}

// Top Fuel-Consuming Drivers
async function getTopFuelConsumingDrivers({ startDate, endDate, limit = 5 }) {
  return FuelTransaction.aggregate([
    {
      $match: {
        deletedAt: null,
        transactionDate: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: '$driver',
        totalLiters: { $sum: '$fuelLiters' },
        totalCost: { $sum: '$fuelCost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalLiters: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'drivers',
        localField: '_id',
        foreignField: '_id',
        as: 'driver',
      },
    },
    { $unwind: '$driver' },
  ]);
}

// Anomaly Statistics (count, percent, grouped by reason)
async function getFuelAnomalyStats({ startDate, endDate }) {
  return FuelTransaction.aggregate([
    {
      $match: {
        deletedAt: null,
        transactionDate: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
        anomalyDetected: true,
      },
    },
    {
      $group: {
        _id: '$anomalyReason',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        details: {
          $push: {
            reason: '$_id',
            count: '$count',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        details: 1,
      },
    },
  ]);
}

module.exports = {
  getDateRange,
  getDailyFuelUsage,
  getWeeklyFuelUsage,
  getMonthlyFuelUsage,
  getFuelCostSummary,
  getTopFuelConsumingUnits,
  getTopFuelConsumingDrivers,
  getFuelAnomalyStats,
};

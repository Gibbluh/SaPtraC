const analyticsService = require('../services/analytics.service');

// Only Super Admin and Administrator can access analytics
const adminRoles = ['Super Admin', 'Administrator'];

// Dashboard Summary
exports.getDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const filters = buildDateFilters({ startDate, endDate, month, year });
    const summary = await analyticsService.getDashboardSummary(filters);
    console.log(summary);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

// Revenue Analytics
exports.getRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const filters = buildDateFilters({ startDate, endDate, month, year });
    const data = await analyticsService.getRevenueAnalytics(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Fuel Analytics
exports.getFuel = async (req, res, next) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const filters = buildDateFilters({ startDate, endDate, month, year });
    const data = await analyticsService.getFuelAnalytics(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Maintenance Analytics
exports.getMaintenance = async (req, res, next) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const filters = buildDateFilters({ startDate, endDate, month, year });
    const data = await analyticsService.getMaintenanceAnalytics(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Driver Performance Analytics
exports.getDrivers = async (req, res, next) => {
  try {
    const { driverId, startDate, endDate, month, year } = req.query;
    const filters = buildDateFilters({ startDate, endDate, month, year });
    const data = await analyticsService.getDriverPerformanceAnalytics({ driverId, ...filters });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Remittance Analytics
exports.getRemittances = async (req, res, next) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const filters = buildDateFilters({ startDate, endDate, month, year });
    const data = await analyticsService.getRemittanceAnalytics(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Unit Availability Analytics
exports.getUnits = async (req, res, next) => {
  try {
    const data = await analyticsService.getUnitAvailabilityAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getFleetHealth = async (req,res,next)=>{
    try{
        const data =
            await analyticsService.getFleetHealthAnalytics();
        res.json(data);
    }catch(err){
        next(err);
    }
};

// Executive Dashboard Summary
exports.getExecutiveSummary = async (req, res, next) => {

  try {

    const data =
      await analyticsService.getExecutiveSummary();

    res.json(data);

  } catch (err) {

    next(err);

  }

};

// Helper: Build date filters from query
function buildDateFilters({ startDate, endDate, month, year }) {
  const filters = {};
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (month) filters.month = month;
  if (year) filters.year = year;
  return filters;
}

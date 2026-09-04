const scheduleService = require('../services/schedule.service');

// Create Schedule
exports.createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createScheduleService(
  {
    ...req.body,
    assignedBy: req.user.id
  },
  req.user.id
);
    res.status(201).json({ schedule });
  } catch (err) {
    next(err);
  }
};

// Get Schedules (list, pagination, filter, sort)
exports.getSchedules = async (req, res, next) => {
  try {
    const result = await scheduleService.getSchedulesService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get Single Schedule
exports.getSingleSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.getSingleScheduleService(req.params.id);
    res.json({ schedule });
  } catch (err) {
    next(err);
  }
};

// Update Schedule
exports.updateSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateScheduleService(req.params.id, req.body);
    res.json({ schedule });
  } catch (err) {
    next(err);
  }
};

// Delete Schedule (soft delete)
exports.deleteSchedule = async (req, res, next) => {
  try {
    await scheduleService.deleteScheduleService(req.params.id);
    res.json({ message: 'Schedule deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

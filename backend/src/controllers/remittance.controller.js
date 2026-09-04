const remittanceService = require('../services/remittance.service');

// Create Remittance
exports.createRemittance = async (req, res, next) => {
  try {
    const remittance = await remittanceService.createRemittanceService(
      req.body,
      req.user.id
    );

    res.status(201).json({
      remittance,
    });
  } catch (err) {
    next(err);
  }
};

// Get Remittances (list, pagination, filter, sort)
exports.getRemittances = async (req, res, next) => {
  try {
    const result = await remittanceService.getRemittancesService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get Single Remittance
exports.getSingleRemittance = async (req, res, next) => {
  try {
    const remittance = await remittanceService.getSingleRemittanceService(req.params.id);
    res.json({ remittance });
  } catch (err) {
    next(err);
  }
};

// Update Remittance
exports.updateRemittance = async (req, res, next) => {
  try {
    const remittance = await remittanceService.updateRemittanceService(req.params.id, req.body, req.user.id);
    res.json({ remittance });
  } catch (err) {
    next(err);
  }
};

// Delete Remittance (soft delete)
exports.deleteRemittance = async (req, res, next) => {
  try {
    const result = await remittanceService.deleteRemittanceService(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Verify Remittance
exports.verifyRemittance = async (req, res, next) => {
  try {
    const remittance = await remittanceService.verifyRemittanceService(req.params.id, 'Verified', req.user.id);
    res.json({ remittance });
  } catch (err) {
    next(err);
  }
};

// Reject Remittance
exports.rejectRemittance = async (req, res, next) => {
  try {
    const remittance = await remittanceService.verifyRemittanceService(req.params.id, 'Rejected', req.user.id);
    res.json({ remittance });
  } catch (err) {
    next(err);
  }
};

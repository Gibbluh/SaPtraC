const fuelService = require('../services/fuel.service');


// Create Fuel Transaction
exports.createFuelTransaction = async (req, res, next) => {
    try {
        const fuelTransaction =
            await fuelService.createFuelTransactionService({
                ...req.body,
                recordedBy: req.user.id,
            });

        res.status(201).json({
            fuelTransaction,
        });
    } catch (err) {
        next(err);
    }
};

// Get Fuel Transactions (list, pagination, search, filter)
exports.getFuelTransactions = async (req, res, next) => {
  try {
    const result = await fuelService.getFuelTransactionsService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get Single Fuel Transaction
exports.getSingleFuelTransaction = async (req, res, next) => {
  try {
    const fuelTransaction = await fuelService.getSingleFuelTransactionService(req.params.id);
    res.json({ fuelTransaction });
  } catch (err) {
    next(err);
  }
};

// Update Fuel Transaction
exports.updateFuelTransaction = async (req, res, next) => {
  try {
    const fuelTransaction = await fuelService.updateFuelTransactionService(req.params.id, req.body);
    res.json({ fuelTransaction });
  } catch (err) {
    next(err);
  }
};

// Delete Fuel Transaction (soft delete)
exports.deleteFuelTransaction = async (req, res, next) => {
  try {
    const result =
      await fuelService.deleteFuelTransactionService(
        req.params.id
      );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// PUBLIC RECEIPT
exports.getPublicFuelTransaction = async (
  req,
  res,
  next
) => {
  try {
    const fuelTransaction =
      await fuelService.getSingleFuelTransactionService(
        req.params.id
      );

    res.json(fuelTransaction);
  } catch (err) {
    next(err);
  }
};

// UNIT DASHBOARD SUMMARY
exports.getUnitFuelSummary = async (req, res, next) => {
  try {
    const summary =
      await fuelService.getUnitFuelSummaryService(
        req.params.unitId
      );

    res.json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

exports.getFuelAnalytics = async (
    req,
    res,
    next
) => {

    try{

        const analytics =
        await fuelService.getFuelAnalyticsService();

        res.json({
            success:true,
            analytics
        });

    }

    catch(err){

        next(err);

    }

};
// DAILY FUEL & REMITTANCE RECEIPT HISTORY
exports.getDailyFuelReceiptHistory = async (
  req,
  res,
  next
) => {

  try {

    const receipts =
      await fuelService.getDailyFuelReceiptHistoryService();

    res.json({
      success: true,
      receipts,
    });

  } catch (err) {

    next(err);

  }

};
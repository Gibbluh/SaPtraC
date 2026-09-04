const RepairHistory = require("../models/repairHistory.model");

exports.getRepairHistory = async (req, res) => {
  try {
    const history = await RepairHistory.find({
      maintenance: req.params.maintenanceId,
    })
      .populate("performedBy", "fullName email")
      .sort({ createdAt: 1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
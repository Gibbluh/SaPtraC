const maintenanceService = require('../services/maintenance.service');
const { maintenanceDecisionService } = require("../services/maintenanceDecision.service");

// Create Maintenance Record
exports.createMaintenance = async (req, res, next) => {
  try {
    // Handle uploaded files
    let issueImages = [];
    let repairDocuments = [];
    if (req.files) {
      if (req.files.issueImages) {
        issueImages = req.files.issueImages.map(f => f.path.replace(/\\/g, '/'));
      }
      if (req.files.repairDocuments) {
        repairDocuments = req.files.repairDocuments.map(f => f.path.replace(/\\/g, '/'));
      }
    }
    if (
  req.user.role !== "Administrator" &&
  req.user.role !== "Super Admin"
) {
  return res.status(403).json({
    message: "Only administrators can create maintenance records.",
  });
}
    const maintenance = await maintenanceService.createMaintenanceService({
      ...req.body,
      reportedBy: req.user.id,
      issueImages,
      repairDocuments,
    });
    res.status(201).json({ maintenance });
  } catch (err) {
    next(err);
  }
};

// Get Maintenance Records (list, pagination, filter, search)
exports.getMaintenance = async (req, res, next) => {
  try {
    const result = await maintenanceService.getMaintenanceService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get Single Maintenance Record
exports.getSingleMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.getSingleMaintenanceService(req.params.id);
    res.json({ maintenance });
  } catch (err) {
    next(err);
  }
};

// Update Maintenance Record
exports.updateMaintenance = async (req, res, next) => {
  try {
    // Handle uploaded files
    let updateData = { ...req.body };
    if (req.files) {
      if (req.files.issueImages) {
        updateData.issueImages = req.files.issueImages.map(f => f.path.replace(/\\/g, '/'));
      }
      if (req.files.repairDocuments) {
        updateData.repairDocuments = req.files.repairDocuments.map(f => f.path.replace(/\\/g, '/'));
      }
    }
    if (
  req.user.role !== "Administrator" &&
  req.user.role !== "Super Admin"
) {
  return res.status(403).json({
    message: "Only administrators can edit maintenance records.",
  });
}
    const maintenance = await maintenanceService.updateMaintenanceService(req.params.id, updateData, req.user.id);
    res.json({ maintenance });
  } catch (err) {
    next(err);
  }
};

// Delete Maintenance Record (soft delete)
exports.deleteMaintenance = async (req, res, next) => {
  try {
    const result = await maintenanceService.deleteMaintenanceService(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Update Maintenance Status
exports.updateMaintenanceStatus = async (req, res, next) => {
  try {
    if (
  req.user.role !== "Administrator" &&
  req.user.role !== "Super Admin"
) {
  return res.status(403).json({
    message: "Only administrators can change maintenance status.",
  });
}

    const { maintenanceStatus } = req.body;
    const maintenance = await maintenanceService.updateMaintenanceStatusService(req.params.id, maintenanceStatus, req.user.id);
    res.json({ maintenance });
  } catch (err) {
    next(err);
  }
};

// Assign Mechanic to Maintenance
exports.assignMechanic = async (req, res, next) => {
  try {
    if (
      req.user.role !== "Administrator" &&
      req.user.role !== "Super Admin"
    ) {
      return res.status(403).json({
        message: "Only administrators can assign mechanics.",
      });
    }

    const { mechanicId } = req.body;

    const maintenance =
      await maintenanceService.assignMechanicService(
        req.params.id,
        mechanicId,
        req.user.id
      );

    res.json({ maintenance });
  } catch (err) {
    next(err);
  }
};

// Driver reports an issue
exports.driverReportIssue = async (req, res, next) => {
  try {
    const { driverId, secret } = req.body;

    const maintenance =
      await maintenanceService.driverReportIssueService(
        driverId,
        secret,
        req.body
      );

    res.status(201).json({
      maintenance,
    });
  } catch (err) {
    next(err);
  }
};

// Get Maintenance History by Unit
exports.getMaintenanceByUnit = async (req, res, next) => {
  try {
    const maintenances =
      await maintenanceService.getMaintenanceByUnitService(
        req.params.unitId
      );

    res.json({
      maintenances,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUnitMaintenanceSummary = async (req, res, next) => {
  try {
    const summary =
      await maintenanceService.getUnitMaintenanceSummaryService(
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

exports.getUnitHealth = async (req, res, next) => {
  try {
    console.log("HEALTH ENDPOINT HIT");
    console.log("UNIT ID:", req.params.unitId);

    const health =
      await maintenanceService.getUnitHealthService(
        req.params.unitId
      );

    res.json({
      success: true,
      health,
    });

  } catch (err) {
    next(err);
  }
};

exports.getMaintenanceDecision = async (req, res, next) => {
  try {
    const decision =
      await maintenanceService.maintenanceDecisionService.getMaintenanceDecision(
        req.params.unitId
      );

    res.json({
      success: true,
      decision,
    });
  } catch (err) {
    next(err);
  }
};
    
console.log("LINE 1");
const unitService = require('../services/unit.service');


exports.getUnitByQR = async (req,res,next)=>{
    try{

       console.log("RAW PARAM");
       console.log(req.params.code);

        const {code}=req.params;

       const unit = await unitService.getUnitByQRService(code);

       console.log(unit);

       res.json({
       success: true,
       unit
  });

    }catch(err){
        next(err);
    }
}

console.log("LINE 2");

// Create Unit
exports.createUnit = async (req, res, next) => {
  try {
    // Ensure createdBy is set from the verified token (prevent client override)
    const payload = { ...req.body, createdBy: req.user && req.user.id };
    const unit = await unitService.createUnitService(payload);
    res.status(201).json({ unit });
  } catch (err) {
    next(err);
  }
};

console.log("LINE 3");

// Get Units (list, pagination, search, filter, sort)
exports.getUnits = async (req, res, next) => {
  try {
    const result = await unitService.getUnitsService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getUnitsDropdown = async (req, res, next) => {
  try {
    const units = await unitService.getUnitsDropdownService();
    res.json({ units });
  } catch (err) {
    next(err);
  }
};

// Get Single Unit
exports.getSingleUnit = async (req, res, next) => {
  try {
    const unit = await unitService.getSingleUnitService(req.params.id);
    res.json({ unit });
  } catch (err) {
    next(err);
  }
};

// Update Unit
exports.updateUnit = async (req, res, next) => {
  try {
    const unit = await unitService.updateUnitService(req.params.id, req.body);
    res.json({ unit });
  } catch (err) {
    next(err);
  }
};

// Delete Unit (soft delete)
exports.deleteUnit = async (req, res, next) => {
  try {
    const result = await unitService.deleteUnitService(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Update Unit Availability Status
exports.updateUnitAvailability = async (req, res, next) => {
  try {
    const { availabilityStatus } = req.body;
    const unit = await unitService.updateUnitAvailabilityService(req.params.id, availabilityStatus);
    res.json({ unit });
  } catch (err) {
    next(err);
  }
};

// Update Unit Maintenance Status
exports.updateUnitMaintenance = async (req, res, next) => {
  try {
    const { maintenanceStatus } = req.body;
    const unit = await unitService.updateUnitMaintenanceService(req.params.id, maintenanceStatus);
    res.json({ unit });
  } catch (err) {
    next(err);
  }
};

exports.getPublicUnit = async (req, res, next) => {
  try {

    console.log("PUBLIC UNIT ID:");
    console.log(req.params.id);

    const unit = await unitService.getSingleUnitService(req.params.id);

    console.log("FOUND UNIT:");
    console.log(unit);

    res.json({
      success: true,
      unit,
    });

  } catch (err) {

    console.log("PUBLIC UNIT ERROR");
    console.log(err);

    next(err);

  }
};


console.log(module.exports)
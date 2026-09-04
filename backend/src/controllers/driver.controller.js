const driverService = require('../services/driver.service');

// Helper to extract file paths from req.files
function extractDriverFiles(req) {
  const files = req.files || {};
  const result = {};
  if (files.profileImage && files.profileImage[0]) {
    result.profileImage = files.profileImage[0].path.replace(/\\/g, '/');
  }
  // Documents: license, nbiClearance, medicalCertificate
  result.documents = [];
  if (files.license && files.license[0]) {
    result.documents.push(files.license[0].path.replace(/\\/g, '/'));
  }
  if (files.nbiClearance && files.nbiClearance[0]) {
    result.documents.push(files.nbiClearance[0].path.replace(/\\/g, '/'));
  }
  if (files.medicalCertificate && files.medicalCertificate[0]) {
    result.documents.push(files.medicalCertificate[0].path.replace(/\\/g, '/'));
  }
  return result;
}

exports.getDriversDropdown = async (req, res, next) => {
  try {
    const drivers = await driverService.getDriversDropdownService();
    res.json({ drivers });
  } catch (err) {
    next(err);
  }
};

exports.getDriverByQR = async (req,res,next)=>{
   try {
       const { code } = req.params;
       const driver = await driverService.getDriverByQRService(code);
       res.json({ driver });
   } catch (err) {
       next(err);
   }
};

// Create Driver
exports.createDriver = async (req, res, next) => {
  try {

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const fileData = extractDriverFiles(req);

    // Ensure createdBy is set from authenticated user, not client payload
    const createdBy = req.user?.id || req.user?._id;
    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user context is missing.",
      });
    }

    const payload = {
      ...req.body,
      ...fileData,
      createdBy,
    };
    
 const driver = await driverService.createDriverService(payload);

    res.status(201).json({ driver });

  } catch (err) {
    console.error(err);
    next(err);
  }
};

// Get Drivers (list, pagination, search, filter, sort)
exports.getDrivers = async (req, res, next) => {
  try {
    const result = await driverService.getDriversService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get Single Driver
exports.getSingleDriver = async (req, res, next) => {
  try {
    const driver = await driverService.getSingleDriverService(req.params.id);
    res.json({ driver });
  } catch (err) {
    next(err);
  }
};

// Update Driver
exports.updateDriver = async (req, res, next) => {
  try {
    const fileData = extractDriverFiles(req);
    const driver = await driverService.updateDriverService(req.params.id, { ...req.body, ...fileData });
    res.json({ driver });
  } catch (err) {
    next(err);
  }
};

// Delete Driver (soft delete)
exports.deleteDriver = async (req, res, next) => {
  try {
    const result = await driverService.deleteDriverService(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Update Driver Status
exports.updateDriverStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const driver =
      await driverService.updateDriverStatusService(
        req.params.id,
        status
      );

    res.json({ driver });

  } catch (err) {
    next(err);
  }
};

exports.getPublicDriver = async (req, res, next) => {
  try {
    const driver = await driverService.getSingleDriverService(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.json({
      success: true,
      driver,
    });
  } catch (err) {
    next(err);
  }
};

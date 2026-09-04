const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed file types
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
const allowedDocTypes = ['application/pdf'];

// Max file sizes (in bytes)
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Organize by driver email or ID if available, else 'temp'
    let driverId = req.params.id || (req.body && req.body.email) || 'temp';
    let docType = file.fieldname;
    const uploadPath = path.join(__dirname, '../../uploads/drivers', String(driverId), docType);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, base + '-' + uniqueSuffix + ext);
  },
});

// File filter for validation
function fileFilter(req, file, cb) {
  if (file.fieldname === 'profileImage') {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG images are allowed for profile image.'));
    }
  } else {
    // Documents
    if (!allowedDocTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF files are allowed for documents.'));
    }
  }
  cb(null, true);
}

// Multer instance with limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: function (req, file, cb) {
      if (file.fieldname === 'profileImage') return MAX_IMAGE_SIZE;
      return MAX_DOC_SIZE;
    },
  },
});

// Fields for driver documents
const driverUploadFields = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'license', maxCount: 1 },
  { name: 'nbiClearance', maxCount: 1 },
  { name: 'medicalCertificate', maxCount: 1 },
]);

module.exports = {
  driverUploadFields,
  upload, // for custom use if needed
};

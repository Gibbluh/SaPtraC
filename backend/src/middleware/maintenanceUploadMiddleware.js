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
    // Organize by maintenance ID if available, else 'temp'
    let maintenanceId = req.params.id || 'temp';
    let docType = file.fieldname === 'issueImages' ? 'images' : 'documents';
    const uploadPath = path.join(__dirname, '../../uploads/maintenance', String(maintenanceId), docType);
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
  if (file.fieldname === 'issueImages') {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG images are allowed for issue images.'));
    }
  } else if (file.fieldname === 'repairDocuments') {
    if (!allowedDocTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF files are allowed for repair documents.'));
    }
  } else {
    return cb(new Error('Invalid field for maintenance upload.'));
  }
  cb(null, true);
}

// Multer instance with limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: function (req, file, cb) {
      if (file.fieldname === 'issueImages') return MAX_IMAGE_SIZE;
      if (file.fieldname === 'repairDocuments') return MAX_DOC_SIZE;
      return MAX_DOC_SIZE;
    },
  },
});

// Fields for maintenance uploads
const maintenanceUploadFields = upload.fields([
  { name: 'issueImages', maxCount: 5 },
  { name: 'repairDocuments', maxCount: 5 },
]);

module.exports = {
  maintenanceUploadFields,
  upload, // for custom use if needed
};

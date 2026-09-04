const QRCode = require('qrcode');
const Jimp = require('jimp');
const jsQR = require('jsqr');
const Driver = require('../models/driver.model');
const Unit = require('../models/unit.model');
const {
  decodeEntityQRPayload,
  extractEntityId,
} = require("./qrPayload");

/**
 * Decodes a QR code from a Data URL or image buffer.
 * @param {string|Buffer} qrInput - Data URL string or image buffer.
 * @returns {Promise<Object>} - Decoded payload object.
 */
async function decodeQRCode(qrInput) {
  let imageBuffer;

  if (
    typeof qrInput === "string" &&
    qrInput.startsWith("data:image")
  ) {
    const base64 = qrInput.split(",")[1];
    imageBuffer = Buffer.from(base64, "base64");
  } else if (Buffer.isBuffer(qrInput)) {
    imageBuffer = qrInput;
  } else {
    throw new Error("Invalid QR input format.");
  }

  const image = await Jimp.read(imageBuffer);

  const { data, width, height } = image.bitmap;

  const code = jsQR(
    new Uint8ClampedArray(data),
    width,
    height
  );

  if (!code) {
    throw new Error("QR code could not be decoded.");
  }

  return decodeEntityQRPayload(code.data);
}
/**
 * Validates the QR payload and determines its type.
 * @param {Object} payload
 * @returns {Object} - { type: 'driver'|'unit', valid: true, ...fields }
 */
function validateQRPayload(payload) {
  // Driver QR
  if (
    payload &&
    (payload.type === "driver" || payload.driverId || payload.id) &&
    extractEntityId(payload, "driver")
  ) {
    return { type: 'driver', valid: true, ...payload };
  }
  // Unit QR
  if (
    payload &&
    (payload.type === "unit" || payload.unitId || payload.id) &&
    extractEntityId(payload, "unit")
  ) {
    return { type: 'unit', valid: true, ...payload };
  }
  throw new Error('QR payload missing required fields.');
}

/**
 * Fetches the driver or unit from the database based on QR payload.
 * @param {Object} qrInfo - Output of validateQRPayload
 * @returns {Promise<Object>} - { type, data }
 */
async function fetchEntityFromQR(qrInfo) {
  if (qrInfo.type === 'driver') {
    const driver = await Driver.findOne({ _id: qrInfo.driverId, deletedAt: null });
    if (!driver) throw new Error('Driver not found or inactive.');
    return { type: 'driver', data: driver };
  }
  if (qrInfo.type === 'unit') {
    const unit = await Unit.findOne({ _id: qrInfo.unitId, deletedAt: null });
    if (!unit) throw new Error('Unit not found or inactive.');
    return { type: 'unit', data: unit };
  }
  throw new Error('Unknown QR type.');
}

/**
 * Main QR scan utility: decode, validate, fetch entity.
 * @param {string|Buffer} qrInput
 * @returns {Promise<{type: string, data: Object, payload: Object}>}
 */
async function scanAndFetchEntity(qrInput) {
  const payload = await decodeQRCode(qrInput);

  // NEW DRIVER QR
  if (typeof payload === "string") {
    if (payload.includes("/driver/")) {
      const id = extractEntityId(payload, "driver");

      const driver = await Driver.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!driver) {
        throw new Error("Driver not found.");
      }

      return {
        type: "driver",
        data: driver,
        payload,
      };
    }

    if (payload.includes("/unit/")) {
      const id = extractEntityId(payload, "unit");

      const unit = await Unit.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!unit) {
        throw new Error("Unit not found.");
      }

      return {
        type: "unit",
        data: unit,
        payload,
      };
    }
  }

  const qrInfo = validateQRPayload(payload);
  const entity = await fetchEntityFromQR(qrInfo);

  return {
    ...entity,
    payload,
  };
}

module.exports = {
  decodeQRCode,
  validateQRPayload,
  fetchEntityFromQR,
  scanAndFetchEntity,
};

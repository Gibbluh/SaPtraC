const QRCode = require("qrcode");

async function generateQRCode(payload) {
  try {
    const value =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    return await QRCode.toDataURL(value, {
      errorCorrectionLevel: "H",
    });

  } catch (err) {
    throw new Error("Failed to generate QR code: " + err.message);
  }
}

module.exports = generateQRCode;

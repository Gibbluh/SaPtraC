require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Driver = require("../models/driver.model");
const Unit = require("../models/unit.model");
const generateQRCode = require("./generateQRCode");
const { buildEntityQRPayload } = require("./qrPayload");

async function regenerateQRCodes() {
  await connectDB();

  const drivers = await Driver.find({ deletedAt: null });
  let driverNumber = 1;
  for (const driver of drivers.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))) {
    if (!driver.driverCode) {
      driver.driverCode = `DRV-${String(driverNumber).padStart(4, "0")}`;
    }
    driverNumber += 1;
    const payload = buildEntityQRPayload("driver", driver.driverCode);
    driver.qrCode = await generateQRCode(payload);
    await driver.save();
    console.log(`Driver QR updated: ${driver._id}`);
  }

  const units = await Unit.find({ deletedAt: null });
  for (const unit of units) {
    const payload = buildEntityQRPayload("unit", unit._id);
    unit.qrCode = await generateQRCode(payload);
    await unit.save();
    console.log(`Unit QR updated: ${unit._id}`);
  }

  console.log(
    `Done. Regenerated ${drivers.length} driver and ${units.length} unit QR codes.`
  );
}

regenerateQRCodes()
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.error("QR regeneration failed:", err);
    mongoose.connection.close();
    process.exit(1);
  });

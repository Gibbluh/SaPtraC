const express = require("express");
const router = express.Router();

const {
  getRepairHistory,
} = require("../controllers/repairHistory.controller");

router.get("/:maintenanceId", getRepairHistory);

module.exports = router;
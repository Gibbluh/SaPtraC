const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json({
      totalRevenue: 40000,
      totalExpenses: 30000,
      netProfit: 10000,
      totalTrips: 250,
      activeDrivers: 150,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch revenue data",
    });
  }
});

module.exports = router;
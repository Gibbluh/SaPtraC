const FuelTransaction = require("../models/fuelTransaction.model");
const Remittance = require("../models/remittance.model");
const Maintenance = require("../models/maintenance.model");
const Driver = require("../models/driver.model");
const Unit = require("../models/unit.model");
const mongoose = require("mongoose");

/**
 * =========================================================
 * DATE FILTER HELPER
 * =========================================================
 *
 * Supports:
 * - startDate
 * - endDate
 * - month
 * - year
 *
 * End date includes the entire selected day.
 */
const buildDateMatch = (
  field,
  {
    startDate,
    endDate,
    month,
    year,
  } = {}
) => {
  const match = {};

  const dateConditions = {};

  // Start Date
  if (startDate) {
    dateConditions.$gte = new Date(
      `${startDate}T00:00:00.000`
    );
  }

  // End Date
  // Use next day with $lt so the whole selected
  // end date is included.
  if (endDate) {
    const nextDay = new Date(
      `${endDate}T00:00:00.000`
    );

    nextDay.setDate(nextDay.getDate() + 1);

    dateConditions.$lt = nextDay;
  }

  if (Object.keys(dateConditions).length > 0) {
    match[field] = dateConditions;
  }

  /*
   * Month / Year filters
   *
   * These are added through $expr so they can work
   * together with startDate / endDate.
   */
  const expressions = [];

  if (month) {
    expressions.push({
      $eq: [
        { $month: `$${field}` },
        Number(month),
      ],
    });
  }

  if (year) {
    expressions.push({
      $eq: [
        { $year: `$${field}` },
        Number(year),
      ],
    });
  }

  if (expressions.length > 0) {
    match.$expr = {
      $and: expressions,
    };
  }

  return match;
};

/**
 * =========================================================
 * REVENUE ANALYTICS
 * =========================================================
 *
 * - Total revenue
 * - Daily revenue
 * - Weekly revenue
 * - Monthly revenue
 * - Revenue per route
 * - Remittance count
 *
 * IMPORTANT:
 * Only VERIFIED remittances are included in revenue
 * analytics.
 */
async function getRevenueAnalytics({
  startDate,
  endDate,
  month,
  year,
} = {}) {
  const match = buildDateMatch(
    "createdAt",
    {
      startDate,
      endDate,
      month,
      year,
    }
  );

  /*
   * SUMMARY
   */
  const [summary = {}] =
    await Remittance.aggregate([
      {
        $match: {
          ...match,
          deletedAt: null,
          verificationStatus: "Verified",
        },
      },

      {
        $group: {
          _id: null,

          totalRevenue: {
            $sum: "$cooperativeIncome",
          },

          remittanceCount: {
            $sum: 1,
          },
        },
      },
    ]);

  /*
   * DAILY REVENUE
   */
  const dailyRevenue =
    await Remittance.aggregate([
      {
        $match: {
          ...match,
          deletedAt: null,
          verificationStatus: "Verified",
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          revenue: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

  /*
   * WEEKLY REVENUE
   */
  const weeklyRevenue =
    await Remittance.aggregate([
      {
        $match: {
          ...match,
          deletedAt: null,
          verificationStatus: "Verified",
        },
      },

      {
        $group: {
          _id: {
            $week: "$createdAt",
          },

          revenue: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

  /*
   * MONTHLY REVENUE
   */
  const monthlyRevenue =
    await Remittance.aggregate([
      {
        $match: {
          ...match,
          deletedAt: null,
          verificationStatus: "Verified",
        },
      },

      {
        $group: {
          _id: {
            $month: "$createdAt",
          },

          revenue: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

  /*
   * REVENUE PER ROUTE
   */
  const routeRevenue =
    await Remittance.aggregate([
      {
        $match: {
          ...match,
          deletedAt: null,
          verificationStatus: "Verified",
        },
      },

      {
        $group: {
          _id: "$route",

          revenue: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },

      {
        $project: {
          _id: 0,

          route: "$_id",

          revenue: 1,
        },
      },
    ]);

  return {
    totalRevenue:
      summary.totalRevenue || 0,

    remittanceCount:
      summary.remittanceCount || 0,

    dailyRevenue: dailyRevenue.map(
      (d) => ({
        date: d._id,
        revenue: d.revenue,
      })
    ),

    weeklyRevenue: weeklyRevenue.map(
      (d) => ({
        week: `Week ${d._id}`,
        revenue: d.revenue,
      })
    ),

    monthlyRevenue: monthlyRevenue.map(
      (d) => ({
        month: d._id,
        revenue: d.revenue,
      })
    ),

    routeRevenue,
  };
}

/**
 * =========================================================
 * FUEL ANALYTICS
 * =========================================================
 *
 * - Total fuel cost
 * - Total fuel liters
 * - Diesel consumption
 * - Transaction count
 * - Daily fuel trend
 *
 * IMPORTANT:
 * Only fuel transactions whose linked remittance
 * has verificationStatus = "Verified" are included.
 */
async function getFuelAnalytics({
  startDate,
  endDate,
  month,
  year,
} = {}) {
  const match = buildDateMatch(
    "transactionDate",
    {
      startDate,
      endDate,
      month,
      year,
    }
  );

  const [summary = {}] =
    await FuelTransaction.aggregate([
      {
        $match: {
          ...match,
          deletedAt: null,
        },
      },

      /*
       * Link the fuel transaction to its remittance.
       */
      {
        $lookup: {
          from: "remittances",
          localField: "_id",
          foreignField: "fuelTransaction",
          as: "remittance",
        },
      },

      /*
       * Only transactions with an existing
       * remittance are considered.
       */
      {
        $unwind: "$remittance",
      },

      /*
       * Only VERIFIED remittances count.
       */
      {
        $match: {
          "remittance.verificationStatus": "Verified",
          "remittance.deletedAt": null,
        },
      },

      {
        $group: {
          _id: null,

          totalFuelCost: {
            $sum: "$fuelCost",
          },

          totalFuelLiters: {
            $sum: "$fuelLiters",
          },

          totalDieselConsumption: {
            $sum: "$totalDieselConsumption",
          },

          transactions: {
            $sum: 1,
          },
        },
      },
    ]);

  /*
   * DAILY FUEL
   */
  const dailyFuel =
    await FuelTransaction.aggregate([
      {
        $match: {
          ...match,
          deletedAt: null,
        },
      },

      /*
       * Link to remittance.
       */
      {
        $lookup: {
          from: "remittances",
          localField: "_id",
          foreignField: "fuelTransaction",
          as: "remittance",
        },
      },

      {
        $unwind: "$remittance",
      },

      /*
       * Only VERIFIED remittances.
       */
      {
        $match: {
          "remittance.verificationStatus": "Verified",
          "remittance.deletedAt": null,
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$transactionDate",
              timezone: "Asia/Manila",
            },
          },

          cost: {
            $sum: "$fuelCost",
          },

          liters: {
            $sum: "$fuelLiters",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

  return {
    totalFuelCost:
      summary.totalFuelCost || 0,

    totalFuelLiters:
      summary.totalFuelLiters || 0,

    totalDieselConsumption:
      summary.totalDieselConsumption || 0,

    transactions:
      summary.transactions || 0,

    dailyFuel,
  };
}

/**
 * =========================================================
 * MAINTENANCE ANALYTICS
 * =========================================================
 *
 * - Total
 * - Open
 * - Closed
 * - Critical
 * - Average resolution time
 */
async function getMaintenanceAnalytics({
  startDate,
  endDate,
  month,
  year,
} = {}) {
  const match = buildDateMatch(
    "createdAt",
    {
      startDate,
      endDate,
      month,
      year,
    }
  );

  const pipeline = [
    {
      $match: match,
    },

    {
      $facet: {
        total: [
          {
            $count: "count",
          },
        ],

        open: [
          {
            $match: {
              status: {
                $in: [
                  "Pending",
                  "Diagnosed",
                  "In Progress",
                  "Waiting Parts",
                ],
              },
            },
          },

          {
            $count: "count",
          },
        ],

        closed: [
          {
            $match: {
              status: "Completed",
            },
          },

          {
            $count: "count",
          },
        ],

        critical: [
          {
            $match: {
              priority: "Critical",
            },
          },

          {
            $count: "count",
          },
        ],

        avgResolution: [
          {
            $match: {
              status: "Completed",

              completedAt: {
                $exists: true,
              },
            },
          },

          {
            $project: {
              resolutionTime: {
                $subtract: [
                  "$completedAt",
                  "$createdAt",
                ],
              },
            },
          },

          {
            $group: {
              _id: null,

              avgResolutionTime: {
                $avg:
                  "$resolutionTime",
              },
            },
          },
        ],
      },
    },
  ];

  const [result = {}] =
    await Maintenance.aggregate(
      pipeline
    );

  return {
    total:
      result.total?.[0]?.count || 0,

    open:
      result.open?.[0]?.count || 0,

    closed:
      result.closed?.[0]?.count || 0,

    critical:
      result.critical?.[0]?.count || 0,

    avgResolutionTime:
      result.avgResolution?.[0]
        ?.avgResolutionTime || 0,
  };
}

/**
 * =========================================================
 * DRIVER PERFORMANCE ANALYTICS
 * =========================================================
 */
async function getDriverPerformanceAnalytics({
  driverId,
  startDate,
  endDate,
  month,
  year,
} = {}) {
  const match = {};

  if (driverId) {
    match.driver =
      mongoose.Types.ObjectId(
        driverId
      );
  }

  if (
    startDate ||
    endDate ||
    month ||
    year
  ) {
    Object.assign(
      match,
      buildDateMatch(
        "createdAt",
        {
          startDate,
          endDate,
          month,
          year,
        }
      )
    );
  }

  /*
   * Fuel
   */
  const fuelAgg =
    await FuelTransaction.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: "$driver",

          totalFuel: {
            $sum: "$liters",
          },

          avgEfficiency: {
            $avg: "$fuelEfficiency",
          },

          transactionCount: {
            $sum: 1,
          },
        },
      },
    ]);

  /*
   * Remittance
   */
  const remitMatch = {
    ...buildDateMatch(
      "createdAt",
      {
        startDate,
        endDate,
        month,
        year,
      }
    ),
    deletedAt: null,
    verificationStatus: "Verified",
  };

  if (driverId) {
    remitMatch.driver =
      mongoose.Types.ObjectId(
        driverId
      );
  }

  const remitAgg =
    await Remittance.aggregate([
      {
        $match: remitMatch,
      },

      {
        $group: {
          _id: "$driver",

          totalRemittance: {
            $sum: "$cooperativeIncome",
          },

          remittanceCount: {
            $sum: 1,
          },
        },
      },
    ]);

  return {
    fuel: fuelAgg[0] || {},

    remittance:
      remitAgg[0] || {},
  };
}

/**
 * =========================================================
 * REMITTANCE ANALYTICS
 * =========================================================
 *
 * - Trend
 * - Negative balances
 * - Top earners
 * - Driver remittances
 *
 * IMPORTANT:
 * Only VERIFIED remittances are included.
 */
async function getRemittanceAnalytics({
  startDate,
  endDate,
  month,
  year,
} = {}) {
  const match = {
    ...buildDateMatch(
      "createdAt",
      {
        startDate,
        endDate,
        month,
        year,
      }
    ),
    deletedAt: null,
    verificationStatus: "Verified",
  };

  /*
   * TREND
   */
  const trend =
    await Remittance.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          total: {
            $sum: "$cooperativeIncome",
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

  /*
   * NEGATIVE BALANCES
   */
  const negatives =
    await Remittance.aggregate([
      {
        $match: {
          ...match,
          hasNegativeBalance: true,
        },
      },

      {
        $count: "count",
      },
    ]);

  /*
   * TOP EARNERS
   */
  const topDrivers =
    await Remittance.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: "$driver",

          total: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          total: -1,
        },
      },

      {
        $limit: 5,
      },

      {
        $lookup: {
          from: "drivers",

          localField: "_id",

          foreignField: "_id",

          as: "driver",
        },
      },

      {
        $unwind: "$driver",
      },
    ]);

  /*
   * DRIVER REMITTANCES
   */
  const driverRemittances =
    await Remittance.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: "$driver",

          remittance: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          remittance: -1,
        },
      },

      {
        $lookup: {
          from: "drivers",

          localField: "_id",

          foreignField: "_id",

          as: "driver",
        },
      },

      {
        $unwind: "$driver",
      },

      {
        $project: {
          _id: 0,

          driverId: "$driver._id",

          driverName: {
            $concat: [
              "$driver.firstName",
              " ",
              "$driver.lastName",
            ],
          },

          remittance: 1,
        },
      },
    ]);

  return {
    trend,

    negativeCount:
      negatives[0]?.count || 0,

    topDrivers,

    driverRemittances,
  };
}

/**
 * =========================================================
 * UNIT AVAILABILITY ANALYTICS
 * =========================================================
 */
async function getUnitAvailabilityAnalytics() {
  const pipeline = [
    {
      $group: {
        _id: "$availabilityStatus",

        count: {
          $sum: 1,
        },
      },
    },
  ];

  const summary =
    await Unit.aggregate(
      pipeline
    );

  return summary.reduce(
    (acc, cur) => {
      acc[cur._id] =
        cur.count;

      return acc;
    },
    {}
  );
}

/**
 * =========================================================
 * DASHBOARD SUMMARY
 * =========================================================
 */
async function getDashboardSummary({
  startDate,
  endDate,
  month,
  year,
} = {}) {
  const [
    revenue,
    fuel,
    maintenance,
    remittance,
    unitAvailability,
  ] = await Promise.all([
    getRevenueAnalytics({
      startDate,
      endDate,
      month,
      year,
    }),

    getFuelAnalytics({
      startDate,
      endDate,
      month,
      year,
    }),

    getMaintenanceAnalytics({
      startDate,
      endDate,
      month,
      year,
    }),

    getRemittanceAnalytics({
      startDate,
      endDate,
      month,
      year,
    }),

    getUnitAvailabilityAnalytics(),
  ]);

  const activeDrivers =
    await Driver.countDocuments({
      status: "Active",
    });

  return {
    totalRevenue:
      revenue.totalRevenue || 0,

    /*
     * Existing behavior preserved:
     * totalRemittance still represents remittance count.
     *
     * It is now based on VERIFIED remittances because
     * getRevenueAnalytics() only includes VERIFIED records.
     */
    totalRemittance:
      revenue.remittanceCount || 0,

    totalFuelCost:
      fuel.totalFuelCost || 0,

    activeDrivers,

    activeUnits:
      unitAvailability.Available || 0,

    maintenanceIncidents:
      maintenance.total || 0,

    /*
     * Additional dashboard data
     */
    routeRevenue:
      revenue.routeRevenue || [],

    driverRemittances:
      remittance.driverRemittances ||
      [],
  };
}

/**
 * =========================================================
 * FLEET HEALTH ANALYTICS
 * =========================================================
 */
async function getFleetHealthAnalytics() {
  const units = await Unit.find({
    deletedAt: null,
  }).lean();

  const maintenance =
    await Maintenance.find({
      deletedAt: null,
    }).lean();

  let healthy = 0;
  let medium = 0;
  let high = 0;
  let critical = 0;

  let highestRisk = null;

  for (const unit of units) {
    const records =
      maintenance.filter(
        (m) =>
          String(m.unit) ===
          String(unit._id)
      );

    let score = 0;

    score +=
      records.length * 15;

    const pending =
      records.filter(
        (r) =>
          r.status === "Pending" ||
          r.status === "Diagnosed" ||
          r.status === "In Progress"
      ).length;

    score +=
      pending * 20;

    const criticalIssues =
      records.filter(
        (r) =>
          r.priority ===
          "Critical"
      ).length;

    score +=
      criticalIssues * 30;

    if (score > 100) {
      score = 100;
    }

    let level =
      "Healthy";

    if (score >= 80) {
      level = "Critical";
    } else if (score >= 60) {
      level = "High";
    } else if (score >= 30) {
      level = "Medium";
    }

    switch (level) {
      case "Healthy":
        healthy++;
        break;

      case "Medium":
        medium++;
        break;

      case "High":
        high++;
        break;

      case "Critical":
        critical++;
        break;
    }

    if (
      !highestRisk ||
      score >
        highestRisk.score
    ) {
      highestRisk = {
        plateNumber:
          unit.plateNumber,

        bodyNumber:
          unit.bodyNumber,

        score,

        level,

        recommendation:
          score >= 80
            ? "Immediate preventive maintenance is recommended."
            : score >= 60
            ? "Schedule inspection within 24 hours."
            : score >= 30
            ? "Monitor vehicle condition."
            : "Unit is healthy.",
      };
    }
  }

  return {
    healthy,

    medium,

    high,

    critical,

    recommendation:
      highestRisk,
  };
}

/**
 * =========================================================
 * EXECUTIVE SUMMARY
 * =========================================================
 *
 * Revenue-related executive figures only include
 * VERIFIED remittances.
 */
async function getExecutiveSummary() {
  const topDrivers =
    await Remittance.aggregate([
      {
        $match: {
          deletedAt: null,
          verificationStatus: "Verified",
        },
      },

      {
        $group: {
          _id: "$driver",

          totalRevenue: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          totalRevenue: -1,
        },
      },

      {
        $limit: 5,
      },

      {
        $lookup: {
          from: "drivers",

          localField: "_id",

          foreignField: "_id",

          as: "driver",
        },
      },

      {
        $unwind:
          "$driver",
      },

      {
        $project: {
          name: {
            $concat: [
              "$driver.firstName",
              " ",
              "$driver.lastName",
            ],
          },

          totalRevenue: 1,
        },
      },
    ]);

  const topRoutes =
    await Remittance.aggregate([
      {
        $match: {
          deletedAt: null,
          verificationStatus: "Verified",
        },
      },

      {
        $group: {
          _id: "$route",

          revenue: {
            $sum: "$cooperativeIncome",
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },

      {
        $limit: 5,
      },
    ]);

  const fleetStatus =
    await Unit.aggregate([
      {
        $group: {
          _id: "$availabilityStatus",

          count: {
            $sum: 1,
          },
        },
      },
    ]);

  return {
    topDrivers,

    topRoutes,

    fleetStatus,
  };
}

module.exports = {
  getRevenueAnalytics,
  getFuelAnalytics,
  getMaintenanceAnalytics,
  getDriverPerformanceAnalytics,
  getRemittanceAnalytics,
  getUnitAvailabilityAnalytics,
  getDashboardSummary,
  getFleetHealthAnalytics,
  getExecutiveSummary,
};
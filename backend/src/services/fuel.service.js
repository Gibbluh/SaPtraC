const FuelTransaction = require('../models/fuelTransaction.model');
const Schedule = require('../models/schedule.model');
const mongoose = require('mongoose');
const qrScanner = require('../utils/qrScanner');
const { getIO } = require('../socket/socket');
const User = require('../models/User');
const Unit = require('../models/unit.model');
const Driver = require('../models/driver.model');
const { createNotification } = require('./notification.service');
const Remittance = require("../models/remittance.model");
const QRCode = require("qrcode");

// === Fuel Anomaly Detection Config ===
const anomalyConfig = {
  maxMileagePerShift: 1000, // km
  maxFuelLitersPerShift: 500, // liters
  maxFuelCostPerShift: 20000, // currency units
  minFuelEfficiency: 1, // km/l (unrealistically low efficiency triggers anomaly)
  maxFuelEfficiency: 10, // km/l (unrealistically high efficiency triggers anomaly)
  maxDuplicateWindowMinutes: 10, // minutes for repeated suspicious transactions
};

// Helper: Validate odometer and shift transition logic
async function validateOdometerAndShift({
  driver,
  unit,
  shiftType,
  odometerIn,
  odometerOut,
  transactionDate,
  excludeId = null
}) {
  // Prevent negative mileage
  if (
    odometerIn < 0 ||
    (odometerOut !== undefined &&
      odometerOut < 0)
  ) {
    throw {
      status: 400,
      message:
        'Odometer readings cannot be negative.'
    };
  }

  // Prevent unrealistic mileage jumps (e.g., > 1000km in one shift)
  if (
    odometerOut !== undefined &&
    odometerOut !== null
  ) {
    const mileage =
      odometerOut - odometerIn;

    if (mileage < 0) {
      throw {
        status: 400,
        message:
          'Odometer OUT cannot be less than IN.'
      };
    }

    if (mileage > 1000) {
      throw {
        status: 400,
        message:
          'Unrealistic mileage jump detected.'
      };
    }
  }

  // Shift transition rules
  // 1st shift OUT == 2nd shift IN, 2nd shift OUT == next 1st shift IN
  // Find previous and next transactions for this unit
  const prevTx =
    await FuelTransaction.findOne({
      unit,
      deletedAt: null,
      ...(excludeId
        ? {
            _id: {
              $ne: excludeId
            }
          }
        : {}),
    }).sort({
      transactionDate: -1
    });

  if (
    prevTx &&
    prevTx.odometerOut !== undefined &&
    prevTx.odometerOut !== null
  ) {
    if (
      odometerIn !==
      prevTx.odometerOut
    ) {
      throw {
        status: 400,
        message:
          'Odometer IN must match previous OUT for this unit.'
      };
    }
  }

  // Optionally, check next transaction for update
  if (
    odometerOut !== undefined &&
    odometerOut !== null
  ) {
    const nextTx =
      await FuelTransaction.findOne({
        unit,
        deletedAt: null,
        ...(excludeId
          ? {
              _id: {
                $ne: excludeId
              }
            }
          : {}),
        transactionDate: {
          $gt: transactionDate
        },
      }).sort({
        transactionDate: 1
      });

    if (
      nextTx &&
      nextTx.odometerIn !== undefined &&
      nextTx.odometerIn !== null
    ) {
      if (
        odometerOut !==
        nextTx.odometerIn
      ) {
        throw {
          status: 400,
          message:
            'Odometer OUT must match next IN for this unit.'
        };
      }
    }
  }
}

// Helper: Detect duplicate transaction
async function isDuplicateTransaction({
  driver,
  unit,
  shiftType,
  transactionDate,
  excludeId = null
}) {
  const filter = {
    driver,
    unit,
    shiftType,
    transactionDate,
    deletedAt: null,
  };

  if (excludeId) {
    filter._id = {
      $ne: excludeId
    };
  }

  const exists =
    await FuelTransaction.findOne(
      filter
    );

  return !!exists;
}

// Helper: Notify admins of anomaly
async function notifyAdminsOfAnomaly({
  tx,
  reasons
}) {
  // Find all admin users
  const admins =
    await User.find({
      role: {
        $in: [
          'Super Admin',
          'Administrator',
          'Operational Manager'
        ]
      },
      isActive: true
    });

  if (!admins.length) return;

  // Populate unit and driver names
  let unitName = tx.unit;
  let driverName = tx.driver;

  try {
    const unit =
      await Unit.findById(
        tx.unit
      );

    if (unit) {
      unitName =
        unit.plateNumber ||
        unit.bodyNumber ||
        String(unit._id);
    }

    const driver =
      await Driver.findById(
        tx.driver
      );

    if (driver) {
      driverName =
        driver.firstName +
        ' ' +
        driver.lastName;
    }
  } catch {}

  // Send notification to each admin
  for (const admin of admins) {
    await createNotification({
      recipient: admin._id,
      title: 'Fuel Anomaly Detected',
      message: `Anomaly: ${reasons.join('; ')} | Unit: ${unitName} | Driver: ${driverName}`,
      type: 'FuelAnomaly',
    });
  }

  // Emit real-time alert to all admins
  const io = getIO();

  io.emit(
    'fuelAnomalyAlert',
    {
      reason: reasons.join('; '),
      unit: unitName,
      driver: driverName,
      transactionDate:
        tx.transactionDate,
    }
  );
}

// === Anomaly Detection Functions ===
async function detectAnomalies({
  driver,
  unit,
  shiftType,
  odometerIn,
  odometerOut,
  fuelLiters,
  fuelCost,
  transactionDate,
  excludeId = null
}) {
  const anomalies = [];

  // 1. Unrealistic mileage
  if (
    odometerOut !== undefined &&
    odometerOut !== null
  ) {
    const mileage =
      odometerOut -
      odometerIn;

    if (mileage < 0) {
      anomalies.push(
        'Odometer OUT less than IN'
      );
    } else if (
      mileage >
      anomalyConfig.maxMileagePerShift
    ) {
      anomalies.push(
        'Unrealistic mileage jump'
      );
    }

    // 2. Abnormal fuel consumption (efficiency)
    if (
      fuelLiters &&
      mileage >= 50
    ) {
      const efficiency =
        mileage / fuelLiters;

      if (
        efficiency <
        anomalyConfig.minFuelEfficiency
      ) {
        anomalies.push(
          'Abnormally low fuel efficiency'
        );
      } else if (
        efficiency >
        anomalyConfig.maxFuelEfficiency
      ) {
        anomalies.push(
          'Abnormally high fuel efficiency'
        );
      }
    }
  }

  // 3. Excessive fuel request
  if (
    fuelLiters &&
    fuelLiters >
      anomalyConfig.maxFuelLitersPerShift
  ) {
    anomalies.push(
      'Excessive fuel request'
    );
  }

  if (
    fuelCost &&
    fuelCost >
      anomalyConfig.maxFuelCostPerShift
  ) {
    anomalies.push(
      'Excessive fuel cost'
    );
  }

  // 4. Repeated suspicious transactions
  const windowStart =
    new Date(
      new Date(
        transactionDate
      ).getTime() -
        anomalyConfig.maxDuplicateWindowMinutes *
          60000
    );

  const duplicate =
    await FuelTransaction.findOne({
      driver,
      unit,
      shiftType,
      deletedAt: null,
      transactionDate: {
        $gte: windowStart,
        $lte: transactionDate
      },
      ...(excludeId
        ? {
            _id: {
              $ne: excludeId
            }
          }
        : {}),
    });

  if (duplicate) {
    anomalies.push(
      'Repeated suspicious transaction in short window'
    );
  }

  return anomalies;
}

// Create Fuel Transaction
async function createFuelTransactionService(
  data
) {
  const {
    driver,
    unit,
    shiftType,
    odometerIn,
    odometerOut,
    transactionDate,
    fuelLiters,
    fuelCost
  } = data;

  // Duplicate check
  if (
    await isDuplicateTransaction({
      driver,
      unit,
      shiftType,
      transactionDate
    })
  ) {
    throw {
      status: 409,
      message:
        'Duplicate fuel transaction detected.'
    };
  }

  // Odometer/shift validation
  await validateOdometerAndShift({
    driver,
    unit,
    shiftType,
    odometerIn,
    odometerOut,
    transactionDate
  });

  // Anomaly detection
  const anomalies =
    await detectAnomalies({
      driver,
      unit,
      shiftType,
      odometerIn,
      odometerOut,
      fuelLiters,
      fuelCost,
      transactionDate
    });

  const tx =
    new FuelTransaction({
      ...data,

      receiptNumber:
        `FUEL-${Date.now()}`,

      anomalyDetected:
        anomalies.length > 0,

      anomalyReason:
        anomalies.length > 0
          ? anomalies.join("; ")
          : null,
    });

  await tx.save();

  await tx.populate([
    {
      path: "driver",
      select:
        "firstName lastName"
    },
    {
      path: "unit",
      select:
        "bodyNumber plateNumber"
    }
  ]);

  const qrPayload = {
    detailsUrl:
      `${process.env.FRONTEND_URL}/fuel/${tx._id}`,
    transactionId:
      tx._id,
    unit:
      tx.unit.bodyNumber ||
      tx.unit.plateNumber,
    route: tx.route,
    boundary:
      tx.totalBoundary,
    pila:
      tx.pilaTrips,
    salubong:
      tx.salubongTrips,
    receipt:
      tx.receiptNumber,
    liters:
      tx.fuelLiters,
    cost:
      tx.fuelCost,
    odometerIn:
      tx.odometerIn,
    odometerOut:
      tx.odometerOut,
    station:
      tx.fuelStation,
    shift:
      tx.shiftType,
    anomaly:
      tx.anomalyDetected,
    remarks:
      tx.remarks,
  };

  console.log(
    "TX ID:",
    tx._id
  );

  console.log(
    "QR URL:",
    `${process.env.FRONTEND_URL}/fuel/${tx._id}`
  );

  tx.qrCodeData =
    qrPayload.detailsUrl;

  tx.qrImage =
    await QRCode.toDataURL(
      qrPayload.detailsUrl
    );

  await tx.save();

  try {
    const existingRemittance =
      await Remittance.findOne({
        fuelTransaction: tx._id,
        deletedAt: null,
      });

    console.log(
      "Fuel receipt:",
      tx.receiptNumber
    );

    if (!existingRemittance) {
      const remittance =
        await Remittance.create({
          fuelTransaction:
            tx._id,

          driver:
            tx.driver._id ||
            tx.driver,

          unit:
            tx.unit._id ||
            tx.unit,

          route:
            tx.route,

          totalBoundary:
            tx.totalBoundary,

          fuelDeduction:
            tx.fuelCost,

          salaryDeduction:
            0,

          otherExpenses:
            0,

          totalExpenses:
            tx.fuelCost,

          cooperativeIncome:
            tx.totalRemit,

          driverNetIncome:
            0,

          remainingBalance:
            0,

          negativeBalance:
            0,

          remittanceDate:
            tx.transactionDate,

          receiptNumber:
            tx.receiptNumber,

          remarks:
            tx.remarks,

          /*
           * IMPORTANT:
           * Newly created fuel transactions
           * remain Pending until verified.
           */
          verificationStatus:
            "Pending",

          totalDieselConsumption:
            tx.fuelLiters,

          pilaTrips:
            tx.pilaTrips,

          salubongTrips:
            tx.salubongTrips,
        });

      console.log(
        "✅ Remittance created:",
        remittance._id
      );
    }
  } catch (err) {
    console.error(
      "❌ REMITTANCE CREATE ERROR"
    );

    console.error(err);

    throw err;
  }

  if (
    anomalies.length > 0
  ) {
    await notifyAdminsOfAnomaly({
      tx,
      reasons: anomalies
    });
  }

  return tx;
}

// Get Fuel Transactions (pagination, search, filter)
async function getFuelTransactionsService({
  page = 1,
  limit = 10,
  search = '',
  ...filters
}) {
  page = parseInt(page);
  limit = parseInt(limit);

  const query = {
    deletedAt: null
  };

  if (filters.driver) {
    query.driver =
      filters.driver;
  }

  if (filters.unit) {
    query.unit =
      filters.unit;
  }

  if (filters.shiftType) {
    query.shiftType =
      filters.shiftType;
  }

  if (filters.transactionDate) {
    query.transactionDate =
      filters.transactionDate;
  }

  if (
    filters.anomalyDetected !==
    undefined
  ) {
    query.anomalyDetected =
      filters.anomalyDetected;
  }

  if (search) {
    const driverIds =
      await Driver.find({
        deletedAt: null,
        $or: [
          {
            firstName: {
              $regex: search,
              $options: "i"
            }
          },
          {
            middleName: {
              $regex: search,
              $options: "i"
            }
          },
          {
            lastName: {
              $regex: search,
              $options: "i"
            }
          },
          {
            email: {
              $regex: search,
              $options: "i"
            }
          },
          {
            licenseNumber: {
              $regex: search,
              $options: "i"
            }
          },
        ],
      }).distinct("_id");

    const unitIds =
      await Unit.find({
        deletedAt: null,
        $or: [
          {
            plateNumber: {
              $regex: search,
              $options: "i"
            }
          },
          {
            bodyNumber: {
              $regex: search,
              $options: "i"
            }
          },
        ],
      }).distinct("_id");

    query.$or = [
      {
        fuelStation: {
          $regex: search,
          $options: "i"
        }
      },
      {
        remarks: {
          $regex: search,
          $options: "i"
        }
      },
      {
        qrCodeData: {
          $regex: search,
          $options: "i"
        }
      },
      ...(driverIds.length
        ? [
            {
              driver: {
                $in: driverIds
              }
            }
          ]
        : []),
      ...(unitIds.length
        ? [
            {
              unit: {
                $in: unitIds
              }
            }
          ]
        : []),
    ];
  }

  const total =
    await FuelTransaction.countDocuments(
      query
    );

  const transactions =
    await FuelTransaction.find(
      query
    )
      .sort({
        transactionDate: -1
      })
      .skip(
        (page - 1) * limit
      )
      .limit(limit)
      .populate(
        'driver unit schedule recordedBy'
      );

  return {
    transactions,
    total,
    page,
    totalPages:
      Math.ceil(
        total / limit
      ),
  };
}

// Get Single Fuel Transaction
async function getSingleFuelTransactionService(
  id
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ) {
    throw {
      status: 400,
      message:
        'Invalid transaction ID.'
    };
  }

  const tx =
    await FuelTransaction.findOne({
      _id: id,
      deletedAt: null
    }).populate(
      'driver unit schedule recordedBy'
    );

  if (!tx) {
    throw {
      status: 404,
      message:
        'Fuel transaction not found.'
    };
  }

  return tx;
}

// Update Fuel Transaction
async function updateFuelTransactionService(
  id,
  data
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ) {
    throw {
      status: 400,
      message:
        'Invalid transaction ID.'
    };
  }

  const tx =
    await FuelTransaction.findOne({
      _id: id,
      deletedAt: null
    });

  if (!tx) {
    throw {
      status: 404,
      message:
        'Fuel transaction not found.'
    };
  }

  // Duplicate check
  if (
    await isDuplicateTransaction({
      driver:
        data.driver ||
        tx.driver,

      unit:
        data.unit ||
        tx.unit,

      shiftType:
        data.shiftType ||
        tx.shiftType,

      transactionDate:
        data.transactionDate ||
        tx.transactionDate,

      excludeId: id
    })
  ) {
    throw {
      status: 409,
      message:
        'Duplicate fuel transaction detected.'
    };
  }

  // Odometer/shift validation
  await validateOdometerAndShift({
    driver:
      data.driver ||
      tx.driver,

    unit:
      data.unit ||
      tx.unit,

    shiftType:
      data.shiftType ||
      tx.shiftType,

    odometerIn:
      data.odometerIn !==
      undefined
        ? data.odometerIn
        : tx.odometerIn,

    odometerOut:
      data.odometerOut !==
      undefined
        ? data.odometerOut
        : tx.odometerOut,

    transactionDate:
      data.transactionDate ||
      tx.transactionDate,

    excludeId: id,
  });

  // Anomaly detection
  const anomalies =
    await detectAnomalies({
      driver:
        data.driver ||
        tx.driver,

      unit:
        data.unit ||
        tx.unit,

      shiftType:
        data.shiftType ||
        tx.shiftType,

      odometerIn:
        data.odometerIn !==
        undefined
          ? data.odometerIn
          : tx.odometerIn,

      odometerOut:
        data.odometerOut !==
        undefined
          ? data.odometerOut
          : tx.odometerOut,

      fuelLiters:
        data.fuelLiters !==
        undefined
          ? data.fuelLiters
          : tx.fuelLiters,

      fuelCost:
        data.fuelCost !==
        undefined
          ? data.fuelCost
          : tx.fuelCost,

      transactionDate:
        data.transactionDate ||
        tx.transactionDate,

      excludeId: id,
    });

  Object.assign(
    tx,
    data,
    {
      anomalyDetected:
        anomalies.length > 0,

      anomalyReason:
        anomalies.length > 0
          ? anomalies.join('; ')
          : null,
    }
  );

  await tx.save();

  if (
    anomalies.length > 0
  ) {
    await notifyAdminsOfAnomaly({
      tx,
      reasons: anomalies
    });
  }

  return tx;
}

// Soft Delete Fuel Transaction
async function deleteFuelTransactionService(
  id
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ) {
    throw {
      status: 400,
      message:
        'Invalid transaction ID.'
    };
  }

  const tx =
    await FuelTransaction.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null
      },
      {
        $set: {
          deletedAt:
            new Date()
        }
      },
      {
        new: true
      }
    );

  if (!tx) {
    throw {
      status: 404,
      message:
        'Fuel transaction not found.'
    };
  }

  return {
    message:
      'Fuel transaction deleted successfully.'
  };
}

// Utility: Scan QR and fetch driver/unit
async function scanQRAndFetchEntity(
  qrInput
) {
  return await qrScanner.scanAndFetchEntity(
    qrInput
  );
}

// Get Lifetime Statistics per Unit
async function getUnitLifetimeStatisticsService(
  unitId
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      unitId
    )
  ) {
    throw {
      status: 400,
      message:
        "Invalid Unit ID.",
    };
  }

  const result =
    await FuelTransaction.aggregate([
      {
        $match: {
          unit:
            new mongoose.Types.ObjectId(
              unitId
            ),
          deletedAt: null,
        },
      },

      {
        $group: {
          _id: "$unit",

          totalFuelCost: {
            $sum: "$fuelCost",
          },

          totalFuelLiters: {
            $sum: "$fuelLiters",
          },

          totalRemittance: {
            $sum: "$totalRemit",
          },
        },
      },
    ]);

  return (
    result[0] || {
      totalFuelCost: 0,
      totalFuelLiters: 0,
      totalRemittance: 0,
    }
  );
}

// =====================================
// UNIT DASHBOARD SUMMARY
// =====================================
async function getUnitFuelSummaryService(
  unitId
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      unitId
    )
  ) {
    throw {
      status: 400,
      message:
        "Invalid unit ID.",
    };
  }

  const summary =
    await Remittance.aggregate([
      {
        $match: {
          unit:
            new mongoose.Types.ObjectId(
              unitId
            ),
          verificationStatus:
            "Verified",
          deletedAt: null,
        },
      },

      {
        $group: {
          _id: "$unit",

          lifetimeFuelCost: {
            $sum: "$fuelDeduction",
          },

          dieselConsumption: {
            $sum:
              "$totalDieselConsumption",
          },

          lifetimeRemittance: {
            $sum:
              "$cooperativeIncome",
          },
        },
      },
    ]);

  return (
    summary[0] || {
      lifetimeFuelCost: 0,
      dieselConsumption: 0,
      lifetimeRemittance: 0,
    }
  );
}

// ============================================
// FUEL MONITORING ANALYTICS
// ============================================
async function getFuelAnalyticsService() {

  const analytics =
    await FuelTransaction.aggregate([
      {
        $match: {
          deletedAt: null
        }
      },

      /*
       * Link the fuel transaction to the
       * remittance created for it.
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
       * IMPORTANT:
       * Only VERIFIED remittances contribute
       * to Fuel Monitoring summary cards.
       */
      {
        $match: {
          "remittance.verificationStatus":
            "Verified",

          "remittance.deletedAt":
            null,
        },
      },

      {
        $group: {
          _id: null,

          totalFuelCost: {
            $sum:
              "$fuelCost"
          },

          totalFuelLiters: {
            $sum:
              "$fuelLiters"
          },

          totalTransactions: {
            $sum: 1
          },

          totalAnomalies: {
            $sum: {
              $cond: [
                "$anomalyDetected",
                1,
                0
              ]
            }
          },

          averageFuelCost: {
            $avg:
              "$fuelCost"
          },

          averageFuelLiters: {
            $avg:
              "$fuelLiters"
          }
        }
      }
    ]);

  return (
    analytics[0] || {
      totalFuelCost: 0,
      totalFuelLiters: 0,
      totalTransactions: 0,
      totalAnomalies: 0,
      averageFuelCost: 0,
      averageFuelLiters: 0
    }
  );
}

// ============================================
// DAILY FUEL & REMITTANCE RECEIPT HISTORY
// ============================================
async function getDailyFuelReceiptHistoryService() {
  const receipts =
    await FuelTransaction.aggregate([
      {
        $match: {
          deletedAt: null,
        },
      },

      {
        $group: {
          _id: {
            year: {
              $year: {
                date:
                  "$transactionDate",
                timezone:
                  "Asia/Manila",
              },
            },

            month: {
              $month: {
                date:
                  "$transactionDate",
                timezone:
                  "Asia/Manila",
              },
            },

            day: {
              $dayOfMonth: {
                date:
                  "$transactionDate",
                timezone:
                  "Asia/Manila",
              },
            },
          },

          transactionCount: {
            $sum: 1,
          },

          boundaryTotal: {
            $sum:
              "$totalBoundary",
          },

          fuelCostTotal: {
            $sum: "$fuelCost",
          },

          litersTotal: {
            $sum:
              "$fuelLiters",
          },

          drivers: {
            $push:
              "$driver"
          },

          units: {
            $push:
              "$unit"
          },

          routes: {
            $push:
              "$route"
          }
        }
      }
    ]);

  return Promise.all(
    receipts.map(
      async (
        r,
        index
      ) => {
        const receiptNumber =
          `FR-${
            r._id.year
          }${
            String(
              r._id.month
            ).padStart(
              2,
              "0"
            )
          }${
            String(
              r._id.day
            ).padStart(
              2,
              "0"
            )
          }-${
            String(
              index + 1
            ).padStart(
              4,
              "0"
            )
          }`;

        const dateKey =
          `${
            r._id.year
          }-${
            String(
              r._id.month
            ).padStart(
              2,
              "0"
            )
          }-${
            String(
              r._id.day
            ).padStart(
              2,
              "0"
            )
          }`;

        const publicUrl =
          `${process.env.FRONTEND_URL}/fuel/daily-receipt/${dateKey}`;

        const qrPayload = {
          type:
            "daily-receipt",

          receiptNumber,

          dateKey,

          boundaryTotal:
            r.boundaryTotal,

          fuelCostTotal:
            r.fuelCostTotal,

          litersTotal:
            r.litersTotal,

          transactionCount:
            r.transactionCount,

          url:
            publicUrl,
        };

        const dailyQrImage =
          await QRCode.toDataURL(
            publicUrl
          );

        return {
          receiptNumber,

          dateKey,

          // Keep the generated receipt date aligned with
          // the Philippines calendar date.
          date: new Date(
            `${dateKey}T00:00:00+08:00`
          ),

          boundaryTotal:
            r.boundaryTotal,

          fuelCostTotal:
            r.fuelCostTotal,

          litersTotal:
            r.litersTotal,

          transactionCount:
            r.transactionCount,

          dailyQrImage,

          dailyQrData:
            publicUrl,
        };
      }
    )
  );
}

module.exports = {
  createFuelTransactionService,
  getFuelTransactionsService,
  getSingleFuelTransactionService,
  updateFuelTransactionService,
  deleteFuelTransactionService,
  getUnitLifetimeStatisticsService,
  scanQRAndFetchEntity,
  getUnitFuelSummaryService,
  getFuelAnalyticsService,
  getDailyFuelReceiptHistoryService,
};
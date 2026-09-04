const Maintenance = require("../models/maintenance.model");
const mongoose = require("mongoose");

async function getMaintenanceDecision(unitId) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw {
      status: 400,
      message: "Invalid unit ID",
    };
  }

  const now = new Date();

  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);

  const previous30 = new Date(now);
  previous30.setDate(previous30.getDate() - 60);


  const maintenances = await Maintenance.find({
    unit: unitId,
    deletedAt: null,
  });

  const last30Maintenance = maintenances.filter(
    (m) => new Date(m.createdAt) >= last30
  );

  const previous30Maintenance = maintenances.filter((m) => {
    const d = new Date(m.createdAt);

    return d >= previous30 && d < last30;
  });

  const recurringCount = maintenances.filter(
    (m) => m.recurringIssueDetected
  ).length;

  const emergencyCount = maintenances.filter(
    (m) => m.maintenanceType === "Emergency"
  ).length;

  const criticalIssues = maintenances.filter(
    (m) => m.priorityLevel === "Critical"
  ).length;

  const last30Cost = last30Maintenance.reduce(
    (sum, item) => sum + (item.totalCost || 0),
    0
  );

  const previous30Cost = previous30Maintenance.reduce(
    (sum, item) => sum + (item.totalCost || 0),
    0
  );

  //--------------------------------
  // DSS
  //--------------------------------

  let risk = "Low";
  let priority = "Low";
  let recommendation = "No Immediate Action Required";

  const reasons = [];

  //--------------------------------
  // Rule 1
  //--------------------------------

  if (last30Maintenance.length >= 4) {
    risk = "High";
    priority = "High";

    reasons.push(
      "Frequent maintenance reports in last 30 days"
    );
  }

  //--------------------------------
// Rule 1.5
//--------------------------------

if (
  last30Maintenance.length >= 2 &&
  last30Maintenance.length < 4 &&
  risk === "Low"
) {
  risk = "Medium";
  priority = "Medium";

  reasons.push(
    "Increasing maintenance frequency detected"
  );
}

  //--------------------------------
  // Rule 2
  //--------------------------------

  if (recurringCount >= 3) {
    risk = "High";
    priority = "High";

    reasons.push(
      "Recurring maintenance issues detected"
    );
  }

  //--------------------------------
  // Rule 3
  //--------------------------------

  if (emergencyCount >= 2) {
    risk = "Critical";
    priority = "Critical";

    reasons.push(
      "Multiple emergency maintenance records"
    );
  }

  //--------------------------------
  // Rule 4
  //--------------------------------

  if (criticalIssues >= 1) {
    risk = "Critical";
    priority = "Critical";

    reasons.push(
      "Critical priority maintenance exists"
    );
  }

  //--------------------------------
  // Rule 5
  //--------------------------------

  if (last30Cost > previous30Cost) {

  reasons.push(
    "Maintenance cost is increasing"
  );

  if (risk === "Low") {
    risk = "Medium";
    priority = "Medium";
  }

}

  //--------------------------------
  // Recommendation
  //--------------------------------

  if (risk === "Critical") {

  recommendation =
    "Immediate Preventive Maintenance Required";

}
else if (risk === "High") {

  recommendation =
    "Schedule Maintenance Immediately";

}
else if (risk === "Medium") {

  recommendation =
    "Schedule Inspection Within 7 Days";

}
else {

  recommendation =
    "Continue Normal Operation";

}

//--------------------------------
// Dynamic Prediction Module
//--------------------------------
const totalMaintenance = maintenances.length || 1;
const prediction = {};
const recentCategoryCount = {};
const previousCategoryCount = {};
const categoryStats = {};

maintenances.forEach((m) => {
  const category = m.issueCategory || "Unknown";
  const created = new Date(m.createdAt);

  if (!recentCategoryCount[category]) recentCategoryCount[category] = 0;
  if (!previousCategoryCount[category]) previousCategoryCount[category] = 0;

  if (!categoryStats[category]) {
    categoryStats[category] = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      recurring: 0,
      emergency: 0,
    };
  }

  categoryStats[category].total += 1;

  if (created >= last30) {
    recentCategoryCount[category] += 1;
  } else if (created >= previous30 && created < last30) {
    previousCategoryCount[category] += 1;
  }

  if (m.priorityLevel === "Critical") {
    categoryStats[category].critical += 1;
  } else if (m.priorityLevel === "High") {
    categoryStats[category].high += 1;
  } else if (m.priorityLevel === "Medium") {
    categoryStats[category].medium += 1;
  } else {
    categoryStats[category].low += 1;
  }

  if (m.recurringIssueDetected) {
    categoryStats[category].recurring += 1;
  }

  if (m.maintenanceType === "Emergency") {
    categoryStats[category].emergency += 1;
  }
});

Object.keys(categoryStats).forEach((key) => {
  const stats = categoryStats[key];
  const recent = recentCategoryCount[key] || 0;
  const previous = previousCategoryCount[key] || 0;
  const categoryTotal = stats.total || 1;

  let confidence =
    (recent / totalMaintenance) * 45 +
    ((stats.critical * 20) +
      (stats.high * 12) +
      (stats.medium * 6) +
      (stats.low * 2)) / categoryTotal +
    (stats.recurring > 0 ? 10 : 0) +
    (stats.emergency > 0 ? 10 : 0) +
    (recent > previous ? 15 : recent < previous ? -10 : 0);

  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  prediction[key] = {
    confidence,
    trend:
      recent > previous
        ? "Increasing"
        : recent < previous
        ? "Decreasing"
        : "Stable",
  };
});
const sortedPrediction = Object.entries(prediction).sort(
  (a, b) => b[1].confidence - a[1].confidence
);

const recommendedComponent =
  sortedPrediction.length > 0
    ? sortedPrediction[0]
    : ["No Predicted Issue", { confidence: 0, trend: "Stable" }];
  return {

  risk,

  priority,

  recommendation,

  reasons,

  prediction,

 recommendedComponent: {

    component: recommendedComponent[0],

    confidence: recommendedComponent[1].confidence,

    trend: recommendedComponent[1].trend,

},

  statistics: {

    totalMaintenance: maintenances.length,

    recurringCount,

    emergencyCount,

    criticalIssues,

    last30Maintenance: last30Maintenance.length,

    last30Cost,

    previous30Cost,

  },

};
}
module.exports = {
  getMaintenanceDecision,
};
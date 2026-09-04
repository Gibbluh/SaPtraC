import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Car,
  User,
  Fuel,
  MapPin,
  Calendar,
  Wallet,
  Activity,
  Wrench,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const UnitDashboard = () => {
  const [summary, setSummary] = useState({
    lifetimeFuelCost: 0,
    dieselConsumption: 0,
    lifetimeRemittance: 0,
    maintenanceCost: 0,
  });

  const [health, setHealth] = useState({
    score: 100,
    health: "Excellent",
  });

  const [decision, setDecision] = useState(null);
  const { id } = useParams();
  const [unit, setUnit] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);

  const API = import.meta.env.VITE_API_URL || "/api";

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading unit...");
        const res = await fetch(`${API}/units/public/${id}`);
        const data = await res.json();
        console.log("Unit Data:", data);

        setUnit(data.unit);
        console.log("Before maintenance fetch");

        const historyRes = await fetch(
          `${API}/maintenance/unit/${data.unit._id}`
        );
        console.log("Maintenance fetch finished");

        const historyData = await historyRes.json();
        console.log("Maintenance Data:", historyData);

        setMaintenanceHistory(historyData.maintenances || []);

        const fuelRes = await fetch(
          `${API}/fuel/summary/unit/${data.unit._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const fuelData = await fuelRes.json();
        console.log("Fuel Summary:", fuelData);

        if (fuelRes.ok && fuelData.summary) {
          setSummary((prev) => ({
            ...prev,
            lifetimeFuelCost:
              fuelData.summary.lifetimeFuelCost || 0,
            dieselConsumption:
              fuelData.summary.dieselConsumption || 0,
            lifetimeRemittance:
              fuelData.summary.lifetimeRemittance || 0,
          }));
        }

        const maintenanceRes = await fetch(
          `${API}/maintenance/summary/unit/${data.unit._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const healthRes = await fetch(
          `${API}/maintenance/health/unit/${data.unit._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const healthData = await healthRes.json();
        console.log("Health:", healthData);

        if (healthRes.ok && healthData.health) {
          setHealth(healthData.health);
        }

        const decisionRes = await fetch(
          `${API}/maintenance/decision/unit/${data.unit._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const decisionData = await decisionRes.json();
        console.log("DSS", decisionData);

        if (decisionRes.ok && decisionData.decision) {
          setDecision(decisionData.decision);
        }

        const maintenanceData = await maintenanceRes.json();
        console.log("Maintenance Summary:", maintenanceData);

        if (maintenanceRes.ok && maintenanceData.summary) {
          setSummary((prev) => ({
            ...prev,
            maintenanceCost:
              maintenanceData.summary.lifetimeMaintenanceCost || 0,
          }));
        }
      } catch (err) {
        console.error("LOAD ERROR:", err);
      }
    };

    loadData();
  }, [id]);

  if (!unit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100">
        <span className="loading loading-spinner loading-lg text-blue-900"></span>
        <p className="mt-4 text-base font-semibold text-black">
          Loading vehicle information...
        </p>
      </div>
    );
  }

  const availabilityColor =
    unit.availabilityStatus === "Available"
      ? "bg-green-600"
      : unit.availabilityStatus === "On Route"
      ? "bg-blue-600"
      : unit.availabilityStatus === "Under Maintenance"
      ? "bg-orange-500"
      : "bg-red-600";

  const maintenanceColor =
    unit.maintenanceStatus === "Good"
      ? "bg-green-600"
      : unit.maintenanceStatus === "Needs Maintenance"
      ? "bg-orange-500"
      : "bg-red-600";

  return (
    <div className="min-h-screen bg-slate-100 text-black">

      {/* =========================
          HEADER
      ========================== */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white shadow-lg">
  <div className="w-full px-4 py-6 sm:px-6 lg:px-10 xl:px-14">
    <div className="flex items-center justify-start gap-4">

      {/* Logo */}
      <img
        src="/images/9d87ecd4-644f-4661-8a04-b7e529051f85.png"
        alt="San Pedro Transport Cooperative logo"
        className="h-24 w-24 shrink-0 object-contain drop-shadow-sm sm:h-28 sm:w-28 lg:h-32 lg:w-32"
      />

      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-wide sm:text-3xl lg:text-4xl">
          SAN PEDRO TRANSPORT COOPERATIVE
        </h1>

        <p className="mt-1 text-sm font-medium text-white sm:text-base">
          Vehicle Information Portal
        </p>
      </div>

    </div>
  </div>
</header>

      <main className="w-full space-y-6 px-3 py-6 sm:px-5 md:px-8 lg:px-10 xl:px-14">

        {/* =========================
            KPI / SUMMARY CARDS
        ========================== */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide text-black sm:text-2xl">
              Vehicle Summary
            </h2>
            <p className="mt-1 text-sm font-medium text-black">
              Lifetime operational and financial statistics for this vehicle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

            {/* Fuel Cost */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Lifetime Fuel Cost
                  </p>

                  <h2 className="mt-4 text-3xl font-bold text-black sm:text-4xl">
                    ₱{summary.lifetimeFuelCost.toLocaleString()}
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Wallet className="text-blue-900" size={22} />
                </div>
              </div>
            </div>

            {/* Diesel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Diesel Consumption
                  </p>

                  <h2 className="mt-4 text-3xl font-bold text-black sm:text-4xl">
                    {summary.dieselConsumption.toLocaleString()} L
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Fuel className="text-blue-900" size={22} />
                </div>
              </div>
            </div>

            {/* Remittance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Lifetime Remittance
                  </p>

                  <h2 className="mt-4 text-3xl font-bold text-black sm:text-4xl">
                    ₱{summary.lifetimeRemittance.toLocaleString()}
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <TrendingUp className="text-blue-900" size={22} />
                </div>
              </div>
            </div>

            {/* Maintenance Cost */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Lifetime Maintenance Cost
                  </p>

                  <h2 className="mt-4 text-3xl font-bold text-black sm:text-4xl">
                    ₱{summary.maintenanceCost.toLocaleString()}
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Wrench className="text-blue-900" size={22} />
                </div>
              </div>
            </div>

            {/* Health */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Vehicle Health
                  </p>

                  <h2 className="mt-4 text-3xl font-bold text-green-700 sm:text-4xl">
                    {health.score}%
                  </h2>

                  <p className="mt-1 text-base font-bold text-black">
                    {health.health}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                  <Activity className="text-green-700" size={22} />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================
            UNIT INFORMATION
        ========================== */}
        <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                <Car size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-black sm:text-2xl">
                  Unit Information
                </h2>

                <p className="mt-1 text-sm font-medium text-black">
                  Vehicle identity, route and operational status.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">

              {/* QR */}
              <div className="flex shrink-0 flex-col items-center justify-center">
                <div className="rounded-2xl border-2 border-blue-900 bg-white p-3 shadow-sm">
                  <img
                    src={unit.qrCode}
                    className="h-44 w-44 object-contain sm:h-48 sm:w-48"
                    alt={`QR code for unit ${unit.plateNumber}`}
                  />
                </div>

                <p className="mt-3 text-center text-sm font-semibold text-black">
                  Official Vehicle QR Code
                </p>
              </div>

              {/* Vehicle info */}
              <div className="min-w-0 flex-1">

                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-blue-900">
                      Vehicle Identity
                    </p>

                    <h2 className="mt-2 break-words text-2xl font-bold text-black sm:text-3xl lg:text-4xl">
                      Plate No. {unit.plateNumber || "Not Available"}
                    </h2>

                    <p className="mt-2 text-base font-medium text-black">
                      Body Number:{" "}
                      <span className="font-bold text-black">
                        {unit.bodyNumber || "Not Available"}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">

                    <span
                      className={`${availabilityColor} inline-flex rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm`}
                    >
                      {unit.availabilityStatus || "Unknown"}
                    </span>

                    <span
                      className={`${maintenanceColor} inline-flex rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm`}
                    >
                      {unit.maintenanceStatus || "Unknown"}
                    </span>

                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
                      <Car size={19} />
                      Unit Type
                    </div>

                    <p className="break-words text-base font-semibold text-black">
                      {unit.unitType || "Not Available"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
                      <Fuel size={19} />
                      Fuel Type
                    </div>

                    <p className="break-words text-base font-semibold text-black">
                      {unit.fuelType || "Not Available"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
                      <User size={19} />
                      Capacity
                    </div>

                    <p className="break-words text-base font-semibold text-black">
                      {unit.capacity || "Not Available"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
                      <MapPin size={19} />
                      Route
                    </div>

                    <p className="break-words text-base font-semibold text-black">
                      {unit.route || "Not Assigned"}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            REGISTRATION DETAILS
        ========================== */}
        <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                <Calendar size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-black sm:text-2xl">
                  Registration Details
                </h2>

                <p className="mt-1 text-sm font-medium text-black">
                  Vehicle registration and insurance information.
                </p>
              </div>

            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-black">
                  Registration Expiry
                </p>

                <h3 className="mt-3 text-lg font-bold text-black sm:text-xl">
                  {unit.registrationExpiry
                    ? new Date(
                        unit.registrationExpiry
                      ).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not Available"}
                </h3>

                {unit.registrationExpiry && (
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${
                      new Date(unit.registrationExpiry) < new Date()
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {new Date(unit.registrationExpiry) < new Date()
                      ? "Expired"
                      : "Valid"}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-black">
                  Insurance Expiry
                </p>

                <h3 className="mt-3 text-lg font-bold text-black sm:text-xl">
                  {unit.insuranceExpiry
                    ? new Date(
                        unit.insuranceExpiry
                      ).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not Available"}
                </h3>

                {unit.insuranceExpiry && (
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${
                      new Date(unit.insuranceExpiry) < new Date()
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {new Date(unit.insuranceExpiry) < new Date()
                      ? "Expired"
                      : "Valid"}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-black">
                  Date Registered
                </p>

                <h3 className="mt-3 text-lg font-bold text-black sm:text-xl">
                  {unit.createdAt
                    ? new Date(
                        unit.createdAt
                      ).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not Available"}
                </h3>

                <p className="mt-3 text-sm font-medium text-black">
                  Initial system record date
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =========================
            DECISION SUPPORT SYSTEM
        ========================== */}
        {decision && (
          <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                  <Activity size={24} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-black sm:text-2xl">
                    Decision Support System
                  </h2>

                  <p className="mt-1 text-sm font-medium text-black">
                    Vehicle risk and maintenance decision analysis.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">

              {/* DSS Summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Risk Level
                  </p>

                  <h2
                    className={`mt-3 text-3xl font-bold sm:text-4xl ${
                      decision.risk === "Critical"
                        ? "text-red-600"
                        : decision.risk === "High"
                        ? "text-orange-500"
                        : decision.risk === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {decision.risk}
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Priority
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-blue-800 sm:text-4xl">
                    {decision.priority}
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-black">
                    Recommendation
                  </p>

                  <h2 className="mt-3 text-lg font-bold text-black sm:text-xl">
                    {decision.recommendation}
                  </h2>
                </div>

              </div>

              {/* Reasons */}
              <div className="mt-7">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-blue-900" size={22} />
                  <h3 className="text-lg font-bold text-black">
                    Reasons
                  </h3>
                </div>

                <ul className="space-y-3">
                  {decision.reasons.map((reason, index) => (
                    <li
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-base font-medium text-black"
                    >
                      <span className="mr-2 font-bold text-blue-900">
                        ✓
                      </span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <hr className="my-7 border-slate-200" />

              {/* Predicted Next Failure */}
              <div>
                <h3 className="text-xl font-bold text-black sm:text-2xl">
                  Predicted Next Failure
                </h3>

                <p className="mt-1 text-sm font-medium text-black">
                  Decision-support prediction based on the current vehicle
                  maintenance data.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-wide text-black">
                      Likely Component
                    </p>

                    <h2 className="mt-3 break-words text-3xl font-bold text-black sm:text-4xl">
                      {decision.recommendedComponent?.component ||
                        "No Data"}
                    </h2>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-wide text-black">
                      Confidence
                    </p>

                    <h2 className="mt-3 text-3xl font-bold text-black sm:text-4xl">
                      {decision.recommendedComponent?.confidence || 0}%
                    </h2>
                  </div>

                </div>
              </div>

              {/* Prediction Breakdown */}
              <div className="mt-7">
                <p className="mb-4 text-lg font-bold text-black">
                  Prediction Breakdown
                </p>

                <div className="space-y-5">
                  {Object.keys(decision.prediction || {}).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <p className="text-base font-semibold text-black">
                        No prediction data available.
                      </p>
                    </div>
                  ) : (
                    Object.entries(decision.prediction)
                      .sort(
                        (a, b) =>
                          b[1].confidence - a[1].confidence
                      )
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                              <p className="text-base font-bold text-black">
                                {key}
                              </p>

                              <p className="mt-1 text-sm font-medium text-black">
                                Chance of requiring maintenance
                              </p>
                            </div>

                            <span
                              className={`text-xl font-bold ${
                                value.confidence >= 70
                                  ? "text-red-600"
                                  : value.confidence >= 40
                                  ? "text-orange-500"
                                  : "text-green-600"
                              }`}
                            >
                              {value.confidence}%
                            </span>

                          </div>

                          <div className="mt-4">
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-3 rounded-full ${
                                  value.confidence >= 70
                                    ? "bg-red-600"
                                    : value.confidence >= 40
                                    ? "bg-orange-500"
                                    : "bg-green-600"
                                }`}
                                style={{
                                  width: `${value.confidence}%`,
                                }}
                              />
                            </div>

                            <p
                              className={`mt-2 text-sm font-bold ${
                                value.trend === "Increasing"
                                  ? "text-red-600"
                                  : value.trend === "Decreasing"
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {value.trend === "Increasing"
                                ? "⬆ Increasing"
                                : value.trend === "Decreasing"
                                ? "⬇ Decreasing"
                                : "➡ Stable"}
                            </p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* =========================
            MAINTENANCE HISTORY
        ========================== */}
        <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                <Wrench size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-black sm:text-2xl">
                  Maintenance History
                </h2>

                <p className="mt-1 text-sm font-medium text-black">
                  Recorded maintenance issues for this vehicle.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">

            {maintenanceHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Wrench
                  className="mx-auto mb-3 text-slate-700"
                  size={32}
                />

                <p className="text-base font-bold text-black">
                  No maintenance history found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {maintenanceHistory.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div>
                        <h3 className="text-lg font-bold text-black">
                          {item.issueTitle}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-black">
                          {item.issueCategory}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-black">
                        {item.maintenanceStatus}
                      </span>

                    </div>

                    <p className="mt-4 text-base font-medium leading-relaxed text-black">
                      {item.issueDescription}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-black">
                      <Calendar size={17} />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* =========================
            FOOTER
        ========================== */}
        <footer className="border-t border-slate-300 py-8 text-center">
          <p className="text-sm font-medium text-black">
            Powered by{" "}
            <span className="font-bold text-blue-950">
              SAN PEDRO TRANSPORT COOPERATIVE SYSTEM
            </span>
          </p>
        </footer>

      </main>
    </div>
  );
};

export default UnitDashboard;

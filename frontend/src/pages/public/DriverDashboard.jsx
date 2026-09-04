import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Calendar,
  Fuel,
  Wallet,
  Car,
  AlertCircle,
} from "lucide-react";
import { useDriverMaintenanceApi } from "../../lib/driverMaintenanceApi";
import api from "../../lib/axios";

const DriverDashboard = () => {
  const { id } = useParams();

  const params = new URLSearchParams(window.location.search);
  const secret = params.get("secret");

  const { reportIssue } = useDriverMaintenanceApi();

  const [driver, setDriver] = useState(null);
  const [units, setUnits] = useState([]);

  const [reportForm, setReportForm] = useState({
    unit: "",
    issueTitle: "",
    issueCategory: "",
    issueDescription: "",
    priorityLevel: "Medium",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !reportForm.unit ||
      !reportForm.issueTitle.trim() ||
      !reportForm.issueCategory ||
      !reportForm.issueDescription.trim()
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      await reportIssue({
        unit: reportForm.unit,
        issueTitle: reportForm.issueTitle.trim(),
        issueCategory: reportForm.issueCategory,
        issueDescription: reportForm.issueDescription.trim(),
        priorityLevel: reportForm.priorityLevel,
        driverId: driver?._id || id,
        secret,
      });

      setReportForm({
        unit: "",
        issueTitle: "",
        issueCategory: "",
        issueDescription: "",
        priorityLevel: "Medium",
      });

      setMessage("✅ Issue submitted successfully.");
    } catch (err) {
      console.error("REPORT ISSUE ERROR:", err);

      setMessage(
        err?.response?.data?.message || "Failed to submit issue."
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const driverResponse = await fetch(
          `${import.meta.env.VITE_API_URL || "/api"}/drivers/public/${id}${
            secret ? `?secret=${encodeURIComponent(secret)}` : ""
          }`
        );

        const driverData = await driverResponse.json();

        if (!driverResponse.ok) {
          throw new Error(
            driverData?.message || "Failed to load driver information."
          );
        }

        setDriver(driverData.driver);

        const unitsResponse = await api.get("/units/dropdown/public");

        console.log("FULL UNITS RESPONSE:", unitsResponse);
        console.log("UNITS RESPONSE DATA:", unitsResponse.data);

        const unitList = Array.isArray(unitsResponse.data)
          ? unitsResponse.data
          : Array.isArray(unitsResponse.data?.units)
          ? unitsResponse.data.units
          : Array.isArray(unitsResponse.data?.data)
          ? unitsResponse.data.data
          : [];

        console.log("FINAL UNIT LIST:", unitList);

        setUnits(unitList);
      } catch (error) {
        console.error("DASHBOARD LOAD ERROR:", error);
        setUnits([]);
      }
    };

    loadDashboardData();
  }, [id, secret]);

  if (!driver) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-blue-900"></span>
          <p className="text-base font-semibold text-black">
            Loading driver information...
          </p>
        </div>
      </div>
    );
  }

  const statusColor =
    driver.status === "Active"
      ? "bg-emerald-600"
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
          Driver Information Portal
        </p>
      </div>

    </div>
  </div>
</header>
      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className="w-full px-3 py-6 sm:px-5 md:px-8 lg:px-10 xl:px-14 space-y-6">

        {/* =========================
            PROFILE
        ========================== */}
        <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2">
              <User className="text-blue-900" size={22} />
              <h2 className="text-base font-bold uppercase tracking-wide text-black">
                Driver Profile
              </h2>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-start lg:gap-8">

              <div className="flex justify-center md:justify-start">
                <img
                  src={
                    driver.profileImage
                      ? `${(import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "")}/${driver.profileImage}`
                      : "https://placehold.co/250x250?text=Driver"
                  }
                  className="h-40 w-40 shrink-0 rounded-2xl border-4 border-blue-900 object-cover shadow-md sm:h-48 sm:w-48 lg:h-52 lg:w-52"
                  alt="Driver"
                />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-1 text-sm font-bold uppercase tracking-wider text-black">
                      Driver Name
                    </p>

                    <h2 className="break-words text-2xl font-bold leading-tight text-black sm:text-3xl lg:text-4xl">
                      {driver.firstName}{" "}
                      {driver.middleName}{" "}
                      {driver.lastName}
                    </h2>
                  </div>

                  <span
                    className={`${statusColor} inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm`}
                  >
                    <BadgeCheck size={19} />
                    {driver.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                      <Car size={19} />
                      License Number
                    </div>
                    <p className="text-base font-semibold text-black break-words">
                      {driver.licenseNumber || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                      <Phone size={19} />
                      Contact Number
                    </div>
                    <p className="text-base font-semibold text-black break-words">
                      {driver.phone || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                      <Mail size={19} />
                      Email
                    </div>
                    <p className="break-all text-base font-semibold text-black">
                      {driver.email || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                      <MapPin size={19} />
                      Address
                    </div>
                    <p className="text-base font-semibold text-black break-words">
                      {driver.address || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                      <User size={19} />
                      License Type
                    </div>
                    <p className="text-base font-semibold text-black break-words">
                      {driver.licenseType || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-950">
                      <Calendar size={19} />
                      License Expiry
                    </div>

                    <p className="text-base font-semibold text-black">
                      {driver.licenseExpiry
                        ? new Date(
                            driver.licenseExpiry
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            STATISTICS
        ========================== */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide text-black">
              Driver Statistics
            </h2>
            <p className="mt-1 text-sm font-medium text-black">
              Lifetime operational performance and activity summary.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-950">        
                  Lifetime Fuel Cost
                </p>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Wallet className="text-blue-900" size={22} />
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-black">
                ₱
                {Number(
                  driver.totalLifetimeFuelCost || 0
                ).toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-950">
                  Diesel Consumption
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Fuel className="text-blue-900" size={22} />
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-black">
                {driver.totalLifetimeDieselConsumption || 0} L
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-950">
                  Lifetime Remittance
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Wallet className="text-blue-900" size={22} />
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-black">
                ₱
                {Number(
                  driver.totalLifetimeRemit || 0
                ).toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-950">
                  Registered
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Calendar className="text-blue-900" size={22} />
                </div>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-black">
                {driver.createdAt
                  ? new Date(
                      driver.createdAt
                    ).toLocaleDateString()
                  : "-"}
              </h2>
            </div>

          </div>
        </section>

        {/* =========================
            EMERGENCY CONTACT
        ========================== */}
        <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-blue-900" size={23} />
              <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                Emergency Contact
              </h2>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-sm font-bold uppercase tracking-wide text-black">
                  Name
                </p>

                <h3 className="text-lg font-bold text-black">
                  {driver.emergencyContact?.name || "N/A"}
                </h3>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-sm font-bold uppercase tracking-wide text-black">
                  Relationship
                </p>

                <h3 className="text-lg font-bold text-black">
                  {driver.emergencyContact?.relationship || "N/A"}
                </h3>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-sm font-bold uppercase tracking-wide text-black">
                  Contact Number
                </p>

                <h3 className="text-lg font-bold text-black">
                  {driver.emergencyContact?.phone || "N/A"}
                </h3>
              </div>

            </div>
          </div>
        </section>

        {/* =========================
            VEHICLE ISSUE REPORTING
        ========================== */}
        <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                Vehicle Issue Reporting
              </h2>

              <p className="mt-1 text-sm font-medium text-black">
                Report any vehicle issue directly to the maintenance team.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7">

            <form
              onSubmit={handleSubmitReport}
              className="grid grid-cols-1 gap-5 lg:grid-cols-2"
            >

              {/* Unit */}
              <div className="w-full">
                <label
                  htmlFor="unit"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-black"
                >
                  Unit
                </label>

                <select
                  id="unit"
                  value={reportForm.unit}
                  onChange={(e) =>
                    setReportForm((previous) => ({
                      ...previous,
                      unit: e.target.value,
                    }))
                  }
                  disabled={units.length === 0}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">
                    {units.length === 0
                      ? "No units available"
                      : "Select Unit"}
                  </option>

                  {units.map((unit) => (
                    <option
                      key={unit._id || unit.id}
                      value={unit._id || unit.id}
                    >
                      {unit.plateNumber ||
                        unit.bodyNumber ||
                        unit.name ||
                        "Unnamed Unit"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Title */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-black">
                  Issue Title
                </label>

                <input
                  type="text"
                  placeholder="Enter issue title"
                  value={reportForm.issueTitle}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      issueTitle: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black placeholder:text-black shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-black">
                  Issue Category
                </label>

                <select
                  value={reportForm.issueCategory}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      issueCategory: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">
                    Select Issue Category
                  </option>

                  <option>Engine</option>
                  <option>Transmission</option>
                  <option>Brakes</option>
                  <option>Electrical</option>
                  <option>Suspension</option>
                  <option>Tires</option>
                  <option>Battery</option>
                  <option>Air Conditioning</option>
                  <option>Fuel System</option>
                  <option>Others</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-black">
                  Priority Level
                </label>

                <select
                  value={reportForm.priorityLevel}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      priorityLevel: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-black">
                  Issue Description
                </label>

                <textarea
                  rows={6}
                  placeholder="Describe the issue..."
                  value={reportForm.issueDescription}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      issueDescription: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black placeholder:text-black shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-blue-700 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-blue-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Report"}
                </button>

                {message && (
                  <p className="text-base font-semibold text-black">
                    {message}
                  </p>
                )}
              </div>

            </form>
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

export default DriverDashboard;

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRemittanceApi } from "../../lib/remittanceApi";
import { AlertCircle, CheckCircle, RefreshCw, Search } from "lucide-react";
import { useDriverApi } from "../../lib/driverApi";
import { useUnitApi } from "../../lib/unitApi";

const PAGE_SIZE = 10;

const NegativeBalanceBadge = () => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-sm font-semibold border border-red-200 ml-2">
    <AlertCircle className="mr-1 size-4" />
    Negative Balance
  </span>
);

const RemittanceTable = ({
  remittances,
  loading,
  error,
  onVerify,
  page,
  totalPages,
  onPageChange,
}) => (
  <div className="overflow-x-auto bg-white border border-slate-200/60 rounded-xl shadow-sm mt-4">
    <table className="min-w-full table-auto border-collapse text-left">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200/60">
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            #
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Date
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Driver
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Unit
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Route
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Boundary
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Fuel Liters
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Fuel Cost
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Odometer In
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Odometer Out
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Station
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Shift
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider">
            Status
          </th>
          <th className="px-5 py-3 text-xs font-bold text-black uppercase tracking-wider text-right">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan={14} className="p-0">
              <div className="animate-pulse space-y-3.5 p-5 bg-white">
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
              </div>
            </td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={14} className="p-5">
              <div className="bg-rose-50 border border-rose-200/60 text-rose-700 rounded-lg p-6 text-center text-sm font-semibold">
                {error}
              </div>
            </td>
          </tr>
        ) : remittances.length === 0 ? (
          <tr>
            <td colSpan={14} className="px-5 py-16">
              <div className="min-h-[320px] w-full flex items-center justify-center">
                <div className="text-center w-full max-w-5xl px-8">
                  <h3 className="text-3xl md:text-4xl font-black text-black uppercase tracking-wider">
                    No Remittances
                  </h3>

                  <p className="mt-4 text-lg md:text-xl font-medium text-black leading-relaxed">
                    There are no remittance records matching your filters.
                  </p>
                </div>
              </div>
            </td>
          </tr>
        ) : (
          remittances.map((r, idx) => (
            <tr
              key={r._id}
              className="border-b border-slate-100 hover:bg-slate-50/55 transition-colors duration-150 odd:bg-white even:bg-slate-50/20"
            >
              <td className="px-5 py-3.5 text-sm text-black">
                {(page - 1) * PAGE_SIZE + idx + 1}
              </td>

              {/* DATE */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.transactionDate
                  ? new Date(r.transactionDate).toLocaleDateString()
                  : "-"}
              </td>

              {/* DRIVER */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.driver
                  ? `${r.driver.firstName} ${r.driver.lastName}`
                  : "-"}
              </td>

              {/* UNIT */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.unit?.plateNumber || "-"}
              </td>

              {/* ROUTE */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.route || "-"}
              </td>

              {/* BOUNDARY */}
              <td className="px-5 py-3.5 text-sm font-bold text-black">
                ₱{r.totalBoundary ?? 0}
              </td>

              {/* FUEL LITERS */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.fuelLiters ?? 0}
              </td>

              {/* FUEL COST */}
              <td className="px-5 py-3.5 text-sm text-black">
                ₱{r.fuelCost ?? 0}
              </td>

              {/* ODOMETER IN */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.odometerIn ?? "-"}
              </td>

              {/* ODOMETER OUT */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.odometerOut ?? "-"}
              </td>

              {/* STATION */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.station ?? "-"}
              </td>

              {/* SHIFT */}
              <td className="px-5 py-3.5 text-sm text-black">
                {r.shift ?? "-"}
              </td>

              {/* STATUS */}
              <td className="px-5 py-3.5 text-sm text-black font-medium">
                {r.verificationStatus}
              </td>

              {/* ACTIONS */}
              <td className="px-5 py-3.5 text-right">
                {r.verificationStatus !== "Verified" && (
                  <button
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-150"
                    onClick={() => onVerify(r._id)}
                  >
                    Verify
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    {/* Pagination */}
    <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100 bg-slate-50/50">
      <div className="text-sm font-semibold text-black">
        Page {page} of {totalPages || 1}
      </div>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 text-sm font-semibold border rounded-lg transition-all duration-150 shadow-sm bg-white border-slate-200/80 text-black hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Prev
        </button>

        <button
          className="px-4 py-2 text-sm font-semibold border rounded-lg transition-all duration-150 shadow-sm bg-white border-slate-200/80 text-black hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </div>
  </div>
);

const RemittanceFormModal = ({
  open,
  onClose,
  onSubmit,
  loading,
  drivers,
  units,
  fuelTransaction,
}) => {
  const [form, setForm] = useState({
    driver: "",
    unit: "",
    route: "",
    amount: "",
    transactionDate: "",
  });

  useEffect(() => {
    if (fuelTransaction) {
      setForm({
        driver: fuelTransaction.driver?._id || "",
        unit: fuelTransaction.unit?._id || "",
        route: fuelTransaction.route || "",
        amount: fuelTransaction.totalRemit || "",
        transactionDate: fuelTransaction.transactionDate
          ? fuelTransaction.transactionDate.substring(0, 10)
          : "",
      });
    }
  }, [fuelTransaction]);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.driver ||
      !form.unit ||
      !form.route ||
      !form.amount ||
      !form.transactionDate
    ) {
      setError("All fields are required.");
      return;
    }

    setError("");
    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          className="absolute top-4 right-4 text-black hover:text-slate-700 text-2xl font-bold transition-colors"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">
          Create Remittance
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-1">
              Driver ID
            </label>

            <select
              name="driver"
              value={form.driver}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Select Driver</option>

              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-1">
              Unit ID
            </label>

            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Select Unit</option>

              {units.map((unit) => (
                <option key={unit._id} value={unit._id}>
                  {unit.bodyNumber}
                </option>
              ))}
            </select>

            <div className="mt-4">
              <label className="block text-sm font-bold text-black uppercase tracking-wider mb-1">
                Route
              </label>

              <select
                name="route"
                value={form.route}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Route</option>
                <option value="Langgam">Langgam</option>
                <option value="Villarosa">Villarosa</option>
                <option value="Bayan-Bayanan">Bayan-Bayanan</option>
                <option value="Estrella">Estrella</option>
                <option value="Calamba">Calamba</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-1">
              Amount
            </label>

            <input
              name="amount"
              type="number"
              className="w-full border border-slate-200/80 rounded-lg px-3 py-2.5 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black uppercase tracking-wider mb-1">
              Transaction Date
            </label>

            <input
              name="transactionDate"
              type="date"
              className="w-full border border-slate-200/80 rounded-lg px-3 py-2.5 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150"
              value={form.transactionDate}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="text-rose-700 bg-rose-50 border border-rose-200/60 rounded-lg p-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 active:scale-95 hover:shadow-md mt-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
};

const RemittanceMonitoringPage = () => {
  const location = useLocation();
  const fuelTransaction = location.state?.fuelTransaction;

  const { getDriversDropdown } = useDriverApi();
  const { getUnits } = useUnitApi();

  const [drivers, setDrivers] = useState([]);
  const [units, setUnits] = useState([]);

  const {
    getRemittances,
    createRemittance,
    verifyRemittance,
  } = useRemittanceApi();

  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    status: "",
    negative: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (fuelTransaction) {
      setShowForm(true);
    }
  }, [fuelTransaction]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const driverRes = await getDriversDropdown();

      const unitRes = await getUnits({
        page: 1,
        limit: 1000,
      });

      setDrivers(driverRes.drivers || []);
      setUnits(unitRes.units || []);
    } catch (err) {
      console.log(err);
    }
  };

  const visibleRemittances = useMemo(() => {
    const q = search.trim().toLowerCase();

    return remittances.filter((r) => {
      const driverName =
        `${r.driver?.firstName || ""} ${r.driver?.lastName || ""}`.toLowerCase();

      const unitText =
        `${r.unit?.plateNumber || ""} ${r.unit?.bodyNumber || ""}`.toLowerCase();

      const routeText =
        `${r.route || ""}`.toLowerCase();

      const stationText =
        `${r.station || ""}`.toLowerCase();

      const receiptText =
        `${r.receiptNumber || ""}`.toLowerCase();

      const statusText =
        `${r.verificationStatus || ""}`.toLowerCase();

      const matchesSearch =
        !q ||
        driverName.includes(q) ||
        unitText.includes(q) ||
        routeText.includes(q) ||
        stationText.includes(q) ||
        receiptText.includes(q) ||
        statusText.includes(q);

      const matchesStatus =
        !filter.status
          ? true
          : (r.verificationStatus || "").toLowerCase() ===
            filter.status.toLowerCase();

      const balanceValue = Number(
        r.balance ??
        r.remainingBalance ??
        r.netBalance ??
        (
          Number(r.totalBoundary || 0) -
          Number(r.fuelCost || 0)
        )
      );

      const isNegativeBalance =
        balanceValue < 0;

      const matchesNegative =
        !filter.negative
          ? true
          : filter.negative === "true"
            ? isNegativeBalance
            : true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesNegative
      );
    });
  }, [remittances, search, filter]);

  const fetchRemittances = async () => {
    setLoading(true);
    setError("");

    try {
      const normalizedStatus =
        filter.status === "pending"
          ? "Pending"
          : filter.status === "verified"
          ? "Verified"
          : "";

      const params = {
        page,
        limit: PAGE_SIZE,
        search: search.trim(),
        status: normalizedStatus,
        verificationStatus: normalizedStatus,
        negative: filter.negative,
      };

      const res = await getRemittances(params);

      setRemittances(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Failed to load remittances."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchRemittances();
    })();

    // eslint-disable-next-line
  }, [page, search, filter]);

  const handleVerify = async (id) => {
    if (!window.confirm("Verify this remittance?")) {
      return;
    }

    try {
      await verifyRemittance(id);
      fetchRemittances();
    } catch {
      alert("Verification failed.");
    }
  };

  const handleCreate = async (form) => {
    setCreating(true);

    try {
      await createRemittance({
        ...form,
        fuelTransaction: fuelTransaction?._id,
      });

      setShowForm(false);
      fetchRemittances();
    } catch {
      alert("Failed to create remittance.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 text-black">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
            Remittance Monitoring
          </h1>

          <p className="text-sm font-medium text-black mt-1">
            Track cooperative daily remittance records, driver payments, and verification status.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center border border-slate-200/80 rounded-lg px-3 py-2 bg-white text-black shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-150">
          <Search className="text-black mr-2 size-4" />

          <input
            className="outline-none bg-transparent w-52 text-sm text-black placeholder:text-black"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="border border-slate-200/80 rounded-lg px-3 py-2 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 min-w-[150px]"
          value={filter.status}
          onChange={(e) => {
            setFilter((f) => ({
              ...f,
              status: e.target.value,
            }));
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
        </select>

        <select
          className="border border-slate-200/80 rounded-lg px-3 py-2 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 min-w-[150px]"
          value={filter.negative}
          onChange={(e) => {
            setFilter((f) => ({
              ...f,
              negative: e.target.value,
            }));
            setPage(1);
          }}
        >
          <option value="">All Balances</option>
          <option value="true">Negative Only</option>
        </select>
      </div>

      {/* Table */}
      <RemittanceTable
        remittances={visibleRemittances}
        loading={loading}
        error={error}
        onVerify={handleVerify}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Create Modal */}
      <RemittanceFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        loading={creating}
        drivers={drivers}
        units={units}
        fuelTransaction={fuelTransaction}
      />
    </div>
  );
};

export default RemittanceMonitoringPage;
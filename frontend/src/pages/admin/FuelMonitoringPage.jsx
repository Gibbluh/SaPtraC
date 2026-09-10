import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFuelApi } from "../../lib/fuelApi";
import QRScanner from "../../components/fuel/QRScanner";
import FuelAlertNotification from "../../components/fuel/FuelAlertNotification";
import useAuth from "../../lib/useAuth";
import toast from "react-hot-toast";
import { useDriverApi } from "../../lib/driverApi";
import { useUnitApi } from "../../lib/unitApi";
import FuelReceiptOCRScanner from "../../components/fuel/FuelReceiptOCRScanner";
import {
  Calendar,
  Search,
  Wallet,
  Receipt,
  TriangleAlert,
  Fuel,
  FileText,
  UserRound,
  Truck,
  Route,
  Gauge,
  Eye,
  X,
  QrCode,
  Clock3,
  Camera,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

const shiftTypes = [
  "First Shift",
  "Second Shift",
];

/*
 * =========================================================
 * ANOMALY BADGE
 * =========================================================
 */
const AnomalyBadge = ({ detected, reason }) =>
  detected ? (
    <span
      className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700"
      title={reason || "Anomaly detected"}
    >
      <span className="mr-2 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
      Anomaly
    </span>
  ) : null;

/*
 * =========================================================
 * SEARCHABLE DROPDOWN
 * =========================================================
 *
 * UI-only reusable searchable dropdown.
 * The selected value remains the actual backend _id.
 *
 * =========================================================
 */
const SearchableDropdown = ({
  label,
  value,
  options = [],
  onChange,
  placeholder,
  searchPlaceholder,
  getOptionLabel,
  icon: Icon,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = options.find(
    (option) => option._id === value
  );

  useEffect(() => {
    if (selectedOption) {
      setQuery(getOptionLabel(selectedOption));
    } else {
      setQuery("");
    }
  }, [value, options]);

  const filteredOptions = options.filter(
    (option) =>
      getOptionLabel(option)
        .toLowerCase()
        .includes(query.trim().toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option._id);
    setQuery(getOptionLabel(option));
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-blue-950"
          />
        )}

        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);

            if (!e.target.value.trim()) {
              onChange("");
            }
          }}
          className={`${inputClass} ${
            Icon ? "pl-10" : ""
          } pr-10`}
          autoComplete="off"
        />

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-black transition hover:bg-slate-100"
          aria-label={`Open ${label} dropdown`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6 9 6 6 6-6"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="sticky top-0 border-b border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-xs font-semibold text-black">
              {searchPlaceholder}
            </p>
          </div>

          {filteredOptions.length === 0 ? (
            <div className="px-4 py-4 text-sm font-medium text-black">
              No matching results.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option._id}
                type="button"
                onClick={() => handleSelect(option)}
                className={`block w-full px-4 py-3 text-left text-sm font-semibold text-black transition hover:bg-blue-50 ${
                  option._id === value
                    ? "bg-blue-50 text-blue-950"
                    : ""
                }`}
              >
                {getOptionLabel(option)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/*
 * =========================================================
 * FUEL MONITORING PAGE
 * =========================================================
 */
const FuelMonitoringPage = () => {
  const [selectedQR, setSelectedQR] =
    useState(null);

  const navigate = useNavigate();

  const {
    getFuelTransactions,
    createFuelTransaction,
    getFuelAnalytics,
    getDailyFuelReceiptHistory,
  } = useFuelApi();

  const { user } = useAuth();

  const { getDrivers } = useDriverApi();
  const { getUnits } = useUnitApi();

  // ========================================================
  // TABLE STATE
  // ========================================================

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [transactions, setTransactions] =
    useState([]);

  const [selectedReceipt, setSelectedReceipt] =
    useState(null);

  const [dailyReceipts, setDailyReceipts] =
    useState([]);

  const [analytics, setAnalytics] =
    useState({
      totalFuelCost: 0,
      totalFuelLiters: 0,
      totalTransactions: 0,
      totalAnomalies: 0,
      averageFuelCost: 0,
      averageFuelLiters: 0,
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(10);

  const [total, setTotal] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState({});

  // ========================================================
  // FORM STATE
  // ========================================================

  const [form, setForm] =
    useState({
      driver: "",
      unit: "",
      route: "",
      totalBoundary: "",
      pilaTrips: "",
      salubongTrips: "",
      receiptNumber: "",
      qrCodeData: "",
      fuelLiters: "",
      fuelCost: "",
      odometerIn: "",
      odometerOut: "",
      fuelStation: "",
      shiftType: "First Shift",
      transactionDate: "",
      remarks: "",
    });

  const [formLoading, setFormLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [showQR, setShowQR] =
    useState(null);

  const [drivers, setDrivers] =
    useState([]);

  const [units, setUnits] =
    useState([]);

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [odometerAutoFilled, setOdometerAutoFilled] =
    useState(false);

  const [showReceiptOCR, setShowReceiptOCR] =
    useState(false);

  // ========================================================
  // FETCH TRANSACTIONS
  // ========================================================

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit,
          search,
          ...filter,
        };

        const res =
          await getFuelTransactions(params);

        console.log(
          "FUEL API RESPONSE:",
          res
        );

        setTransactions(
          res?.transactions ||
            res?.data?.transactions ||
            []
        );

        setTotal(
          res?.total ||
            res?.data?.total ||
            0
        );

        const analyticsRes =
          await getFuelAnalytics();

        setAnalytics(
          analyticsRes.analytics ||
            analyticsRes
        );

        const receiptRes =
          await getDailyFuelReceiptHistory();

        setDailyReceipts(
          receiptRes.receipts || []
        );

        console.log(
          "===== RECEIPT RESPONSE ====="
        );

        console.log(receiptRes);

        setDailyReceipts(
          receiptRes.receipts || []
        );

        console.log(
          "===== DAILY RECEIPTS ====="
        );

        console.log(
          dailyReceipts.map((r) => ({
            receiptNumber:
              r.receiptNumber,
            date: r.date,
          }))
        );

        console.log(
          "===== TRANSACTIONS ====="
        );

        console.log(
          transactions.map((tx) => ({
            receipt:
              tx.receiptNumber,
            transactionDate:
              tx.transactionDate,
            receiptNumber:
              tx.receipt?.receiptNumber,
            dailyReceipt:
              tx.dailyReceipt,
          }))
        );
      } catch (err) {
        setError(
          err?.message ||
            "Failed to load fuel transactions"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // eslint-disable-next-line
  }, [
    page,
    limit,
    search,
    filter,
  ]);

  // ========================================================
  // HANDLE FORM INPUT
  // ========================================================

  const handleFormChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================================
// HANDLE RECEIPT OCR RESULT
// ========================================================
//
// OCR only fills the existing form fields.
// It does NOT submit the transaction.
// Existing submit/backend logic remains intact.
// ========================================================

const handleReceiptOCRExtract = ({
  fuelStation,
  fuelLiters,
  fuelCost,
}) => {
  setForm((prev) => ({
    ...prev,

    fuelStation:
      fuelStation || prev.fuelStation,

    fuelLiters:
      fuelLiters || prev.fuelLiters,

    fuelCost:
      fuelCost || prev.fuelCost,
  }));
};

  // ========================================================
  // LOAD DROPDOWNS
  // ========================================================

  useEffect(() => {
    const loadDropdowns =
      async () => {
        try {
          const driverRes =
            await getDrivers();

          const unitRes =
            await getUnits();

          setDrivers(
            driverRes?.drivers ||
              driverRes?.data?.drivers ||
              driverRes?.data ||
              []
          );

          setUnits(
            unitRes?.units ||
              unitRes?.data?.units ||
              unitRes?.data ||
              []
          );
        } catch (err) {
          console.error(
            "Failed loading dropdown data",
            err
          );
        }
      };

    loadDropdowns();
  }, []);

  // ========================================================
  // HANDLE UNIT SELECTION
  // ========================================================
  // Automatically fills the unit's designated route and
  // the latest Odometer Out for that exact unit as Odometer In.
  // The existing transaction payload and backend logic remain unchanged.
  // ========================================================

  const handleUnitSelection = async (unitId, qrCodeData = "") => {
    const selectedUnit = units.find(
      (unit) => unit._id === unitId
    );

    setForm((prev) => ({
      ...prev,
      unit: unitId,
      route: selectedUnit?.route || "",
      odometerIn: "",
      qrCodeData: qrCodeData || prev.qrCodeData || "",
    }));

    setOdometerAutoFilled(false);

    if (!unitId) return;

    try {
      const response = await getFuelTransactions({
        unit: unitId,
        page: 1,
        limit: 100,
      });

      const unitTransactions =
        response?.transactions ||
        response?.data?.transactions ||
        [];

      const latestWithOdometerOut =
        [...unitTransactions]
          .sort(
            (a, b) =>
              new Date(b.transactionDate).getTime() -
              new Date(a.transactionDate).getTime()
          )
          .find(
            (transaction) =>
              transaction.odometerOut !== undefined &&
              transaction.odometerOut !== null &&
              transaction.odometerOut !== ""
          );

      setForm((prev) => {
        if (prev.unit !== unitId) return prev;

        return {
          ...prev,
          odometerIn: latestWithOdometerOut
            ? String(latestWithOdometerOut.odometerOut)
            : "",
        };
      });

      if (latestWithOdometerOut) {
        setOdometerAutoFilled(true);
      }
    } catch (err) {
      console.error(
        "Failed to load latest odometer for selected unit:",
        err
      );
      setOdometerAutoFilled(false);
    }
  };

  // ========================================================
  // HANDLE QR SCAN
  // ========================================================

  const handleQRSuccess = async (data) => {
    if (
      showQR === "driver"
    ) {
      setForm((prev) => ({
        ...prev,
        driver: data._id,
        qrCodeData:
          data.qrCodeData || "",
      }));
    } else if (
      showQR === "unit"
    ) {
      await handleUnitSelection(
        data._id,
        data.qrCodeData || ""
      );
    }

    setShowQR(null);
  };

  // ========================================================
  // HANDLE FORM SUBMIT
  // ========================================================

  const handleFormSubmit = async (e) => {
  e.preventDefault();

  setFormLoading(true);
  setFormError("");

  try {
    const payload = {
      ...form,
      route: form.route,
      totalBoundary: Number(form.totalBoundary),
      pilaTrips: Number(form.pilaTrips),
      salubongTrips: Number(form.salubongTrips),
      receiptNumber: form.receiptNumber,
      fuelLiters: Number(form.fuelLiters),
      fuelCost: Number(form.fuelCost),
      odometerIn: Number(form.odometerIn),
      odometerOut: form.odometerOut
        ? Number(form.odometerOut)
        : undefined,
      transactionDate: form.transactionDate,
    };

    await createFuelTransaction(payload);

    toast.success("Fuel transaction created");

    setForm({
      driver: "",
      unit: "",
      route: "",
      totalBoundary: "",
      pilaTrips: "",
      salubongTrips: "",
      receiptNumber: "",
      qrCodeData: "",
      fuelLiters: "",
      fuelCost: "",
      odometerIn: "",
      odometerOut: "",
      fuelStation: "",
      shiftType: "First Shift",
      transactionDate: "",
      remarks: "",
    });

    setOdometerAutoFilled(false);

    // Reset to first page
    setPage(1);

    /*
     * =====================================================
     * REFRESH TRANSACTIONS
     * =====================================================
     */
    const res = await getFuelTransactions({
      page: 1,
      limit,
      search,
      ...filter,
    });

    console.log("REFRESH RESPONSE:", res);

    setTransactions(
      res?.transactions ||
        res?.data?.transactions ||
        []
    );

    setTotal(
      res?.total ||
        res?.data?.total ||
        0
    );

    /*
     * =====================================================
     * REFRESH DAILY RECEIPTS
     * =====================================================
     *
     * This is the important part.
     * Fuel Transaction History uses dailyReceipts,
     * so it must also be refreshed after creating
     * a transaction.
     */
    const receiptRes =
      await getDailyFuelReceiptHistory();

    console.log(
      "REFRESHED RECEIPT RESPONSE:",
      receiptRes
    );

    setDailyReceipts(
      receiptRes?.receipts || []
    );

    /*
     * =====================================================
     * REFRESH ANALYTICS
     * =====================================================
     *
     * Keeps the KPI cards updated immediately.
     */
    const analyticsRes =
      await getFuelAnalytics();

    setAnalytics(
      analyticsRes?.analytics ||
        analyticsRes
    );

    // Close modal after successful submission
    setIsModalOpen(false);

  } catch (err) {
    console.error(
      "CREATE FUEL TRANSACTION ERROR:",
      err
    );

    setFormError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to create transaction"
    );
  } finally {
    setFormLoading(false);
  }
};

  // ========================================================
  // PAGINATION
  // ========================================================

  const totalPages =
    Math.ceil(
      total / limit
    );

  // ========================================================
  // SORTED RECEIPTS
  // ========================================================
  //
  // Latest/recent date first.
  // This changes display order only.
  //
  // ========================================================

  const displayedReceipts = (
    search.trim()
      ? dailyReceipts.filter(
          (receipt) =>
            transactions.some(
              (tx) => {
                const txDate =
                  new Date(
                    tx.transactionDate
                  );

                const rDate =
                  new Date(
                    receipt.date
                  );

                return (
                  txDate.getFullYear() ===
                    rDate.getFullYear() &&
                  txDate.getMonth() ===
                    rDate.getMonth() &&
                  txDate.getDate() ===
                    rDate.getDate()
                );
              }
            )
        )
      : [...dailyReceipts]
  ).sort(
    (a, b) =>
      new Date(
        b.date
      ).getTime() -
      new Date(
        a.date
      ).getTime()
  );

  // ========================================================
  // SORTED DRIVERS A-Z
  // ========================================================

  const sortedDrivers = [
    ...drivers,
  ].sort((a, b) => {
    const nameA =
      `${a.firstName || ""} ${
        a.lastName || ""
      }`
        .trim()
        .toLowerCase();

    const nameB =
      `${b.firstName || ""} ${
        b.lastName || ""
      }`
        .trim()
        .toLowerCase();

    return nameA.localeCompare(
      nameB
    );
  });

  // ========================================================
  // SORTED UNITS A-Z
  // ========================================================

  const sortedUnits = [
    ...units,
  ].sort((a, b) => {
    const nameA = String(
      a.bodyNumber ||
        a.plateNumber ||
        ""
    ).toLowerCase();

    const nameB = String(
      b.bodyNumber ||
        b.plateNumber ||
        ""
    ).toLowerCase();

    return nameA.localeCompare(
      nameB,
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );
  });

  const selectedUnit = units.find(
    (unit) => unit._id === form.unit
  );

  // ========================================================
  // FORMATTERS
  // ========================================================

  const formatCurrency = (
    value
  ) =>
    Number(
      value || 0
    ).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );

  const formatDate = (
    value
  ) =>
    value
      ? new Date(
          value
        ).toLocaleDateString(
          "en-PH",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        )
      : "-";

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-black md:p-8">

      <FuelAlertNotification
        user={user}
        role={user?.role}
      />

      {/* =====================================================
          TOP KPI CARDS
      ====================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL FUEL COST */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-black">
                Total Fuel Cost
              </p>

              <h2 className="mt-3 text-3xl font-extrabold text-blue-950 md:text-4xl">
                ₱
                {formatCurrency(
                  analytics.totalFuelCost
                )}
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-950">
             <Wallet className="text-blue-900" size={22} />
            </div>
          </div>
        </div>

        {/* TOTAL FUEL LITERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-black">
                Total Fuel Liters
              </p>

              <h2 className="mt-3 text-3xl font-extrabold text-blue-950 md:text-4xl">
                {formatCurrency(
                  analytics.totalFuelLiters
                )}{" "}
                L
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
              <Fuel className="text-blue-900" size={22} />
            </div>
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-black">
                Transactions
              </p>

              <h2 className="mt-3 text-3xl font-extrabold text-blue-950 md:text-4xl">
                {
                  analytics.totalTransactions
                }
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-blue-950">
              <Wallet className="text-blue-900" size={22} />
            </div>
          </div>
        </div>

        {/* ANOMALIES */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-black">
                Anomalies
              </p>

              <h2 className="mt-3 text-3xl font-extrabold text-blue-950 md:text-4xl">
                {
                  analytics.totalAnomalies
                }
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-800">
              <TriangleAlert
                size={21}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      {/* =====================================================
          CONTROLS
      ====================================================== */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-3">

            <p className="text-sm font-medium text-black">
              Search and filter fuel transactions.
            </p>
          </div>

     

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <form
            className="flex flex-1 flex-col gap-3 md:flex-row md:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
            }}
          >

            <div className="relative flex-1">

              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black"
              />

              <input
                type="text"
                placeholder="Search by driver/unit/station..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-black shadow-sm outline-none placeholder:text-black focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </div>

            <select
              className="min-h-[48px] min-w-[170px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              value={
                filter.shiftType ||
                ""
              }
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  shiftType:
                    e.target.value ||
                    undefined,
                }))
              }
            >
              <option value="">
                All Shifts
              </option>

              {shiftTypes.map(
                (s) => (
                  <option
                    key={s}
                    value={s}
                  >
                    {s}
                  </option>
                )
              )}
            </select>

            <button
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
              type="submit"
            >
              <Search
                size={18}
              />
              Search
            </button>

          </form>

          <button
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-95"
            onClick={() =>
              setIsModalOpen(
                true
              )
            }
          >

            + New Transaction
          </button>

        </div>
      </div>

      {/* =====================================================
          HISTORY
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-5">

          <div className="flex items-center gap-3">
           
            <div>
              <h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
                Fuel Transaction History
              </h2>

              <p className="mt-0.5 text-sm font-medium text-black">
                Most recent receipt first
              </p>
            </div>

          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full table-auto border-collapse text-left">

            <thead>
              <tr className="border-b border-slate-200 bg-white">

                <th className="px-5 py-4 text-sm font-extrabold uppercase tracking-wider text-black">
                  Date
                </th>

                <th className="px-5 py-4 text-sm font-extrabold uppercase tracking-wider text-black">
                  Receipt
                </th>

                <th className="px-5 py-4 text-sm font-extrabold uppercase tracking-wider text-black">
                  QR Code
                </th>

                <th className="px-5 py-4 text-sm font-extrabold uppercase tracking-wider text-black">
                  Details
                </th>

              </tr>
            </thead>

            <tbody>

              {displayedReceipts.length ===
              0 ? (
                <tr>

                  <td
                    colSpan={4}
                    className="py-16 text-center text-base font-semibold text-black"
                  >
                    <div className="flex flex-col items-center">

              
                      <p className="text-lg font-extrabold">
                        No Daily Receipts
                      </p>

                      <p className="mt-1 text-sm font-medium text-black">
                        No fuel receipt records were found.
                      </p>

                    </div>
                  </td>

                </tr>
              ) : (
                displayedReceipts.map(
                  (
                    receipt
                  ) => (
                    <tr
                      key={
                        receipt.receiptNumber
                      }
                      className="border-b border-slate-100 bg-white transition hover:bg-blue-50/50"
                    >

                      <td className="px-5 py-4 text-base font-semibold text-black">
                        <div className="flex items-center gap-2">

                          <Calendar
                            size={16}
                            className="text-blue-950"
                          />

                          {new Date(
                            receipt.date
                          ).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-base font-semibold text-black">
                        {receipt.receiptNumber}
                      </td>

                      <td className="px-5 py-4">

                        <img
                          src={
                            receipt.dailyQrImage
                          }
                          alt="Daily QR"
                          onClick={() =>
                            setSelectedQR(
                              receipt.dailyQrImage
                            )
                          }
                          className="h-12 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 shadow-sm transition hover:scale-105"
                        />

                      </td>

                      <td className="px-5 py-4">

                        <button
                          onClick={() =>
                            setSelectedReceipt(
                              receipt
                            )
                          }
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
                        >
                          <Eye
                            size={16}
                          />
                          View
                        </button>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          SELECTED RECEIPT MODAL
      ====================================================== */}

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-extrabold text-black">
                  Fuel & Remittance Transaction
                </h2>

                <p className="mt-1 text-sm font-medium text-black">
                  {new Date(
                    selectedReceipt.date
                  ).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedReceipt(
                    null
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg text-black transition hover:bg-slate-100"
              >
                <X
                  size={21}
                />
              </button>

            </div>

            {/* RECEIPT SUMMARY */}

            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 p-6 md:grid-cols-4">

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-sm font-semibold text-black">
                  Receipt
                </p>

                <h3 className="mt-1 text-lg font-bold text-black">
                  {
                    selectedReceipt.receiptNumber
                  }
                </h3>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-sm font-semibold text-black">
                  Transactions
                </p>

                <h3 className="mt-1 text-lg font-bold text-black">
                  {
                    selectedReceipt.transactionCount
                  }
                </h3>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-sm font-semibold text-black">
                  Boundary
                </p>

                <h3 className="mt-1 text-lg font-bold text-black">
                  ₱
                  {
                    selectedReceipt.boundaryTotal
                  }
                </h3>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-sm font-semibold text-black">
                  Fuel Liters
                </p>

                <h3 className="mt-1 text-lg font-bold text-black">
                  {
                    selectedReceipt.litersTotal
                  }{" "}
                  L
                </h3>

              </div>

            </div>

            {/* TRANSACTION TABLE */}

            <div className="overflow-x-auto overflow-y-auto p-6">

              <table className="min-w-full table-auto border-collapse text-left">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Date
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Driver
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Unit
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Route
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Boundary
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Receipt
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Liters
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Cost
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Odo In
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Odo Out
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Station
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Shift
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      QR Code
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Anomaly
                    </th>

                    <th className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-black">
                      Details
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {transactions
                    .filter((tx) => {
                      const txDate =
                        new Date(
                          tx.transactionDate
                        );

                      const rDate =
                        new Date(
                          selectedReceipt.date
                        );

                      return (
                        txDate.getFullYear() ===
                          rDate.getFullYear() &&
                        txDate.getMonth() ===
                          rDate.getMonth() &&
                        txDate.getDate() ===
                          rDate.getDate()
                      );
                    })
                    .sort(
                      (a, b) =>
                        new Date(
                          b.transactionDate
                        ).getTime() -
                        new Date(
                          a.transactionDate
                        ).getTime()
                    )
                    .map(
                      (tx) => (
                        <tr
                          key={
                            tx._id
                          }
                          className="border-b border-slate-100 hover:bg-blue-50"
                        >

                          <td className="px-5 py-3.5 text-sm text-black">
                            {new Date(
                              tx.transactionDate
                            ).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {tx.driver
                              ? `${tx.driver.firstName} ${tx.driver.lastName}`
                              : "-"}
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {tx.unit
                              ?.plateNumber ||
                              tx.unit
                                ?.bodyNumber}
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {
                              tx.route
                            }
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            ₱
                            {
                              tx.totalBoundary
                            }
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {
                              tx.receiptNumber
                            }
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {
                              tx.fuelLiters
                            }{" "}
                            L
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            ₱
                            {
                              tx.fuelCost
                            }
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {
                              tx.odometerIn
                            }
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {
                              tx.odometerOut ||
                              "-"
                            }
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {
                              tx.fuelStation
                            }
                          </td>

                          <td className="px-5 py-3.5 text-sm text-black">
                            {
                              tx.shiftType
                            }
                          </td>

                          <td className="px-5 py-3.5">

                            {tx.qrImage ? (
  <button
    type="button"
    onClick={() =>
      setSelectedQR(tx.qrImage)
    }
    className="group inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white p-1 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
    aria-label="View Transaction QR Code"
    title="View QR Code"
  >
    <img
      src={tx.qrImage}
      alt="Transaction QR Code"
      className="h-14 w-14 rounded transition-transform duration-150 group-hover:scale-105"
    />
  </button>
) : (
  <span className="text-sm text-black">
    -
  </span>
)}
                          </td>

                          <td className="px-5 py-3.5 text-sm font-medium text-black">
                            <AnomalyBadge
                              detected={
                                tx.anomalyDetected
                              }
                              reason={
                                tx.anomalyReason
                              }
                            />
                          </td>

                          <td className="px-5 py-3.5 text-center">

                            <button
                              onClick={() =>
                                setSelectedTransaction(
                                  tx
                                )
                              }
                              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              <Eye
                                size={16}
                              />
                              Details
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PAGINATION
      ====================================================== */}

      <div className="mt-5 flex items-center justify-between">

        <div className="text-sm font-semibold text-black">
          Page {page} of{" "}
          {totalPages || 1}
        </div>

        <div className="flex gap-2">

          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            disabled={
              page === 1
            }
            onClick={() =>
              setPage((p) =>
                Math.max(
                  1,
                  p - 1
                )
              )
            }
          >
            Prev
          </button>

          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            disabled={
              page === totalPages ||
              totalPages === 0
            }
            onClick={() =>
              setPage((p) =>
                Math.min(
                  totalPages,
                  p + 1
                )
              )
            }
          >
            Next
          </button>

        </div>
      </div>

      {/* =====================================================
          CREATE FORM MODAL
      ====================================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

          <div className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">

            {/* HEADER */}

            <div className="mb-6 border-b border-slate-200 pb-4 pr-12">

              <div className="flex items-center gap-3">
                <div>

                  <h2 className="text-xl font-extrabold uppercase tracking-wide text-black">
                    New Fuel Transaction
                  </h2>

                  <p className="mt-1 text-sm font-medium text-black">
                    Enter fuel and transaction information.
                  </p>

                </div>

              </div>

            </div>

            <form
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={
                handleFormSubmit
              }
            >

              {/* =====================================================
    RECEIPT OCR
====================================================== */}

<div className="md:col-span-2">

  <button
    type="button"
    onClick={() =>
      setShowReceiptOCR(true)
    }
    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-extrabold text-blue-950 transition hover:bg-blue-100 active:scale-[0.99]"
  >
    <Camera size={18} />

    Scan Fuel Receipt with Camera
  </button>

  <p className="mt-2 text-xs font-medium text-black">
    Scan the gasoline station receipt to automatically fill Fuel Station,
    Fuel Liters, and Fuel Cost.
  </p>

</div>

              {/* DRIVER SEARCHABLE */}

              <SearchableDropdown
                label="Driver"
                value={
                  form.driver
                }
                options={
                  sortedDrivers
                }
                placeholder="Type driver name..."
                searchPlaceholder="Search driver"
                icon={
                  UserRound
                }
                getOptionLabel={(
                  driver
                ) =>
                  `${driver.firstName || ""} ${driver.lastName || ""}`.trim()
                }
                onChange={(value) =>
                  setForm(
                    (
                      prev
                    ) => ({
                      ...prev,
                      driver:
                        value,
                    })
                  )
                }
              />

              {/* UNIT SEARCHABLE */}

              <SearchableDropdown
                label="Unit"
                value={
                  form.unit
                }
                options={
                  sortedUnits
                }
                placeholder="Type unit number..."
                searchPlaceholder="Search unit"
                icon={
                  Truck
                }
                getOptionLabel={(
                  unit
                ) =>
                  unit.bodyNumber ||
                  unit.plateNumber ||
                  ""
                }
                onChange={(value) =>
                  handleUnitSelection(value)
                }
              />

              {/* ROUTE */}

              <select
                name="route"
                value={
                  form.route
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  Boolean(
                    form.unit &&
                    selectedUnit?.route
                  )
                }
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-black`}
              >
                <option value="">
                  {form.unit
                    ? "No designated route"
                    : "Select Unit First"}
                </option>

                <option value="Langgam">
                  Langgam
                </option>

                <option value="Villarosa">
                  Villarosa
                </option>

                <option value="Bayan-Bayanan">
                  Bayan-Bayanan
                </option>

                <option value="Estrella">
                  Estrella
                </option>

                <option value="Calamba">
                  Calamba
                </option>
              </select>

              {/* BOUNDARY */}

              <input
                type="number"
                name="totalBoundary"
                placeholder="Boundary"
                value={
                  form.totalBoundary
                }
                onChange={
                  handleFormChange
                }
                className={
                  inputClass
                }
              />

              {/* PILA */}

              <input
                type="number"
                name="pilaTrips"
                placeholder="Pila Trips"
                value={
                  form.pilaTrips
                }
                onChange={
                  handleFormChange
                }
                className={
                  inputClass
                }
              />

              {/* SALUBONG */}

              <input
                type="number"
                name="salubongTrips"
                placeholder="Salubong Trips"
                value={
                  form.salubongTrips
                }
                onChange={
                  handleFormChange
                }
                className={
                  inputClass
                }
              />

              {/* RECEIPT */}

              <input
                type="text"
                name="receiptNumber"
                placeholder="Receipt Number"
                value={
                  form.receiptNumber
                }
                onChange={
                  handleFormChange
                }
                className={
                  inputClass
                }
              />

              {/* FUEL STATION */}

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                  Fuel Station
                </label>

                <input
                  type="text"
                  name="fuelStation"
                  placeholder="Fuel Station"
                  className={
                    inputClass
                  }
                  value={
                    form.fuelStation
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                />
              </div>

              {/* FUEL LITERS */}

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                  Fuel Liters
                </label>

                <input
                  type="number"
                  name="fuelLiters"
                  placeholder="Fuel Liters"
                  className={
                    inputClass
                  }
                  value={
                    form.fuelLiters
                  }
                  onChange={
                    handleFormChange
                  }
                  min={0}
                  required
                />
              </div>

              {/* FUEL COST */}

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                  Fuel Cost
                </label>

                <input
                  type="number"
                  name="fuelCost"
                  placeholder="Fuel Cost"
                  className={
                    inputClass
                  }
                  value={
                    form.fuelCost
                  }
                  onChange={
                    handleFormChange
                  }
                  min={0}
                  required
                />
              </div>

              {/* ODOMETER IN */}

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                  Odometer In
                </label>

                <input
                  type="number"
                  name="odometerIn"
                  placeholder={
                    odometerAutoFilled
                      ? "Auto-filled from latest Odometer Out"
                      : "Odometer In"
                  }
                  className={`${inputClass} ${
                    odometerAutoFilled
                      ? "bg-slate-100"
                      : ""
                  }`}
                  value={
                    form.odometerIn
                  }
                  onChange={
                    handleFormChange
                  }
                  min={0}
                  readOnly={odometerAutoFilled}
                  required
                />
              </div>

              {/* ODOMETER OUT */}

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                  Odometer Out
                </label>

                <input
                  type="number"
                  name="odometerOut"
                  placeholder="Odometer Out (optional)"
                  className={
                    inputClass
                  }
                  value={
                    form.odometerOut
                  }
                  onChange={
                    handleFormChange
                  }
                  min={0}
                />
              </div>

              {/* SHIFT */}

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                  Shift Type
                </label>

                <select
                  name="shiftType"
                  className={
                    inputClass
                  }
                  value={
                    form.shiftType
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                >
                  {shiftTypes.map(
                    (s) => (
                      <option
                        key={s}
                        value={s}
                      >
                        {s}
                      </option>
                    )
                  )}
                </select>
              </div>

           {/* TRANSACTION DATE */}

<div>
  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
    Transaction Date
  </label>

  <div className="relative">
    <input
      type="datetime-local"
      name="transactionDate"
      value={form.transactionDate}
      onChange={handleFormChange}
      required
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm font-medium text-black shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
    />

    <button
      type="button"
      onClick={(e) => {
        const input = e.currentTarget.previousElementSibling;

        if (input) {
          if (typeof input.showPicker === "function") {
            input.showPicker();
          } else {
            input.focus();
          }
        }
      }}
      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-blue-950 transition hover:bg-blue-50 active:scale-95"
      aria-label="Open transaction date picker"
      title="Select transaction date"
    >
      <Calendar size={18} strokeWidth={2.2} />
    </button>
  </div>
</div>

              {/* REMARKS */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-black">
                  Remarks
                </label>

                <input
                  type="text"
                  name="remarks"
                  placeholder="Remarks"
                  className={
                    inputClass
                  }
                  value={
                    form.remarks
                  }
                  onChange={
                    handleFormChange
                  }
                />

              </div>

              {/* BUTTONS */}

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-5 md:col-span-2">

                {formLoading && (
                  <span className="mr-auto text-sm font-semibold text-black">
                    Saving...
                  </span>
                )}

                {formError && (
                  <span className="mr-auto text-sm font-semibold text-red-600">
                    {
                      formError
                    }
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(
                      false
                    )
                  }
                  className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    formLoading
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-60"
                >
                  {
                    formLoading
                      ? "Saving..."
                      : "Submit"
                  }
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          SELECTED TRANSACTION
      ====================================================== */}

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-extrabold text-black">
                Fuel Transaction Details
              </h2>

              <button
                onClick={() =>
                  setSelectedTransaction(
                    null
                  )
                }
                className="text-black transition hover:text-slate-700"
              >
                <X
                  size={24}
                />
              </button>

            </div>

            <div className="grid grid-cols-1 gap-4 text-base text-black md:grid-cols-2">

              <p>
                <b>Date:</b>{" "}
                {new Date(
                  selectedTransaction.transactionDate
                ).toLocaleString()}
              </p>

              <p>
                <b>Driver:</b>{" "}
                {
                  selectedTransaction.driver
                    ?.firstName
                }{" "}
                {
                  selectedTransaction.driver
                    ?.lastName
                }
              </p>

              <p>
                <b>Unit:</b>{" "}
                {
                  selectedTransaction.unit
                    ?.plateNumber ||
                  selectedTransaction.unit
                    ?.bodyNumber
                }
              </p>

              <p>
                <b>Route:</b>{" "}
                {
                  selectedTransaction.route
                }
              </p>

              <p>
                <b>Boundary:</b> ₱
                {
                  selectedTransaction.totalBoundary
                }
              </p>

              <p>
                <b>Pila:</b>{" "}
                {
                  selectedTransaction.pilaTrips
                }
              </p>

              <p>
                <b>Salubong:</b>{" "}
                {
                  selectedTransaction.salubongTrips
                }
              </p>

              <p>
                <b>Total Remit:</b> ₱
                {
                  selectedTransaction.totalRemit
                }
              </p>

              <p>
                <b>Receipt:</b>{" "}
                {
                  selectedTransaction.receiptNumber ||
                  "-"
                }
              </p>

              <p>
                <b>Fuel Liters:</b>{" "}
                {
                  selectedTransaction.fuelLiters
                }
              </p>

              <p>
                <b>Fuel Cost:</b> ₱
                {
                  selectedTransaction.fuelCost
                }
              </p>

              <p>
                <b>Odometer In:</b>{" "}
                {
                  selectedTransaction.odometerIn
                }
              </p>

              <p>
                <b>Odometer Out:</b>{" "}
                {
                  selectedTransaction.odometerOut ||
                  "-"
                }
              </p>

              <p>
                <b>Station:</b>{" "}
                {
                  selectedTransaction.fuelStation
                }
              </p>

              <p>
                <b>Shift:</b>{" "}
                {
                  selectedTransaction.shiftType
                }
              </p>

              <p>
                <b>Anomaly:</b>{" "}
                {
                  selectedTransaction.anomalyDetected
                    ? "Yes"
                    : "No"
                }
              </p>

            </div>

            <div className="mt-8 flex flex-col items-center">

              <div className="mb-3 flex items-center gap-2">

                <QrCode
                  size={20}
                  className="text-blue-950"
                />

                <h3 className="text-lg font-bold text-black">
                  QR Code
                </h3>

              </div>

              {selectedTransaction.qrImage && (
                <img
                  src={
                    selectedTransaction.qrImage
                  }
                  className="h-52 w-52 rounded-lg border"
                  alt="Transaction QR Code"
                />
              )}

            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SELECTED DAILY QR
      ====================================================== */}

      {selectedQR && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70"
          onClick={() =>
            setSelectedQR(null)
          }
        >

          <div
            className="rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="mb-4 flex items-center justify-between">

              <h3 className="text-lg font-bold text-black">
                Daily QR Code
              </h3>

              <button
                onClick={() =>
                  setSelectedQR(
                    null
                  )
                }
                className="text-black"
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <img
              src={selectedQR}
              alt="QR Code"
              className="h-80 w-80"
            />

          </div>
        </div>
      )}

      {/* =====================================================
          QR SCANNER
      ====================================================== */}

      {showQR && (
        <QRScanner
          type={showQR}
          onScanSuccess={
            handleQRSuccess
          }
          onClose={() =>
            setShowQR(null)
          }
        />
      )}
      {/* =====================================================
    FUEL RECEIPT OCR
====================================================== */}

<FuelReceiptOCRScanner
  open={showReceiptOCR}
  onClose={() =>
    setShowReceiptOCR(false)
  }
  onExtract={
    handleReceiptOCRExtract
  }
/>

{/* =====================================================
    SELECTED TRANSACTION QR POPUP
===================================================== */}

{selectedQR && (
  <div
    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    onClick={() => setSelectedQR(null)}
  >
    <div
      className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-black">
          Transaction QR Code
        </h3>

        <button
          type="button"
          onClick={() =>
            setSelectedQR(null)
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-black transition hover:bg-slate-100 active:scale-95"
          aria-label="Close QR Code"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* QR IMAGE */}
      <div className="flex items-center justify-center border-slate-200 bg-white p-4">
        <img
          src={selectedQR}
          alt="Transaction QR Code"
          className="h-72 w-72 max-w-full object-contain"
        />
      </div>
      
    </div>
  </div>
)}

    </div>
  );
};

export default FuelMonitoringPage;

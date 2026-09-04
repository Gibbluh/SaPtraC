import { useEffect, useState, useRef } from "react";
import { useAnalyticsApi } from "../../lib/analyticsApi";
import KPIGrid from "../../components/analytics/KPIGrid";
import {
  TrendingUp,
  Wallet,
  Fuel,
  Users,
  Truck,
  Wrench,
  Calendar,
  BarChart3,
  Activity,
  Route,
  UserRound,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import RevenueChart from "../../components/analytics/RevenueChart";
import FuelChart from "../../components/dashboard/FuelChart";
import TopDriversCard from "../../components/dashboard/TopDriversCard";
import TopRoutesCard from "../../components/dashboard/TopRoutesCard";
import FleetStatusCard from "../../components/dashboard/FleetStatusCard";
import api from "../../lib/axios";
import { getSocket } from "../../lib/socket";

const kpiConfig = [
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: <TrendingUp />,
    currency: true,
    animate: true,
  },
  {
    key: "totalRemittance",
    label: "Total Remittance",
    icon: <Wallet />,
    currency: true,
    animate: true,
  },
  {
    key: "totalFuelCost",
    label: "Fuel Expenses",
    icon: <Fuel />,
    currency: true,
    animate: true,
  },
  {
    key: "activeDrivers",
    label: "Active Drivers",
    icon: <Users />,
    animate: true,
  },
  {
    key: "activeUnits",
    label: "Active Units",
    icon: <Truck />,
    animate: true,
  },
  {
    key: "maintenanceIncidents",
    label: "Maintenance Incidents",
    icon: <Wrench />,
    animate: true,
  },
];

const AnalyticsDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    month: "",
    year: "",
  });

  // Additional analytics data already available
  // through existing backend endpoints.
  const [fuelAnalytics, setFuelAnalytics] = useState({
    dailyFuel: [],
  });

  const [fleetHealth, setFleetHealth] = useState(null);
  const [executive, setExecutive] = useState(null);

  const { getDashboardSummary } = useAnalyticsApi();

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  /*
   * =========================================================
   * DASHBOARD SUMMARY
   * =========================================================
   */
  useEffect(() => {
    const sleep = (ms) =>
      new Promise((res) => setTimeout(res, ms));

    const fetchWithRetries = async (
      params,
      signal,
      attempts = 3,
      delay = 500
    ) => {
      try {
        return await getDashboardSummary(params, {
          signal,
        });
      } catch (err) {
        if (signal && signal.aborted) {
          throw err;
        }

        const status = err?.response?.status;

        if (
          (status === 429 || status >= 500) &&
          attempts > 0
        ) {
          await sleep(delay);

          return fetchWithRetries(
            params,
            signal,
            attempts - 1,
            Math.min(2000, delay * 2)
          );
        }

        throw err;
      }
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {
        // ignore
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchWithRetries(
          filters,
          controller.signal
        );

        console.log("Analytics Response:", data);

        if (!controller.signal.aborted) {
          setDashboard(data);
          console.log("setDashboard:", data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const status = err?.response?.status;

          if (status === 429) {
            setError(
              "Rate limit exceeded. Please wait a moment and try again."
            );
          } else {
            setError(
              err?.response?.data?.message ||
                err?.message ||
                "Failed to load analytics dashboard"
            );
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      controller.abort();
    };
  }, [filters, getDashboardSummary]);

  /*
   * =========================================================
   * EXISTING FUEL ANALYTICS
   * =========================================================
   */
  useEffect(() => {
    const loadFuelAnalytics = async () => {
      try {
        const response = await api.get(
          "/analytics/fuel",
          {
            params: filters,
          }
        );

        setFuelAnalytics(
          response.data || {
            dailyFuel: [],
          }
        );
      } catch (err) {
        console.error(
          "Failed to load fuel analytics:",
          err
        );
      }
    };

    loadFuelAnalytics();
  }, [filters]);

  /*
   * =========================================================
   * EXISTING FLEET HEALTH
   * =========================================================
   */
  useEffect(() => {
    const loadFleetHealth = async () => {
      try {
        const response = await api.get(
          "/analytics/fleet-health"
        );

        setFleetHealth(response.data || null);
      } catch (err) {
        console.error(
          "Failed to load fleet health:",
          err
        );
      }
    };

    loadFleetHealth();
  }, []);

  /*
   * =========================================================
   * EXISTING EXECUTIVE SUMMARY
   * =========================================================
   */
  useEffect(() => {
    const loadExecutiveSummary = async () => {
      try {
        const response = await api.get(
          "/analytics/executive"
        );

        setExecutive(response.data || null);
      } catch (err) {
        console.error(
          "Failed to load executive summary:",
          err
        );
      }
    };

    loadExecutiveSummary();
  }, []);

  /*
   * =========================================================
   * REALTIME SOCKET LISTENERS
   * =========================================================
   */
  useEffect(() => {
    const socket = getSocket();

    const onDashboardUpdate = (data) => {
      setDashboard((prev) => ({
        ...(prev || {}),
        ...data,
      }));
    };

    const onMaintenanceUpdate = (data) => {
      setDashboard((prev) => ({
        ...(prev || {}),
        maintenanceIncidents: data.count,
      }));
    };

    const onFuelUpdate = (data) => {
      setDashboard((prev) => ({
        ...(prev || {}),
        totalFuelCost: data.totalFuelCost,
      }));
    };

    const onRemittanceUpdate = (data) => {
      setDashboard((prev) => ({
        ...(prev || {}),
        totalRemittance: data.totalRemittance,
      }));
    };

    const onConnect = () => {
      console.info("Socket connected");
    };

    const onDisconnect = (reason) => {
      console.info(
        "Socket disconnected:",
        reason
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on(
      "dashboardUpdate",
      onDashboardUpdate
    );

    socket.on(
      "maintenanceUpdate",
      onMaintenanceUpdate
    );

    socket.on(
      "fuelAnalyticsUpdate",
      onFuelUpdate
    );

    socket.on(
      "remittanceUpdate",
      onRemittanceUpdate
    );

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);

      socket.off(
        "dashboardUpdate",
        onDashboardUpdate
      );

      socket.off(
        "maintenanceUpdate",
        onMaintenanceUpdate
      );

      socket.off(
        "fuelAnalyticsUpdate",
        onFuelUpdate
      );

      socket.off(
        "remittanceUpdate",
        onRemittanceUpdate
      );
    };
  }, []);

  /*
   * =========================================================
   * FILTER HANDLER
   * =========================================================
   */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * =========================================================
   * KPI DATA
   * =========================================================
   */
  const kpis = [
    {
      key: "totalRevenue",
      kpiKey: "totalRevenue",
      label: "Total Revenue",
      kpiLabel: "Total Revenue",
      icon: <TrendingUp />,
      currency: true,
      value: dashboard?.totalRevenue || 0,
    },

    {
      key: "totalRemittance",
      kpiKey: "totalRemittance",
      label: "Total Remittances",
      kpiLabel: "Total Remittances",
      icon: <Wallet />,
      currency: false,
      value: Math.trunc(
        dashboard?.totalRemittance || 0
      ),
    },

    {
      key: "totalFuelCost",
      kpiKey: "totalFuelCost",
      label: "Fuel Expenses",
      kpiLabel: "Fuel Expenses",
      icon: <Fuel />,
      currency: true,
      value: dashboard?.totalFuelCost || 0,
    },

    {
      key: "activeDrivers",
      kpiKey: "activeDrivers",
      label: "Active Drivers",
      kpiLabel: "Active Drivers",
      icon: <Users />,
      value: dashboard?.activeDrivers || 0,
    },

    {
      key: "activeUnits",
      kpiKey: "activeUnits",
      label: "Active Units",
      kpiLabel: "Active Units",
      icon: <Truck />,
      value: dashboard?.activeUnits || 0,
    },

    {
      key: "maintenanceIncidents",
      kpiKey: "maintenanceIncidents",
      label: "Maintenance Incidents",
      kpiLabel: "Maintenance Incidents",
      icon: <Wrench />,
      value:
        dashboard?.maintenanceIncidents || 0,
    },
  ];

  /*
   * =========================================================
   * ROUTE REVENUE
   * =========================================================
   */
  const routeRevenue = Array.isArray(
    dashboard?.routeRevenue
  )
    ? [...dashboard.routeRevenue].sort(
        (a, b) =>
          Number(b?.revenue || 0) -
          Number(a?.revenue || 0)
      )
    : [];

  /*
   * =========================================================
   * DRIVER REMITTANCES
   * =========================================================
   */
  const driverRemittances = Array.isArray(
    dashboard?.driverRemittances
  )
    ? [...dashboard.driverRemittances].sort(
        (a, b) =>
          Number(b?.remittance || 0) -
          Number(a?.remittance || 0)
      )
    : [];

  useEffect(() => {
    console.log(
      "Dashboard State:",
      dashboard
    );

    console.log(
      "KPIs:",
      kpis
    );
  }, [dashboard]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-6 md:p-8 lg:p-10">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
                Analytics Dashboard
              </h1>

              <p className="mt-2 max-w-5xl text-base md:text-lg font-medium text-slate-700">
                Monitor cooperative revenue,
                remittances, fuel consumption,
                fleet health, and operational
                performance in real time.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            FILTERS
        ====================================================== */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <Calendar
                  size={19}
                  className="text-blue-700"
                  strokeWidth={2}
                />
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-950">
                  Analytics Filters
                </h2>

                <p className="text-sm md:text-base font-medium text-slate-700">
                  Filter dashboard results by date,
                  month, or year.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Start Date */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-950">
                  Start Date
                </label>

                <div className="relative flex items-center">
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-base font-medium text-slate-950 shadow-sm outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />

                  <Calendar
                    size={18}
                    className="pointer-events-none absolute right-3 text-slate-900"
                    strokeWidth={2}
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-950">
                  End Date
                </label>

                <div className="relative flex items-center">
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-base font-medium text-slate-950 shadow-sm outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />

                  <Calendar
                    size={18}
                    className="pointer-events-none absolute right-3 text-slate-900"
                    strokeWidth={2}
                  />
                </div>
              </div>

              {/* Month */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-950">
                  Month
                </label>

                <select
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 shadow-sm outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">
                    All Months
                  </option>

                  {[...Array(12)].map((_, i) => (
                    <option
                      key={i + 1}
                      value={i + 1}
                    >
                      {new Date(
                        0,
                        i
                      ).toLocaleString(
                        "default",
                        {
                          month: "long",
                        }
                      )}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-950">
                  Year
                </label>

                <input
                  type="number"
                  name="year"
                  min="2000"
                  max={new Date().getFullYear()}
                  value={filters.year}
                  onChange={handleFilterChange}
                  placeholder="Year"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 shadow-sm outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-base md:text-lg font-bold text-red-700 text-center">
              {error}
            </p>
          </div>
        )}

        {/* =====================================================
            KPI SECTION
        ====================================================== */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-950">
                Key Performance Indicators
              </h2>

              <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                Current fleet and financial performance.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <Activity
                size={17}
                className="text-blue-700"
              />

              <span className="text-sm font-bold text-slate-950">
                Live Metrics
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-md">
            <KPIGrid
              kpis={kpis}
              loading={loading}
            />
          </div>
        </section>

        {/* =====================================================
            REVENUE ANALYTICS
        ====================================================== */}
        <section className="mb-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-950">
                Revenue Analytics
              </h2>

              <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                Revenue performance based on
                the selected analytics filters.
              </p>
            </div>

            <div className="p-5 md:p-6">
              <RevenueChart
                filters={filters}
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            FUEL ANALYTICS
        ====================================================== */}
        <section className="mb-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Fuel
                    size={20}
                    className="text-blue-700"
                  />
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-950">
                    Fuel Analytics
                  </h2>

                  <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                    Daily fuel consumption and
                    fuel expense trends.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <FuelChart
                data={
                  fuelAnalytics.dailyFuel ||
                  []
                }
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            REVENUE PER ROUTE
        ====================================================== */}
        <section className="mb-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Route
                    size={20}
                    className="text-blue-700"
                  />
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-950">
                    Revenue per Route
                  </h2>

                  <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                    Total generated revenue
                    grouped by route.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">

              {loading ? (
                <div className="space-y-3">
                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : routeRevenue.length === 0 ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6">

                  <div className="text-center">

                    <Route
                      size={36}
                      className="mx-auto mb-3 text-slate-900"
                    />

                    <p className="text-lg font-bold text-slate-950">
                      No route revenue data
                    </p>

                    <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                      No revenue records are
                      available for the selected
                      filters.
                    </p>

                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                  {routeRevenue.map(
                    (item, index) => (
                      <div
                        key={`${item.route}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-950">
                              Route
                            </p>

                            <h3 className="mt-1 text-xl font-bold text-slate-950">
                              {item.route ||
                                "Unknown Route"}
                            </h3>
                          </div>

                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <Route
                              size={19}
                              className="text-blue-700"
                            />
                          </div>

                        </div>

                        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-950">
                          Total Revenue
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-950">
                          ₱
                          {Number(
                            item.revenue || 0
                          ).toLocaleString()}
                        </p>

                      </div>
                    )
                  )}

                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            DRIVER REMITTANCES
        ====================================================== */}
        <section className="mb-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <UserRound
                    size={20}
                    className="text-emerald-700"
                  />
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-950">
                    Driver Remittances
                  </h2>

                  <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                    Remittance totals grouped by
                    driver.
                  </p>
                </div>

              </div>

            </div>

            <div className="p-5 md:p-6">

              {loading ? (
                <div className="space-y-3">

                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />

                </div>
              ) : driverRemittances.length === 0 ? (

                <div className="flex min-h-[180px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6">

                  <div className="text-center">

                    <UserRound
                      size={36}
                      className="mx-auto mb-3 text-slate-900"
                    />

                    <p className="text-lg font-bold text-slate-950">
                      No driver remittance data
                    </p>

                    <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                      No driver remittance
                      records are available
                      for the selected filters.
                    </p>

                  </div>
                </div>

              ) : (

                <div className="overflow-x-auto rounded-xl border border-slate-200">

                  <table className="min-w-full border-collapse">

                    <thead>

                      <tr className="bg-slate-50 border-b border-slate-200">

                        <th className="px-5 py-4 text-left text-sm font-bold uppercase tracking-wide text-slate-950">
                          Driver
                        </th>

                        <th className="px-5 py-4 text-right text-sm font-bold uppercase tracking-wide text-slate-950">
                          Remittance
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {driverRemittances.map(
                        (item, index) => (
                          <tr
                            key={
                              item.driverId ||
                              `${item.driverName}-${index}`
                            }
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                                  <UserRound
                                    size={18}
                                  />
                                </div>

                                <p className="text-base md:text-lg font-bold text-slate-950">
                                  {item.driverName ||
                                    "Unknown Driver"}
                                </p>

                              </div>

                            </td>

                            <td className="px-5 py-4 text-right">

                              <span className="text-xl md:text-2xl font-bold text-slate-950">
                                ₱
                                {Number(
                                  item.remittance ||
                                    0
                                ).toLocaleString()}
                              </span>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>
          </div>
        </section>

        {/* =====================================================
            FLEET HEALTH OVERVIEW
        ====================================================== */}
        {fleetHealth && (
          <section className="mb-8">

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">

                    <ShieldCheck
                      size={20}
                      className="text-blue-700"
                    />

                  </div>

                  <div>

                    <h2 className="text-xl md:text-2xl font-bold text-slate-950">
                      Fleet Health Overview
                    </h2>

                    <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                      Current fleet health and
                      maintenance risk distribution.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-5 md:p-6">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2">

                      <ShieldCheck
                        size={20}
                        className="text-emerald-700"
                      />

                      <p className="text-sm font-bold text-slate-950">
                        Good
                      </p>

                    </div>

                    <p className="mt-3 text-3xl font-bold text-emerald-700">
                      {fleetHealth.healthy ?? 0}
                    </p>

                  </div>

                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                    <div className="flex items-center gap-2">

                      <AlertCircle
                        size={20}
                        className="text-yellow-700"
                      />

                      <p className="text-sm font-bold text-slate-950">
                        Medium Risk
                      </p>

                    </div>

                    <p className="mt-3 text-3xl font-bold text-yellow-700">
                      {fleetHealth.medium ?? 0}
                    </p>

                  </div>

                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                    <div className="flex items-center gap-2">

                      <AlertTriangle
                        size={20}
                        className="text-orange-700"
                      />

                      <p className="text-sm font-bold text-slate-950">
                        High Risk
                      </p>

                    </div>

                    <p className="mt-3 text-3xl font-bold text-orange-700">
                      {fleetHealth.high ?? 0}
                    </p>

                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-center gap-2">

                      <AlertTriangle
                        size={20}
                        className="text-red-700"
                      />

                      <p className="text-sm font-bold text-slate-950">
                        Critical
                      </p>

                    </div>

                    <p className="mt-3 text-3xl font-bold text-red-700">
                      {fleetHealth.critical ?? 0}
                    </p>

                  </div>

                </div>

                {fleetHealth.recommendation && (
                  <div className="mt-6 border-t border-slate-200 pt-6">

                    <h3 className="text-lg md:text-xl font-bold text-slate-950">
                      Recommended Maintenance
                    </h3>

                    <div className="mt-4 grid md:grid-cols-3 gap-4">

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                        <p className="text-sm font-bold uppercase tracking-wide text-slate-700">
                          Unit
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {fleetHealth.recommendation
                            .plateNumber ||
                            "N/A"}
                        </p>

                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                        <p className="text-sm font-bold uppercase tracking-wide text-slate-700">
                          Risk Score
                        </p>

                        <p className="mt-2 text-2xl font-bold text-red-600">
                          {fleetHealth.recommendation
                            .score ?? 0}
                          %
                        </p>

                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                        <p className="text-sm font-bold uppercase tracking-wide text-slate-700">
                          Status
                        </p>

                        <p className="mt-2 text-xl font-bold text-orange-600">
                          {fleetHealth.recommendation
                            .level ||
                            "N/A"}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5">

                      <p className="text-base md:text-lg font-semibold text-slate-950 leading-relaxed">
                        {fleetHealth.recommendation
                          .recommendation ||
                          "No specific actions required."}
                      </p>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* =====================================================
            EXECUTIVE SUMMARY
        ====================================================== */}
        <section className="mb-8">

          <div className="mb-4">

            <h2 className="text-xl md:text-2xl font-bold text-slate-950">
              Executive Summary
            </h2>

            <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
              High-level fleet and cooperative
              performance summary.
            </p>

          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            <TopDriversCard
              data={
                executive?.topDrivers || []
              }
            />

            <TopRoutesCard
              data={
                executive?.topRoutes || []
              }
            />

            <FleetStatusCard
              data={
                executive?.fleetStatus || []
              }
            />

          </div>

        </section>

        {/* =====================================================
            REALTIME STATISTICS
        ====================================================== */}
        <section>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-950">

                  <Activity
                    size={18}
                    className="text-white"
                    strokeWidth={2}
                  />

                </div>

                <div>

                  <h2 className="text-xl md:text-2xl font-bold text-slate-950">
                    Realtime Statistics
                  </h2>

                  <p className="mt-1 text-sm md:text-base font-medium text-slate-700">
                    Live operational statistics
                    will appear here.
                  </p>

                </div>

              </div>

            </div>

            <div className="p-5 md:p-6">

              <div className="flex min-h-[220px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">

                <div className="max-w-xl text-center px-6">

                  <Activity
                    size={42}
                    className="mx-auto mb-4 text-blue-950"
                    strokeWidth={1.7}
                  />

                  <p className="text-lg md:text-xl font-bold text-slate-950">
                    Realtime statistics
                    coming soon
                  </p>

                  <p className="mt-2 text-sm md:text-base font-medium text-slate-700">
                    This section is reserved
                    for additional live fleet
                    and operational metrics.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
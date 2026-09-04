import { useContext, useEffect, useState } from "react";
import AuthContext from "../lib/AuthContext";
import api from "../lib/axios";
import {
  TrendingUp,
  Fuel,
  Users,
  Truck,
  Wrench,
  ShieldAlert,
  Activity,
  Wallet,
} from "lucide-react";

const StatCard = ({
  title,
  value,
  icon,
  accent = "blue",
  subtitle,
}) => {
  const accentMap = {
    blue: {
      iconBg: "bg-blue-100",
      iconText: "text-blue-900",
      border: "border-blue-100",
    },
    green: {
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-800",
      border: "border-emerald-100",
    },
    orange: {
      iconBg: "bg-orange-100",
      iconText: "text-orange-800",
      border: "border-orange-100",
    },
    red: {
      iconBg: "bg-red-100",
      iconText: "text-red-800",
      border: "border-red-100",
    },
    purple: {
      iconBg: "bg-purple-100",
      iconText: "text-purple-900",
      border: "border-purple-100",
    },
  };

  const theme =
    accentMap[accent] || accentMap.blue;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 ${theme.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide text-black">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-black md:text-4xl">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm font-medium text-black">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconText}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const RoleDashboard = () => {
  const { user } = useContext(AuthContext);

  const [dashboard, setDashboard] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalFuelCost: 0,
    activeDrivers: 0,
    activeUnits: 0,
    maintenanceIncidents: 0,
  });

  const [fleetHealth, setFleetHealth] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const roleLabelMap = {
    "Super Admin": "Super Admin",
    Administrator: "Administrator",
    "Operational Manager":
      "Operational Manager",
    Cashier: "Cashier",
    Mechanic: "Mechanic",
    "Fuel Pump Attendant":
      "Fuel Pump Attendant",
  };

  const welcomeLabel =
    roleLabelMap[user?.role] ||
    user?.role ||
    "User";

  /*
   * =========================================================
   * TODAY'S DATE RANGE
   * =========================================================
   *
   * This keeps the dashboard based on the current
   * operating day.
   *
   * The API receives today's start and end timestamps.
   *
   * =========================================================
   */
 const getTodayDateRange = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const today = `${year}-${month}-${day}`;

  return {
    startDate: today,
    endDate: today,
  };
};
  /*
   * =========================================================
   * FORMATTERS
   * =========================================================
   */

  const formatCurrency = (value) =>
    `₱ ${(Number(value) || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  const formatNumber = (value) =>
    Math.trunc(Number(value) || 0).toLocaleString();

  /*
   * =========================================================
   * LOAD TODAY'S DASHBOARD
   * =========================================================
   */

  const loadDashboard = async () => {
    try {
      const today =
        getTodayDateRange();

      const res = await api.get(
        "/analytics/dashboard",
        {
          params: today,
        }
      );

      console.log(
        "TODAY DASHBOARD RESPONSE:",
        res.data
      );

      setDashboard({
        totalRevenue:
          res.data?.totalRevenue || 0,

        totalTransactions:
          res.data?.totalTransactions ||
          0,

        totalFuelCost:
          res.data?.totalFuelCost || 0,

        activeDrivers:
          res.data?.activeDrivers || 0,

        activeUnits:
          res.data?.activeUnits || 0,

        maintenanceIncidents:
          res.data?.maintenanceIncidents ||
          0,
      });
    } catch (err) {
      console.error(
        "Failed to load today's dashboard stats:",
        err
      );
    }
  };

  /*
   * =========================================================
   * LOAD FLEET HEALTH
   * =========================================================
   */

  const loadFleetHealth = async () => {
    try {
      const res = await api.get(
        "/analytics/fleet-health"
      );

      setFleetHealth(
        res.data || null
      );
    } catch (err) {
      console.error(
        "Failed to load fleet health:",
        err
      );
    }
  };

  /*
   * =========================================================
   * INITIAL LOAD + AUTO REFRESH
   * =========================================================
   *
   * Dashboard refreshes every 10 seconds.
   * This allows newly created transactions to appear
   * without requiring a manual browser refresh.
   *
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    const fetchAllData = async () => {
      try {
        await Promise.allSettled([
          loadDashboard(),
          loadFleetHealth(),
        ]);
      } catch (err) {
        console.error(
          "Dashboard refresh error:",
          err
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    /*
     * Refresh every 10 seconds so newly created
     * transactions are reflected quickly.
     */
    const refreshInterval =
      setInterval(() => {
        fetchAllData();
      }, 10 * 1000);

    return () => {
      mounted = false;
      clearInterval(
        refreshInterval
      );
    };
  }, []);

  /*
   * =========================================================
   * INITIAL LOADING SCREEN
   * =========================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8 animate-pulse">
            <div className="h-10 w-72 rounded-lg bg-slate-300" />

            <div className="mt-3 h-5 w-96 rounded bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map(
              (_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
                />
              )
            )}
          </div>

          <div className="mt-8 h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-100 text-black">
      <div className="w-full p-5 md:p-7 lg:p-8 xl:p-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-950">
                Fleet Operations
              </p>

              <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
                Good day, {welcomeLabel}
              </h1>

              <p className="mt-2 text-base font-medium text-black md:text-lg">
                Today's operational overview for the San Pedro Transport Cooperative.
              </p>
            </div>

          </div>
        </div>

        {/* =====================================================
            TODAY'S OVERVIEW
        ====================================================== */}

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-black">
              Today's Overview
            </h2>

            <p className="mt-1 text-sm font-medium text-black md:text-base">
              Financial and transaction activity recorded for the current operating day.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            <StatCard
              title="Today's Revenue"
              value={formatCurrency(
                dashboard.totalRevenue
              )}
              icon={
                <TrendingUp
                  size={22}
                />
              }
              accent="blue"
              subtitle="Cooperative revenue today"
            />

            <StatCard
              title="Today's Total Transactions"
              value={formatNumber(
                dashboard.totalTransactions
              )}
              icon={
                <Wallet
                  size={22}
                />
              }
              accent="green"
              subtitle="Transactions recorded today"
            />

            <StatCard
              title="Today's Fuel Cost"
              value={formatCurrency(
                dashboard.totalFuelCost
              )}
              icon={
                <Fuel
                  size={22}
                />
              }
              accent="orange"
              subtitle="Fuel expenses recorded today"
            />

          </div>
        </section>

        {/* =====================================================
            OPERATIONS TODAY
        ====================================================== */}

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-black">
              Operations Today
            </h2>

            <p className="mt-1 text-sm font-medium text-black md:text-base">
              Current operational status of drivers, units, and maintenance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            <StatCard
              title="Active Drivers"
              value={formatNumber(
                dashboard.activeDrivers
              )}
              icon={
                <Users
                  size={22}
                />
              }
              accent="green"
              subtitle="Currently active drivers"
            />

            <StatCard
              title="Available Units"
              value={formatNumber(
                dashboard.activeUnits
              )}
              icon={
                <Truck
                  size={22}
                />
              }
              accent="green"
              subtitle="Units currently available"
            />

            <StatCard
              title="Maintenance Incidents"
              value={formatNumber(
                dashboard.maintenanceIncidents
              )}
              icon={
                <Wrench
                  size={22}
                />
              }
              accent="red"
              subtitle="Maintenance records reported today"
            />

          </div>
        </section>

        {/* =====================================================
            FLEET HEALTH
        ====================================================== */}

        {fleetHealth && (
          <section className="w-full">

            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

              <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 md:px-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-950">
                    <ShieldAlert
                      size={21}
                    />
                  </div>

                  <div>

                    <h2 className="text-2xl font-bold text-black">
                      Fleet Health Overview
                    </h2>

                    <p className="mt-1 text-sm font-medium text-black">
                      Current condition and risk distribution across the fleet.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-5 md:p-6">

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                  <StatCard
                    title="Healthy"
                    value={formatNumber(
                      fleetHealth.healthy
                    )}
                    icon={
                      <ShieldAlert
                        size={21}
                      />
                    }
                    accent="green"
                    subtitle="Healthy units"
                  />

                  <StatCard
                    title="Medium Risk"
                    value={formatNumber(
                      fleetHealth.medium
                    )}
                    icon={
                      <ShieldAlert
                        size={21}
                      />
                    }
                    accent="orange"
                    subtitle="Needs monitoring"
                  />

                  <StatCard
                    title="High Risk"
                    value={formatNumber(
                      fleetHealth.high
                    )}
                    icon={
                      <ShieldAlert
                        size={21}
                      />
                    }
                    accent="orange"
                    subtitle="Inspection recommended"
                  />

                  <StatCard
                    title="Critical"
                    value={formatNumber(
                      fleetHealth.critical
                    )}
                    icon={
                      <ShieldAlert
                        size={21}
                      />
                    }
                    accent="red"
                    subtitle="Immediate attention"
                  />

                </div>

                {fleetHealth.recommendation && (
                  <div className="mt-8 border-t border-slate-200 pt-7">

                    <h3 className="text-xl font-bold text-black md:text-2xl">
                      Recommended Maintenance
                    </h3>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                        <p className="text-sm font-bold uppercase tracking-wide text-black">
                          Unit
                        </p>

                        <p className="mt-2 text-xl font-bold text-black">
                          {
                            fleetHealth
                              .recommendation
                              .plateNumber ||
                            "N/A"
                          }
                        </p>

                      </div>

                      <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                        <p className="text-sm font-bold uppercase tracking-wide text-black">
                          Risk Score
                        </p>

                        <p className="mt-2 text-2xl font-bold text-red-700">
                          {
                            fleetHealth
                              .recommendation
                              .score ?? 0
                          }
                          %
                        </p>

                      </div>

                      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">

                        <p className="text-sm font-bold uppercase tracking-wide text-black">
                          Risk Level
                        </p>

                        <p className="mt-2 text-xl font-bold text-orange-700">
                          {
                            fleetHealth
                              .recommendation
                              .level ||
                            "N/A"
                          }
                        </p>

                      </div>

                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">

                      <p className="text-base font-semibold leading-relaxed text-black">
                        {
                          fleetHealth
                            .recommendation
                            .recommendation ||
                          "No specific actions required."
                        }
                      </p>

                    </div>

                  </div>
                )}

              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default RoleDashboard;
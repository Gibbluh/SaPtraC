import React from 'react';
import {
  TrendingUp,
  Fuel,
  Users,
  Truck,
  Wrench,
  ShieldAlert,
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

const DefaultRoleDashboard = ({ dashboard, fleetHealth, formatCurrency, formatNumber }) => {
  return (
    <div className="w-full">
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
            icon={<TrendingUp size={22} />}
            accent="blue"
            subtitle="Cooperative revenue today"
          />
          <StatCard
            title="Today's Total Transactions"
            value={formatNumber(
              dashboard.totalTransactions
            )}
            icon={<Wallet size={22} />}
            accent="green"
            subtitle="Transactions recorded today"
          />
          <StatCard
            title="Today's Fuel Cost"
            value={formatCurrency(
              dashboard.totalFuelCost
            )}
            icon={<Fuel size={22} />}
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
            icon={<Users size={22} />}
            accent="green"
            subtitle="Currently active drivers"
          />
          <StatCard
            title="Available Units"
            value={formatNumber(
              dashboard.activeUnits
            )}
            icon={<Truck size={22} />}
            accent="green"
            subtitle="Units currently available"
          />
          <StatCard
            title="Maintenance Incidents"
            value={formatNumber(
              dashboard.maintenanceIncidents
            )}
            icon={<Wrench size={22} />}
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
                  <ShieldAlert size={21} />
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
                  icon={<ShieldAlert size={21} />}
                  accent="green"
                  subtitle="Healthy units"
                />
                <StatCard
                  title="Medium Risk"
                  value={formatNumber(
                    fleetHealth.medium
                  )}
                  icon={<ShieldAlert size={21} />}
                  accent="orange"
                  subtitle="Needs monitoring"
                />
                <StatCard
                  title="High Risk"
                  value={formatNumber(
                    fleetHealth.high
                  )}
                  icon={<ShieldAlert size={21} />}
                  accent="orange"
                  subtitle="Inspection recommended"
                />
                <StatCard
                  title="Critical"
                  value={formatNumber(
                    fleetHealth.critical
                  )}
                  icon={<ShieldAlert size={21} />}
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
                        {fleetHealth.recommendation.plateNumber || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                      <p className="text-sm font-bold uppercase tracking-wide text-black">
                        Risk Score
                      </p>
                      <p className="mt-2 text-2xl font-bold text-red-700">
                        {fleetHealth.recommendation.score ?? 0}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                      <p className="text-sm font-bold uppercase tracking-wide text-black">
                        Risk Level
                      </p>
                      <p className="mt-2 text-xl font-bold text-orange-700">
                        {fleetHealth.recommendation.level || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-base font-semibold leading-relaxed text-black">
                      {fleetHealth.recommendation.recommendation ||
                        "No specific actions required."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default DefaultRoleDashboard;


import React, { useState, useMemo } from "react";
import {
  X,
  User,
  Calendar,
  Truck,
  MapPin,
  Clock,
  Download,
  Printer,
  Search,
  CheckCircle2,
  TrendingUp,
  Filter
} from "lucide-react";
import {
  ROUTE_COLORS,
  getRouteConfig,
  formatDateFriendly,
  formatTimestamp,
  SHIFT_TIMES
} from "./scheduleConstants";

/**
 * DriverHistoryDrawer: Slide-over panel for Driver Work History
 * Displays driver's past schedules, unit assignments, shifts, and total days per route.
 */
const DriverHistoryDrawer = ({
  isOpen,
  onClose,
  driver,
  allSchedules = [],
  units = [],
  customRoutes = {},
}) => {
  const [routeFilter, setRouteFilter] = useState("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState("ALL"); // 'ALL' | '30DAYS' | '90DAYS'

  // Driver full name
  const driverName = driver
    ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || "Driver"
    : "Driver";

  // Filter all schedules belonging to this driver
  const driverSchedules = useMemo(() => {
    if (!driver?._id) return [];
    return allSchedules
      .filter((s) => {
        const dId = s.driver?._id || s.driver;
        return dId === driver._id;
      })
      .sort((a, b) => {
        const dateA = new Date(a.shiftDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.shiftDate || b.createdAt || 0).getTime();
        return dateB - dateA; // Most recent first
      });
  }, [driver, allSchedules]);

  // Current or today's assignment
  const currentAssignment = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMatch = driverSchedules.find((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      return sDate === todayStr;
    });
    return todayMatch || driverSchedules[0] || null;
  }, [driverSchedules]);

  // Current unit info
  const currentUnit = useMemo(() => {
    if (!currentAssignment) return null;
    const uId = currentAssignment.unit?._id || currentAssignment.unit;
    return units.find((u) => u._id === uId) || currentAssignment.unit || null;
  }, [currentAssignment, units]);

  // Route statistics for this driver: total days / shifts per route
  const routeBreakdown = useMemo(() => {
    const counts = {};
    driverSchedules.forEach((s) => {
      const routeKey = (s.route || "LANGGAM").toUpperCase();
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";

      if (!counts[routeKey]) {
        counts[routeKey] = {
          routeKey,
          name: getRouteConfig(routeKey, customRoutes).name,
          hex: getRouteConfig(routeKey, customRoutes).hex,
          shiftsCount: 0,
          uniqueDays: new Set(),
        };
      }
      counts[routeKey].shiftsCount += 1;
      if (sDate) counts[routeKey].uniqueDays.add(sDate);
    });

    return Object.values(counts).map((c) => ({
      ...c,
      daysCount: c.uniqueDays.size,
    }));
  }, [driverSchedules, customRoutes]);

  // Filtered schedules for the timeline
  const filteredTimeline = useMemo(() => {
    const now = new Date();
    return driverSchedules.filter((s) => {
      if (routeFilter !== "ALL") {
        const rk = (s.route || "").toUpperCase();
        if (rk !== routeFilter) return false;
      }
      if (timeRangeFilter !== "ALL") {
        const daysLimit = timeRangeFilter === "30DAYS" ? 30 : 90;
        const sDate = new Date(s.shiftDate || s.createdAt || 0);
        const diffDays = (now - sDate) / (1000 * 60 * 60 * 24);
        if (diffDays > daysLimit) return false;
      }
      return true;
    });
  }, [driverSchedules, routeFilter, timeRangeFilter]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTimeline.length === 0) return;
    const headers = ["Date", "Shift", "Route", "Unit Plate", "Unit Body #", "Start Time", "End Time"];
    const rows = filteredTimeline.map((s) => {
      const uId = s.unit?._id || s.unit;
      const unitObj = units.find((u) => u._id === uId) || s.unit || {};
      return [
        s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "N/A",
        s.shiftType || "First Shift",
        s.route || "N/A",
        unitObj.plateNumber || "N/A",
        unitObj.bodyNumber ? `#${unitObj.bodyNumber}` : "N/A",
        s.shiftStart || "N/A",
        s.shiftEnd || "N/A",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `driver_history_${driverName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between bg-slate-50/70 dark:bg-slate-750/70">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                {driverName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {driverName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Driver Work History</p>
              </div>
            </div>

            {/* Current Active Assignment */}
            {currentAssignment && (
              <div className="mt-3 text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-medium block">Current Assignment:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentUnit?.plateNumber || "Unit"}
                  </span>
                  {currentUnit?.bodyNumber && (
                    <span className="text-slate-400">#{currentUnit.bodyNumber}</span>
                  )}
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {currentAssignment.route || "Langgam"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                    {currentAssignment.shiftType || "First Shift"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Stats Summary */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/30">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Route Experience
          </div>
          <div className="grid grid-cols-2 gap-2">
            {routeBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 col-span-2">No historical route records.</div>
            ) : (
              routeBreakdown.map((rb) => (
                <div
                  key={rb.routeKey}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: rb.hex }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {rb.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    {rb.daysCount} {rb.daysCount === 1 ? "day" : "days"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="text-xs font-semibold px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Routes</option>
              {routeBreakdown.map((r) => (
                <option key={r.routeKey} value={r.routeKey}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value)}
              className="text-xs font-semibold px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="30DAYS">Past 30 Days</option>
              <option value="90DAYS">Past 90 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportCSV}
              title="Export CSV"
              className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              title="Print"
              className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Assignment Timeline ({filteredTimeline.length})
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No assignment history found for this filter.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {filteredTimeline.map((item) => {
                const routeKey = (item.route || "LANGGAM").toUpperCase();
                const routeCfg = getRouteConfig(routeKey, customRoutes);
                const uId = item.unit?._id || item.unit;
                const unitObj = units.find((u) => u._id === uId) || item.unit || {};

                return (
                  <div key={item._id} className="relative group">
                    {/* Timeline Dot */}
                    <span
                      className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 shadow-xs"
                      style={{ backgroundColor: routeCfg.hex }}
                    />

                    <div className="bg-white dark:bg-slate-750 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:shadow-xs transition">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        <span>{formatDateFriendly(item.shiftDate)}</span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {item.shiftType || "First Shift"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {unitObj.plateNumber || "NO-PLATE"}
                          </span>
                          {unitObj.bodyNumber && (
                            <span className="text-slate-400 text-[11px]">#{unitObj.bodyNumber}</span>
                          )}
                        </div>

                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                          style={{
                            borderColor: `${routeCfg.hex}40`,
                            backgroundColor: `${routeCfg.hex}15`,
                            color: routeCfg.hex,
                          }}
                        >
                          {routeCfg.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-750/70 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total recorded shifts: <strong>{driverSchedules.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverHistoryDrawer;


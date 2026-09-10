import { useState, useMemo, useEffect } from "react";
import {
  X,
  History,
  Calendar,
  Truck,
  User,
  Download,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Filter
} from "lucide-react";
import { ROUTE_COLORS, getRouteForUnit, formatDateFriendly, formatTimestamp } from "./scheduleConstants";

const ScheduleHistoryDrawer = ({
  isOpen,
  onClose,
  unit,
  allSchedules = [],
  drivers = [],
}) => {
  const [driverFilter, setDriverFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Get all schedules for this specific unit
  const unitSchedules = useMemo(() => {
    if (!unit?._id) return [];
    return allSchedules
      .filter((s) => {
        const uId = s.unit?._id || s.unit;
        return uId === unit._id;
      })
      .sort((a, b) => {
        const dateA = new Date(a.shiftDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.shiftDate || b.createdAt || 0).getTime();
        return dateB - dateA; // Most recent first
      });
  }, [unit, allSchedules]);

  // Current active driver (most recent or today's schedule)
  const currentAssignment = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMatch = unitSchedules.find((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      return sDate === todayStr;
    });
    return todayMatch || unitSchedules[0] || null;
  }, [unitSchedules]);

  // Aggregated driver statistics: total shifts, total days driven
  const driverStats = useMemo(() => {
    const counts = {};
    unitSchedules.forEach((s) => {
      const driverObj = s.driver;
      if (!driverObj) return;
      const dId = driverObj._id || driverObj;
      const dName = driverObj.firstName ? `${driverObj.firstName} ${driverObj.lastName}` : "Unknown Driver";

      if (!counts[dId]) {
        counts[dId] = {
          id: dId,
          name: dName,
          shiftsCount: 0,
          uniqueDays: new Set(),
        };
      }
      counts[dId].shiftsCount += 1;
      if (s.shiftDate) {
        counts[dId].uniqueDays.add(new Date(s.shiftDate).toISOString().slice(0, 10));
      }
    });

    const totalShifts = unitSchedules.length || 1;

    return Object.values(counts)
      .map((item) => ({
        ...item,
        daysCount: item.uniqueDays.size,
        percentage: Math.round((item.shiftsCount / totalShifts) * 100),
      }))
      .sort((a, b) => b.shiftsCount - a.shiftsCount);
  }, [unitSchedules]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    return unitSchedules.filter((s) => {
      const driverObj = s.driver;
      const dId = driverObj?._id || driverObj;
      const dName = driverObj ? `${driverObj.firstName || ""} ${driverObj.lastName || ""}`.toLowerCase() : "";

      if (driverFilter !== "ALL" && dId !== driverFilter) return false;
      if (searchQuery && !dName.includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [unitSchedules, driverFilter, searchQuery]);

  const unitRoute = useMemo(() => {
    return unit ? getRouteForUnit(unit.bodyNumber, unit.route) : "LANGGAM";
  }, [unit]);

  const routeConfig = ROUTE_COLORS[unitRoute] || ROUTE_COLORS.LANGGAM;

  // CSV Export
  const handleExportCSV = () => {
    if (!unitSchedules.length) return;

    const headers = ["Shift Date", "Shift Type", "Route", "Driver Name", "Driver Phone", "Assigned By", "Remarks", "Created At"];
    const rows = unitSchedules.map((s) => {
      const driver = s.driver || {};
      const driverName = driver.firstName ? `${driver.firstName} ${driver.lastName}` : "N/A";
      const assignedBy = s.assignedBy ? (s.assignedBy.firstName ? `${s.assignedBy.firstName} ${s.assignedBy.lastName}` : s.assignedBy.email || "System") : "System";
      return [
        s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "",
        `"${s.shiftType || ""}"`,
        `"${s.route || unitRoute}"`,
        `"${driverName}"`,
        `"${driver.phone || ""}"`,
        `"${assignedBy}"`,
        `"${s.remarks || ""}"`,
        `"${s.createdAt || ""}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `unit-${unit?.bodyNumber || "schedule"}-history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md md:max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Unit {unit?.bodyNumber}
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {unit?.plateNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${routeConfig.dot}`}></span>
                {unitRoute} Route • Full Audit Timeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* Active / Current Status Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-700/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400 block mb-1">
              Latest Recorded Assignment
            </span>
            {currentAssignment ? (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    {currentAssignment.driver
                      ? `${currentAssignment.driver.firstName} ${currentAssignment.driver.lastName}`
                      : "Unassigned"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentAssignment.shiftType} • {formatDateFriendly(currentAssignment.shiftDate)}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200">
                  Active
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No schedules on record for this unit</p>
            )}
          </div>

          {/* Driver Share / Days Driven Leaderboard */}
          {driverStats.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  Driver Allocation ({driverStats.length})
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {unitSchedules.length} Total Shifts
                </span>
              </div>

              <div className="space-y-2">
                {driverStats.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-700/30"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        {item.daysCount} days ({item.shiftsCount} shifts • {item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Filter and Search */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Assignment Timeline
              </span>
              {driverStats.length > 1 && (
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Drivers</option>
                  {driverStats.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Timeline Stream */}
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3.5 space-y-4 my-3">
              {filteredTimeline.length === 0 ? (
                <p className="text-xs text-slate-400 italic pl-5 py-2">
                  No matching assignment history records.
                </p>
              ) : (
                filteredTimeline.map((s, idx) => {
                  const driver = s.driver || {};
                  const driverName = driver.firstName
                    ? `${driver.firstName} ${driver.lastName}`
                    : "Unknown Driver";
                  const isFirstShift = s.shiftType === "First Shift";

                  return (
                    <div key={s._id || idx} className="relative pl-6">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                          isFirstShift ? "bg-amber-500" : "bg-indigo-500"
                        }`}
                      ></div>

                      <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatDateFriendly(s.shiftDate)}
                          </span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                              isFirstShift
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                            }`}
                          >
                            {s.shiftType}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-200 font-medium">
                          Driver: <span className="font-bold">{driverName}</span>
                        </p>

                        {s.remarks && (
                          <p className="text-slate-500 dark:text-slate-400 italic">
                            "{s.remarks}"
                          </p>
                        )}

                        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span>
                            By:{" "}
                            {s.assignedBy
                              ? s.assignedBy.firstName
                                ? `${s.assignedBy.firstName} ${s.assignedBy.lastName}`
                                : s.assignedBy.email || "System"
                              : "System"}
                          </span>
                          <span>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleHistoryDrawer;


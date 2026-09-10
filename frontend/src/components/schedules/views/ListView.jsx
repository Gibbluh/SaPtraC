import { useMemo } from "react";
import {
  MapPin,
  Truck,
  User,
  Plus,
  ArrowRightLeft,
  Trash2,
  History,
  AlertTriangle,
  Clock
} from "lucide-react";
import {
  ROUTE_COLORS,
  SHIFT_TIMES,
  getRouteForUnit,
  formatDateFriendly
} from "../scheduleConstants";

const ListView = ({
  selectedDate,
  units = [],
  schedules = [],
  drivers = [],
  routeFilter = "ALL",
  onQuickAssign,
  onOpenHistory,
  onOpenRouteDetail,
  onDeleteAssignment,
  conflictsByScheduleId = {},
}) => {
  // Schedules for this selected date
  const dateSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      return sDate === selectedDate;
    });
  }, [schedules, selectedDate]);

  // Index by unit + shift
  const schedulesByUnitShift = useMemo(() => {
    const map = {};
    dateSchedules.forEach((s) => {
      const uId = s.unit?._id || s.unit;
      if (uId && s.shiftType) {
        map[`${uId}_${s.shiftType}`] = s;
      }
    });
    return map;
  }, [dateSchedules]);

  // Group units by route
  const routeGroups = useMemo(() => {
    const groups = {
      LANGGAM: [],
      VILLAROSA: [],
      "BAYAN-BAYANAN": [],
      ESTRELLA: [],
      CALAMBA: [],
    };

    units.forEach((u) => {
      const route = getRouteForUnit(u.bodyNumber, u.route);
      if (groups[route]) {
        groups[route].push(u);
      } else {
        if (!groups.OTHER) groups.OTHER = [];
        groups.OTHER.push(u);
      }
    });

    Object.keys(groups).forEach((r) => {
      groups[r].sort((a, b) => {
        const numA = parseInt(a.bodyNumber, 10) || 0;
        const numB = parseInt(b.bodyNumber, 10) || 0;
        return numA - numB;
      });
    });

    return groups;
  }, [units]);

  return (
    <div className="w-full space-y-6">
      {Object.entries(routeGroups).map(([routeKey, routeUnits]) => {
        if (routeFilter !== "ALL" && routeKey !== routeFilter) return null;
        if (routeUnits.length === 0) return null;

        const routeConfig = ROUTE_COLORS[routeKey] || ROUTE_COLORS.LANGGAM;

        // Count assigned shifts for this route
        let assignedCount = 0;
        routeUnits.forEach((u) => {
          if (schedulesByUnitShift[`${u._id}_First Shift`]) assignedCount++;
          if (schedulesByUnitShift[`${u._id}_Second Shift`]) assignedCount++;
        });
        const totalPossible = routeUnits.length * 2;
        const coveragePct = totalPossible > 0 ? Math.round((assignedCount / totalPossible) * 100) : 0;

        return (
          <div
            key={routeKey}
            className="border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-slate-800 shadow-xs overflow-hidden"
          >
            {/* Route Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${routeConfig.dot}`}></span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    {routeConfig.name} Route
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {routeUnits.length} Units • {assignedCount}/{totalPossible} shifts covered ({coveragePct}%)
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenRouteDetail(routeKey)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                Route Overview
              </button>
            </div>

            {/* Units List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {routeUnits.map((unit) => {
                const firstShift = schedulesByUnitShift[`${unit._id}_First Shift`];
                const secondShift = schedulesByUnitShift[`${unit._id}_Second Shift`];
                const isMaintenance = unit.status === "Under Maintenance" || unit.maintenanceStatus === "Maintenance";

                return (
                  <div
                    key={unit._id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition"
                  >
                    {/* Unit Info */}
                    <div className="flex items-center gap-3 min-w-44">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-sm text-slate-800 dark:text-slate-200">
                        {unit.bodyNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            Unit {unit.bodyNumber}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {unit.plateNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                              isMaintenance
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            }`}
                          >
                            {isMaintenance ? "Maintenance" : "Operational"}
                          </span>
                          <button
                            onClick={() => onOpenHistory(unit)}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 hover:underline"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Shifts Grid */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1st Shift Card */}
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/30 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 block w-fit mb-1">
                            1st Shift (05:00 - 13:00)
                          </span>
                          {firstShift ? (
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {firstShift.driver?.firstName
                                ? `${firstShift.driver.firstName} ${firstShift.driver.lastName}`
                                : "Assigned Driver"}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No driver assigned</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {firstShift ? (
                            <>
                              <button
                                onClick={() =>
                                  onQuickAssign({
                                    unitId: unit._id,
                                    dateStr: selectedDate,
                                    shiftType: "First Shift",
                                    driverId: firstShift.driver?._id || firstShift.driver,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                title="Edit / Swap"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteAssignment(firstShift._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                title="Remove assignment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                onQuickAssign({
                                  unitId: unit._id,
                                  dateStr: selectedDate,
                                  shiftType: "First Shift",
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Assign
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2nd Shift Card */}
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/30 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 block w-fit mb-1">
                            2nd Shift (13:00 - 21:00)
                          </span>
                          {secondShift ? (
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {secondShift.driver?.firstName
                                ? `${secondShift.driver.firstName} ${secondShift.driver.lastName}`
                                : "Assigned Driver"}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No driver assigned</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {secondShift ? (
                            <>
                              <button
                                onClick={() =>
                                  onQuickAssign({
                                    unitId: unit._id,
                                    dateStr: selectedDate,
                                    shiftType: "Second Shift",
                                    driverId: secondShift.driver?._id || secondShift.driver,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                title="Edit / Swap"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteAssignment(secondShift._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                title="Remove assignment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                onQuickAssign({
                                  unitId: unit._id,
                                  dateStr: selectedDate,
                                  shiftType: "Second Shift",
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Assign
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;


import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Calendar,
  Truck,
  User,
  Filter,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";
import {
  ROUTES,
  ROUTE_COLORS,
  SHIFT_TIMES,
  getDaysOfWeek,
  getMondayOfWeek,
  formatWeekRangeLabel,
  getRouteForUnit,
  getRouteConfig,
  formatDateFriendly
} from "../scheduleConstants";

/**
 * Level 4: Week Summary View
 * Displays a single route across a full 7-day week schedule table.
 * Strictly focuses on ONE route at a time to prevent visual overload.
 */
const WeekSummaryRouteView = ({
  activeRouteKey = "LANGGAM",
  onChangeRoute,
  allRoutes = ROUTES,
  customRoutes = {},
  currentWeekStartDate,
  onChangeWeek,
  units = [],
  schedules = [],
  drivers = [],
  onAssignSlot,
  onSwapOrAssign,
}) => {
  const [shiftFilter, setShiftFilter] = useState("ALL"); // 'ALL' | 'First Shift' | 'Second Shift'

  const routeConfig = getRouteConfig(activeRouteKey, customRoutes);
  const routeName = routeConfig.name || activeRouteKey;

  // 7 days of the week
  const weekDays = useMemo(() => {
    return getDaysOfWeek(currentWeekStartDate);
  }, [currentWeekStartDate]);

  const weekRangeLabel = useMemo(() => {
    return formatWeekRangeLabel(currentWeekStartDate);
  }, [currentWeekStartDate]);

  // Route units
  const routeUnits = useMemo(() => {
    return units
      .filter((u) => {
        const uRoute = getRouteForUnit(u.bodyNumber, u.route, customRoutes);
        return uRoute === activeRouteKey;
      })
      .sort((a, b) => {
        const numA = parseInt(a.bodyNumber || "999", 10);
        const numB = parseInt(b.bodyNumber || "999", 10);
        return numA - numB;
      });
  }, [units, activeRouteKey, customRoutes]);

  // Week navigation
  const handlePrevWeek = () => {
    const d = new Date(currentWeekStartDate);
    d.setDate(d.getDate() - 7);
    onChangeWeek(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStartDate);
    d.setDate(d.getDate() + 7);
    onChangeWeek(d);
  };

  const handleJumpThisWeek = () => {
    onChangeWeek(getMondayOfWeek(new Date()));
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Unit", "Plate", ...weekDays.map((d) => `${d.dayName} (${d.dateStr})`)];
    const rows = routeUnits.map((u) => {
      const row = [`Unit ${u.bodyNumber || ""}`, u.plateNumber || ""];
      weekDays.forEach((d) => {
        const dayAssignments = schedules.filter((s) => {
          const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
          const sUnitId = s.unit?._id || s.unit;
          return sDate === d.dateStr && sUnitId === u._id;
        });

        const text = dayAssignments
          .map((s) => {
            const drv = s.driver ? `${s.driver.firstName || ""} ${s.driver.lastName || ""}`.trim() : "Driver";
            return `${s.shiftType === "First Shift" ? "1st" : "2nd"}:${drv}`;
          })
          .join(" | ");

        row.push(`"${text || "Unassigned"}"`);
      });
      return row.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Schedule_${activeRouteKey}_${weekDays[0].dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Table
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Route Selector & Week Label */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: routeConfig.hex }}
            />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Route:
            </span>
            <select
              value={activeRouteKey}
              onChange={(e) => onChangeRoute(e.target.value)}
              className="font-bold text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {allRoutes.map((rk) => {
                const conf = getRouteConfig(rk, customRoutes);
                return (
                  <option key={rk} value={rk}>
                    {conf?.name || rk}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Shift Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Shift:
            </span>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Shifts (1st & 2nd)</option>
              <option value="First Shift">1st Shift Only</option>
              <option value="Second Shift">2nd Shift Only</option>
            </select>
          </div>
        </div>

        {/* Week Range Navigation & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-50 dark:bg-slate-750 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrevWeek}
              title="Previous Week"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 px-3">
              {weekRangeLabel}
            </span>

            <button
              type="button"
              onClick={handleNextWeek}
              title="Next Week"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleJumpThisWeek}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            This Week
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Export Week as CSV"
            className="p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="Print Week Summary"
            className="p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7-Day Matrix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4 w-36">UNIT</th>
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className={`py-3 px-2 text-center min-w-[100px] ${
                      day.isToday ? "bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  >
                    <div className="font-semibold text-xs">{day.dayName}</div>
                    <div className="text-[11px] font-normal text-slate-400">
                      {day.monthShort} {day.dayNum}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {routeUnits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No units found assigned to route {routeName}.
                  </td>
                </tr>
              ) : (
                routeUnits.map((unit) => {
                  const isMaintenance =
                    unit.status === "Under Maintenance" ||
                    unit.status === "Maintenance" ||
                    unit.maintenanceStatus === "Maintenance";

                  return (
                    <tr
                      key={unit._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      {/* Unit Column */}
                      <td className="py-3 px-4 align-middle bg-slate-50/40 dark:bg-slate-800/40 border-r border-slate-100 dark:border-slate-700/60">
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          {unit.plateNumber || "NO-PLATE"}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>Unit {unit.bodyNumber}</span>
                          {isMaintenance && (
                            <span className="text-amber-500 font-semibold text-[10px]">
                              (Maint)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Day Columns */}
                      {weekDays.map((day) => {
                        const daySchedules = schedules.filter((s) => {
                          const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
                          const sUnitId = s.unit?._id || s.unit;
                          return sDate === day.dateStr && sUnitId === unit._id;
                        });

                        const firstShift = daySchedules.find((s) => s.shiftType === "First Shift");
                        const secondShift = daySchedules.find((s) => s.shiftType === "Second Shift");

                        return (
                          <td
                            key={day.dateStr}
                            className={`p-1.5 align-middle border-r border-slate-100 dark:border-slate-700/60 last:border-r-0 ${
                              day.isToday ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                            }`}
                          >
                            {isMaintenance ? (
                              <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 text-center text-[11px] text-slate-400 font-medium">
                                Maint
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {/* 1st Shift */}
                                {(shiftFilter === "ALL" || shiftFilter === "First Shift") && (
                                  <WeekDayShiftPill
                                    shiftLabel="1"
                                    schedule={firstShift}
                                    unit={unit}
                                    dateStr={day.dateStr}
                                    shiftType="First Shift"
                                    onSwapOrAssign={onSwapOrAssign}
                                    onClick={() =>
                                      onAssignSlot({
                                        unit,
                                        dateStr: day.dateStr,
                                        shiftType: "First Shift",
                                        currentSchedule: firstShift,
                                        route: activeRouteKey,
                                      })
                                    }
                                  />
                                )}

                                {/* 2nd Shift */}
                                {(shiftFilter === "ALL" || shiftFilter === "Second Shift") && (
                                  <WeekDayShiftPill
                                    shiftLabel="2"
                                    schedule={secondShift}
                                    unit={unit}
                                    dateStr={day.dateStr}
                                    shiftType="Second Shift"
                                    onSwapOrAssign={onSwapOrAssign}
                                    onClick={() =>
                                      onAssignSlot({
                                        unit,
                                        dateStr: day.dateStr,
                                        shiftType: "Second Shift",
                                        currentSchedule: secondShift,
                                        route: activeRouteKey,
                                      })
                                    }
                                  />
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-750 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>
            Displaying 7-day schedule for <strong>{routeName}</strong> ({routeUnits.length} units)
          </span>
          <span className="text-[11px]">
            Click any cell to edit assignment
          </span>
        </div>
      </div>
    </div>
  );
};

const WeekDayShiftPill = ({ shiftLabel, schedule, onClick, unit, dateStr, shiftType, onSwapOrAssign }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const driver = schedule?.driver;
  const driverName = driver ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim() : null;
  const shortName = driver?.firstName || (driverName ? driverName.split(" ")[0] : null);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        sourceScheduleId: schedule?._id,
        sourceDriverId: driver?._id,
        sourceUnitId: unit?._id,
        sourceShiftType: shiftType,
        sourceDateStr: dateStr, // need to pass date since weekly view handles multiple dates
      })
    );
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      // Make sure we only swap if it's the same day in the weekly board OR if we allow cross-day swap.
      // Wait, we need the onSwapOrAssign function to know the date!
      if (data.sourceDriverId && onSwapOrAssign) {
        onSwapOrAssign(data, {
          targetScheduleId: schedule?._id,
          targetUnitId: unit?._id,
          targetShiftType: shiftType,
          targetDateStr: dateStr,
        });
      }
    } catch (err) {
      console.error("Drop parsing failed", err);
    }
  };

  if (shortName) {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onClick}
        title={`${shiftLabel === "1" ? "1st Shift" : "2nd Shift"}: ${driverName}`}
        className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center justify-between gap-1 cursor-grab active:cursor-grabbing transition truncate ${
          isDragging ? "opacity-50 scale-95" : ""
        } ${
          isDragOver
            ? "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/60"
            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
        }`}
      >
        <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
          {shiftLabel}:
        </span>
        <span className="truncate">{shortName}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`px-2 py-1 rounded-md border text-[11px] flex items-center justify-between cursor-pointer transition ${
        isDragOver
          ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-500/50"
          : "border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50"
      }`}
    >
      <span className="text-[10px]">{shiftLabel}:</span>
      <span className="text-[10px]">—</span>
    </div>
  );
};

export default WeekSummaryRouteView;


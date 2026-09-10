import { useMemo } from "react";
import {
  Clock,
  MapPin,
  Truck,
  User,
  Plus
} from "lucide-react";
import { ROUTE_COLORS, SHIFT_TIMES, getRouteForUnit, formatDateFriendly } from "../scheduleConstants";

const DayTimelineView = ({
  selectedDate,
  units = [],
  schedules = [],
  routeFilter = "ALL",
  onQuickAssign,
  onOpenHistory,
}) => {
  const hours = [
    "04:00", "05:00", "06:00", "07:00", "08:00", "09:00",
    "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];

  // Total span is from 04:00 to 22:00 = 18 hours
  const totalHours = 18;

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const route = getRouteForUnit(u.bodyNumber, u.route);
      if (routeFilter !== "ALL" && route !== routeFilter) return false;
      return true;
    });
  }, [units, routeFilter]);

  // Index schedules for this date by unit
  const schedulesByUnit = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      if (sDate === selectedDate) {
        const uId = s.unit?._id || s.unit;
        if (!map[uId]) map[uId] = [];
        map[uId].push(s);
      }
    });
    return map;
  }, [schedules, selectedDate]);

  return (
    <div className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 shadow-xs overflow-hidden flex flex-col select-none">
      {/* Timeline Header Info */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Operational Gantt Timeline • {formatDateFriendly(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500">
              Shift handover marker at 13:00 (1:00 PM)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
            <span className="text-slate-600 dark:text-slate-300">1st Shift (05:00 - 13:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-500"></span>
            <span className="text-slate-600 dark:text-slate-300">2nd Shift (13:00 - 21:00)</span>
          </div>
        </div>
      </div>

      {/* Scrollable Horizontal Gantt */}
      <div className="overflow-x-auto">
        <div className="min-w-[950px]">
          {/* Hours Ruler Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-700/50 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <div className="w-48 shrink-0 p-3 border-r border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-700/80 sticky left-0 z-10">
              Unit & Route
            </div>
            <div className="flex-1 grid grid-cols-18 relative">
              {hours.slice(0, 18).map((hour, idx) => (
                <div
                  key={hour}
                  className={`p-2.5 text-center border-r border-slate-200/60 dark:border-slate-700/40 ${
                    hour === "13:00" ? "bg-blue-100/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" : ""
                  }`}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Unit Rows with Visual Gantt Blocks */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredUnits.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No units found for the selected route filter.
              </div>
            ) : (
              filteredUnits.map((unit) => {
                const route = getRouteForUnit(unit.bodyNumber, unit.route);
                const rConfig = ROUTE_COLORS[route] || ROUTE_COLORS.LANGGAM;
                const unitSchedules = schedulesByUnit[unit._id] || [];

                const firstShift = unitSchedules.find((s) => s.shiftType === "First Shift");
                const secondShift = unitSchedules.find((s) => s.shiftType === "Second Shift");

                return (
                  <div key={unit._id} className="flex hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                    {/* Unit Label (Sticky) */}
                    <div className="w-48 shrink-0 p-3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky left-0 z-10 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${rConfig.dot}`}></span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            Unit {unit.bodyNumber}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {unit.plateNumber}
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenHistory(unit)}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        History
                      </button>
                    </div>

                    {/* Timeline Canvas Area */}
                    <div className="flex-1 relative h-14 bg-slate-50/20 dark:bg-slate-800/30">
                      {/* Handover vertical line at 13:00 (9 hours from 04:00 -> 9/18 = 50%) */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-400/80 z-10 dashed"
                        style={{ left: `${(9 / 18) * 100}%` }}
                        title="Shift Handover Marker (13:00)"
                      ></div>

                      {/* 1st Shift Block: 05:00 to 13:00 = 8 hours. Starts 1h after 04:00 -> left: 1/18 (5.55%), width: 8/18 (44.44%) */}
                      {firstShift ? (
                        <div
                          onClick={() =>
                            onQuickAssign({
                              unitId: unit._id,
                              dateStr: selectedDate,
                              shiftType: "First Shift",
                              driverId: firstShift.driver?._id || firstShift.driver,
                            })
                          }
                          className="absolute top-2 bottom-2 rounded-xl p-2 flex items-center justify-between text-white text-xs font-bold shadow-xs cursor-pointer hover:brightness-110 transition bg-amber-500"
                          style={{
                            left: `${(1 / 18) * 100}%`,
                            width: `${(8 / 18) * 100}%`,
                          }}
                        >
                          <div className="truncate flex items-center gap-1">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {firstShift.driver?.firstName
                                ? `${firstShift.driver.firstName} ${firstShift.driver.lastName}`
                                : "Assigned Driver"}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 shrink-0 font-mono">1st Shift</span>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            onQuickAssign({
                              unitId: unit._id,
                              dateStr: selectedDate,
                              shiftType: "First Shift",
                            })
                          }
                          className="absolute top-2 bottom-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60 hover:bg-amber-50/40 text-amber-600 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                          style={{
                            left: `${(1 / 18) * 100}%`,
                            width: `${(8 / 18) * 100}%`,
                          }}
                        >
                          <Plus className="w-3 h-3" /> Assign 1st (05:00-13:00)
                        </button>
                      )}

                      {/* 2nd Shift Block: 13:00 to 21:00 = 8 hours. Starts 9h after 04:00 -> left: 9/18 (50%), width: 8/18 (44.44%) */}
                      {secondShift ? (
                        <div
                          onClick={() =>
                            onQuickAssign({
                              unitId: unit._id,
                              dateStr: selectedDate,
                              shiftType: "Second Shift",
                              driverId: secondShift.driver?._id || secondShift.driver,
                            })
                          }
                          className="absolute top-2 bottom-2 rounded-xl p-2 flex items-center justify-between text-white text-xs font-bold shadow-xs cursor-pointer hover:brightness-110 transition bg-indigo-500"
                          style={{
                            left: `${(9 / 18) * 100}%`,
                            width: `${(8 / 18) * 100}%`,
                          }}
                        >
                          <div className="truncate flex items-center gap-1">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {secondShift.driver?.firstName
                                ? `${secondShift.driver.firstName} ${secondShift.driver.lastName}`
                                : "Assigned Driver"}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 shrink-0 font-mono">2nd Shift</span>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            onQuickAssign({
                              unitId: unit._id,
                              dateStr: selectedDate,
                              shiftType: "Second Shift",
                            })
                          }
                          className="absolute top-2 bottom-2 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700/60 hover:bg-indigo-50/40 text-indigo-600 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                          style={{
                            left: `${(9 / 18) * 100}%`,
                            width: `${(8 / 18) * 100}%`,
                          }}
                        >
                          <Plus className="w-3 h-3" /> Assign 2nd (13:00-21:00)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayTimelineView;


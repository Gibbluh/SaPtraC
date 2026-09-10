import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Truck,
  Plus
} from "lucide-react";
import { ROUTE_COLORS, getRouteForUnit } from "../scheduleConstants";

const MonthCalendarView = ({
  activeDate,
  schedules = [],
  units = [],
  onSelectDate,
  onQuickAssign,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date(activeDate || new Date());
    d.setDate(1);
    return d;
  });

  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  // Month grid calculation
  const { daysGrid, monthTitle } = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth(); // 0-indexed

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday is first day of week: 0 -> Sun (6), 1 -> Mon (0), etc.
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const totalDaysInMonth = lastDay.getDate();

    const days = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        dayNum,
        isCurrentMonth: false,
        isToday: d.toISOString().slice(0, 10) === todayStr,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        dayNum: i,
        isCurrentMonth: false,
        isToday: d.toISOString().slice(0, 10) === todayStr,
      });
    }

    const title = currentMonthDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return { daysGrid: days, monthTitle: title };
  }, [currentMonthDate]);

  // Aggregate schedules by date & route
  const schedulesByDate = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const dateStr = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      if (!dateStr) return;

      if (!map[dateStr]) {
        map[dateStr] = {
          total: 0,
          byRoute: {},
          items: [],
        };
      }

      map[dateStr].total += 1;
      map[dateStr].items.push(s);

      const u = s.unit;
      const route = getRouteForUnit(u?.bodyNumber, s.route || u?.route);
      map[dateStr].byRoute[route] = (map[dateStr].byRoute[route] || 0) + 1;
    });
    return map;
  }, [schedules]);

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleToday = () => {
    const d = new Date();
    d.setDate(1);
    setCurrentMonthDate(d);
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Month Navigation Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {monthTitle}
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Notion Calendar Style Overview
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            This Month
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* 7-Day Month Grid */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 shadow-xs overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-center py-2.5 text-xs font-black uppercase tracking-wider text-slate-400">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-700/60">
          {daysGrid.map((day) => {
            const dayData = schedulesByDate[day.dateStr] || { total: 0, byRoute: {}, items: [] };

            return (
              <div
                key={day.dateStr}
                onClick={() => {
                  if (onSelectDate) onSelectDate(day.dateStr);
                  setSelectedDayDetails({
                    dateStr: day.dateStr,
                    dayNum: day.dayNum,
                    ...dayData,
                  });
                }}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                  day.isCurrentMonth
                    ? "bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
                    : "bg-slate-50/40 dark:bg-slate-800/40 text-slate-400 hover:bg-slate-100/50"
                } ${day.isToday ? "ring-2 ring-blue-500 ring-inset" : ""}`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      day.isToday
                        ? "bg-blue-600 text-white"
                        : day.isCurrentMonth
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {day.dayNum}
                  </span>

                  {dayData.total > 0 && (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {dayData.total} shifts
                    </span>
                  )}
                </div>

                {/* Route breakdown chips */}
                <div className="space-y-1 my-1 flex-1">
                  {Object.entries(dayData.byRoute).slice(0, 3).map(([route, count]) => {
                    const rConfig = ROUTE_COLORS[route] || ROUTE_COLORS.LANGGAM;
                    return (
                      <div
                        key={route}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center justify-between ${rConfig.chipBg}`}
                      >
                        <span className="truncate">{rConfig.name}</span>
                        <span className="font-bold shrink-0">{count}</span>
                      </div>
                    );
                  })}
                  {Object.keys(dayData.byRoute).length > 3 && (
                    <span className="text-[9px] text-slate-400 block text-right font-medium">
                      +{Object.keys(dayData.byRoute).length - 3} more
                    </span>
                  )}
                </div>

                {/* Bottom hover affordance */}
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                  <span>View day</span>
                  <span className="text-xs">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Day Drawer / Detail Modal */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Schedule Overview for {selectedDayDetails.dateStr}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayDetails.total} Total Assignments Scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
              {selectedDayDetails.items.length === 0 ? (
                <p className="text-slate-400 italic py-4 text-center">
                  No assignments scheduled on this date.
                </p>
              ) : (
                selectedDayDetails.items.map((s) => {
                  const driver = s.driver || {};
                  const unit = s.unit || {};
                  const route = getRouteForUnit(unit.bodyNumber, s.route);
                  const rConfig = ROUTE_COLORS[route] || ROUTE_COLORS.LANGGAM;

                  return (
                    <div
                      key={s._id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${rConfig.dot}`}></span>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Unit {unit.bodyNumber || "N/A"} ({unit.plateNumber || "N/A"})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {driver.firstName ? `${driver.firstName} ${driver.lastName}` : "Unassigned"} • {s.shiftType}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rConfig.chipBg}`}>
                        {route}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthCalendarView;


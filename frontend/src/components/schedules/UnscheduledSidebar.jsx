import { useState, useMemo } from "react";
import {
  Users,
  Truck,
  Search,
  GripVertical,
  X,
  ChevronRight,
  Phone,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react";
import { ROUTE_COLORS, getRouteForUnit } from "./scheduleConstants";

const UnscheduledSidebar = ({
  isOpen,
  onClose,
  drivers = [],
  units = [],
  schedules = [],
  selectedDate,
  selectedShift,
  onQuickAssign,
  onDriverDragStart,
}) => {
  const [activeTab, setActiveTab] = useState("DRIVERS"); // 'DRIVERS' | 'UNITS'
  const [search, setSearch] = useState("");

  // Unscheduled Drivers for selected date & shift
  const unscheduledDrivers = useMemo(() => {
    const scheduledDriverIds = new Set();
    schedules.forEach((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      if (sDate === selectedDate) {
        if (!selectedShift || s.shiftType === selectedShift) {
          const dId = s.driver?._id || s.driver;
          if (dId) scheduledDriverIds.add(dId);
        }
      }
    });

    return drivers
      .filter((d) => !scheduledDriverIds.has(d._id))
      .filter((d) => {
        const name = `${d.firstName || ""} ${d.lastName || ""}`.toLowerCase();
        return name.includes(search.toLowerCase()) || (d.phone && d.phone.includes(search));
      });
  }, [drivers, schedules, selectedDate, selectedShift, search]);

  // Idle Units (Units with missing assignments on selected date)
  const idleUnits = useMemo(() => {
    return units
      .map((u) => {
        const assignedShifts = schedules.filter((s) => {
          const uId = s.unit?._id || s.unit;
          const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
          return uId === u._id && sDate === selectedDate;
        });

        const hasFirst = assignedShifts.some((s) => s.shiftType === "First Shift");
        const hasSecond = assignedShifts.some((s) => s.shiftType === "Second Shift");
        const route = getRouteForUnit(u.bodyNumber, u.route);

        return {
          ...u,
          route,
          assignedCount: assignedShifts.length,
          missingFirst: !hasFirst,
          missingSecond: !hasSecond,
        };
      })
      .filter((u) => u.assignedCount < 2)
      .filter((u) => {
        const str = `Unit ${u.bodyNumber} ${u.plateNumber} ${u.route}`.toLowerCase();
        return str.includes(search.toLowerCase());
      });
  }, [units, schedules, selectedDate, search]);

  if (!isOpen) return null;

  return (
    <aside className="w-80 shrink-0 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col h-full shadow-lg transition-all duration-200 animate-in slide-in-from-right-10">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Unscheduled Resources
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Drag drivers directly to board
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/50 p-1 gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab("DRIVERS")}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === "DRIVERS"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Drivers ({unscheduledDrivers.length})
        </button>

        <button
          onClick={() => setActiveTab("UNITS")}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === "UNITS"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Idle Units ({idleUnits.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "DRIVERS" ? "Filter unscheduled drivers..." : "Filter idle units..."}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Resource Cards Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {activeTab === "DRIVERS" ? (
          unscheduledDrivers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic">
              All active drivers are scheduled!
            </div>
          ) : (
            unscheduledDrivers.map((driver) => (
              <div
                key={driver._id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({
                      type: "UNSCHEDULED_DRIVER",
                      driverId: driver._id,
                      driverName: `${driver.firstName} ${driver.lastName}`,
                    })
                  );
                  if (onDriverDragStart) onDriverDragStart(driver);
                }}
                className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition cursor-grab active:cursor-grabbing flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                  <div
                    className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0"
                  >
                    {driver.firstName[0]}
                    {driver.lastName[0]}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {driver.firstName} {driver.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" />
                      {driver.phone || "No phone"}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0">
                  Drag ⤑
                </span>
              </div>
            ))
          )
        ) : (
          idleUnits.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic">
              All units are 100% scheduled!
            </div>
          ) : (
            idleUnits.map((unit) => {
              const routeConf = ROUTE_COLORS[unit.route] || ROUTE_COLORS.LANGGAM;
              return (
                <div
                  key={unit._id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/40 hover:border-blue-400 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Unit {unit.bodyNumber}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {unit.plateNumber}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${routeConf.chipBg}`}>
                      {unit.route}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Needs:</span>
                    {unit.missingFirst && (
                      <button
                        onClick={() =>
                          onQuickAssign({
                            unitId: unit._id,
                            dateStr: selectedDate,
                            shiftType: "First Shift",
                          })
                        }
                        className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded font-bold transition"
                      >
                        + 1st Shift
                      </button>
                    )}
                    {unit.missingSecond && (
                      <button
                        onClick={() =>
                          onQuickAssign({
                            unitId: unit._id,
                            dateStr: selectedDate,
                            shiftType: "Second Shift",
                          })
                        }
                        className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded font-bold transition"
                      >
                        + 2nd Shift
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Quick stats footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Active Date: {selectedDate}</span>
        <span className="text-blue-600 font-semibold">Press 'B' to toggle</span>
      </div>
    </aside>
  );
};

export default UnscheduledSidebar;


import { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Truck,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  AlertCircle
} from "lucide-react";
import { ROUTE_COLORS, SHIFT_TIMES, formatDateFriendly, getRouteForUnit } from "./scheduleConstants";

const QuickAssignModal = ({
  isOpen,
  onClose,
  initialData = {}, // { unitId, dateStr, shiftType, driverId }
  units = [],
  drivers = [],
  schedules = [],
  onAssign,
  isSubmitting = false,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState(initialData.unitId || "");
  const [selectedDate, setSelectedDate] = useState(initialData.dateStr || new Date().toISOString().slice(0, 10));
  const [selectedShift, setSelectedShift] = useState(initialData.shiftType || "First Shift");
  const [selectedDriverId, setSelectedDriverId] = useState(initialData.driverId || "");
  const [driverSearch, setDriverSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [remarks, setRemarks] = useState("");

  // Sync when initialData changes
  useEffect(() => {
    if (isOpen) {
      setSelectedUnitId(initialData.unitId || (units[0]?._id || ""));
      setSelectedDate(initialData.dateStr || new Date().toISOString().slice(0, 10));
      setSelectedShift(initialData.shiftType || "First Shift");
      setSelectedDriverId(initialData.driverId || "");
      setDriverSearch("");
      setUnitSearch("");
      setRemarks("");
    }
  }, [isOpen, initialData, units]);

  const selectedUnit = useMemo(() => {
    return units.find((u) => u._id === selectedUnitId);
  }, [units, selectedUnitId]);

  const unitRoute = useMemo(() => {
    return selectedUnit ? getRouteForUnit(selectedUnit.bodyNumber, selectedUnit.route) : "LANGGAM";
  }, [selectedUnit]);

  const routeConfig = ROUTE_COLORS[unitRoute] || ROUTE_COLORS.LANGGAM;

  // Conflict Checking Engine for Selected Date & Shift
  const conflicts = useMemo(() => {
    if (!selectedDate) return { hasConflict: false, messages: [], type: "none" };

    const msgs = [];
    let severity = "none"; // 'error' | 'warning' | 'none'

    // Check if unit is in maintenance
    if (selectedUnit && (selectedUnit.status === "Under Maintenance" || selectedUnit.maintenanceStatus === "Maintenance")) {
      msgs.push({
        type: "error",
        text: `Unit ${selectedUnit.bodyNumber} (${selectedUnit.plateNumber}) is currently in maintenance.`,
      });
      severity = "error";
    }

    if (selectedDriverId) {
      const driver = drivers.find((d) => d._id === selectedDriverId);
      const driverName = driver ? `${driver.firstName} ${driver.lastName}` : "Driver";

      // 1. Check if driver is already scheduled on same day & same shift on another unit
      const sameShiftConflict = schedules.find((s) => {
        const sUnitId = s.unit?._id || s.unit;
        const sDriverId = s.driver?._id || s.driver;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        return (
          sDriverId === selectedDriverId &&
          sDate === selectedDate &&
          s.shiftType === selectedShift &&
          sUnitId !== selectedUnitId
        );
      });

      if (sameShiftConflict) {
        const otherUnit = units.find((u) => u._id === (sameShiftConflict.unit?._id || sameShiftConflict.unit));
        msgs.push({
          type: "error",
          text: `${driverName} is already scheduled on ${otherUnit ? `Unit ${otherUnit.bodyNumber}` : "another unit"} for ${selectedShift}.`,
        });
        severity = "error";
      }

      // 2. Check if driver is working double shift on the same day
      const altShift = selectedShift === "First Shift" ? "Second Shift" : "First Shift";
      const doubleShiftConflict = schedules.find((s) => {
        const sDriverId = s.driver?._id || s.driver;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        return sDriverId === selectedDriverId && sDate === selectedDate && s.shiftType === altShift;
      });

      if (doubleShiftConflict) {
        msgs.push({
          type: "warning",
          text: `Notice: ${driverName} is already scheduled for ${altShift} on this day (Double Shift).`,
        });
        if (severity !== "error") severity = "warning";
      }
    }

    return {
      hasConflict: msgs.length > 0,
      hasError: msgs.some((m) => m.type === "error"),
      messages: msgs,
    };
  }, [selectedDriverId, selectedUnitId, selectedDate, selectedShift, schedules, drivers, units, selectedUnit]);

  // Driver list with availability status
  const driverStatusList = useMemo(() => {
    return drivers.map((driver) => {
      const fullName = `${driver.firstName} ${driver.lastName}`;

      // Check assignment on this date & shift
      const isAssignedSameShift = schedules.some((s) => {
        const sDriverId = s.driver?._id || s.driver;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        return sDriverId === driver._id && sDate === selectedDate && s.shiftType === selectedShift;
      });

      const isAssignedOtherShift = schedules.some((s) => {
        const sDriverId = s.driver?._id || s.driver;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        const altShift = selectedShift === "First Shift" ? "Second Shift" : "First Shift";
        return sDriverId === driver._id && sDate === selectedDate && s.shiftType === altShift;
      });

      let statusLabel = "Available";
      let statusColor = "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200";

      if (driver.status === "On Leave" || driver.onLeave) {
        statusLabel = "On Leave";
        statusColor = "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200";
      } else if (isAssignedSameShift) {
        statusLabel = "Busy (Assigned)";
        statusColor = "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200";
      } else if (isAssignedOtherShift) {
        statusLabel = "Double Shift";
        statusColor = "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200";
      }

      return {
        ...driver,
        fullName,
        isAssignedSameShift,
        isAssignedOtherShift,
        statusLabel,
        statusColor,
      };
    });
  }, [drivers, schedules, selectedDate, selectedShift]);

  // Filtered drivers based on search
  const filteredDrivers = useMemo(() => {
    return driverStatusList.filter((d) =>
      d.fullName.toLowerCase().includes(driverSearch.toLowerCase()) ||
      (d.phone && d.phone.includes(driverSearch))
    );
  }, [driverStatusList, driverSearch]);

  // Auto-suggest: Top 3 frequent driver pairings for this unit
  const autoSuggestedDrivers = useMemo(() => {
    if (!selectedUnitId) return [];
    const counts = {};
    schedules.forEach((s) => {
      const uId = s.unit?._id || s.unit;
      const dId = s.driver?._id || s.driver;
      if (uId === selectedUnitId && dId) {
        counts[dId] = (counts[dId] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dId, count]) => {
        const d = drivers.find((drv) => drv._id === dId);
        return d ? { ...d, count } : null;
      })
      .filter(Boolean);
  }, [selectedUnitId, schedules, drivers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUnitId) return;
    if (conflicts.hasError) return;

    onAssign({
      unitId: selectedUnitId,
      driverId: selectedDriverId || null,
      dateStr: selectedDate,
      shiftType: selectedShift,
      route: unitRoute,
      remarks,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Quick Assignment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cal.com-inspired fast resource dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Slot Context Bar */}
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                Date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-0.5 w-full text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                Shift
              </span>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
              >
                <option value="First Shift">1st (05:00-13:00)</option>
                <option value="Second Shift">2nd (13:00-21:00)</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                Route
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${routeConfig.tailwindText}`}>
                <span className={`w-2 h-2 rounded-full ${routeConfig.dot}`}></span>
                {unitRoute}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                Unit
              </span>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer font-mono"
              >
                {units.map((u) => (
                  <option key={u._id} value={u._id}>
                    Unit {u.bodyNumber} ({u.plateNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conflict Warnings */}
          {conflicts.hasConflict && (
            <div className="space-y-2">
              {conflicts.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    msg.type === "error"
                      ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                      : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{msg.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Auto-suggested Frequent Pairings */}
          {autoSuggestedDrivers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Frequent Drivers for Unit {selectedUnit?.bodyNumber}
              </div>
              <div className="flex flex-wrap gap-2">
                {autoSuggestedDrivers.map((d) => (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => setSelectedDriverId(d._id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                      selectedDriverId === d._id
                        ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:border-blue-400 dark:text-blue-300"
                        : "bg-white dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span>{d.firstName} {d.lastName}</span>
                    <span className="text-[10px] text-slate-400">({d.count}x)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Driver Selection & Search */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Select Driver
              </label>
              <button
                type="button"
                onClick={() => setSelectedDriverId("")}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Clear (Unassign)
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Search driver by name or phone..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Drivers scrollable container */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredDrivers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No drivers matching search query
                </div>
              ) : (
                filteredDrivers.map((d) => {
                  const isSelected = selectedDriverId === d._id;
                  return (
                    <button
                      key={d._id}
                      type="button"
                      onClick={() => setSelectedDriverId(d._id)}
                      className={`w-full p-2.5 text-left flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-blue-50/80 dark:bg-blue-950/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {d.firstName[0]}
                          {d.lastName[0]}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {d.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {d.phone || "No phone"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${d.statusColor}`}
                        >
                          {d.statusLabel}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Covering for shift rotation, Early departure"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || conflicts.hasError}
              className={`px-5 py-2 text-xs font-bold rounded-xl shadow-sm text-white flex items-center gap-2 transition active:scale-95 ${
                conflicts.hasError
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Assigning...
                </>
              ) : selectedDriverId ? (
                "Assign Driver"
              ) : (
                "Save Empty Slot"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAssignModal;


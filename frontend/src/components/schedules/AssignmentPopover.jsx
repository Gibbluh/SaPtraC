import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Truck,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Trash2,
  ArrowRightLeft,
  AlertCircle
} from "lucide-react";
import {
  ROUTE_COLORS,
  SHIFT_TIMES,
  formatDateFriendly,
  getRouteForUnit
} from "./scheduleConstants";

/**
 * Level 3: Assignment Popover / Modal
 * Allows rapid, conflict-aware driver dispatching to a specific unit & shift.
 */
const AssignmentPopover = ({
  isOpen,
  onClose,
  initialData = {}, // { unit, dateStr, shiftType, currentSchedule, route }
  units = [],
  drivers = [],
  schedules = [],
  onAssign,
  onRemove,
  isSubmitting = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isReassignOverride, setIsReassignOverride] = useState(false);
  const searchInputRef = useRef(null);

  const unit = initialData.unit || null;
  const dateStr = initialData.dateStr || new Date().toISOString().slice(0, 10);
  const shiftType = initialData.shiftType || "First Shift";
  const currentSchedule = initialData.currentSchedule || null;

  const unitRoute = useMemo(() => {
    if (initialData.route) return initialData.route.toUpperCase();
    if (unit) return getRouteForUnit(unit.bodyNumber, unit.route);
    return "LANGGAM";
  }, [initialData.route, unit]);

  const routeConfig = ROUTE_COLORS[unitRoute] || ROUTE_COLORS.LANGGAM;
  const shiftConfig = SHIFT_TIMES[shiftType] || SHIFT_TIMES["First Shift"];

  // Initialize selected driver from current schedule when opened
  useEffect(() => {
    if (isOpen) {
      const existingDriverId = currentSchedule?.driver?._id || currentSchedule?.driver || "";
      setSelectedDriverId(existingDriverId);
      setSearchQuery("");
      setIsReassignOverride(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentSchedule]);

  // Top 3 Frequent Drivers for this unit
  const frequentDrivers = useMemo(() => {
    if (!unit?._id) return [];
    const counts = {};
    schedules.forEach((s) => {
      const uId = s.unit?._id || s.unit;
      const dId = s.driver?._id || s.driver;
      if (uId === unit._id && dId) {
        counts[dId] = (counts[dId] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dId, count]) => {
        const d = drivers.find((drv) => drv._id === dId);
        return d ? { ...d, frequencyCount: count } : null;
      })
      .filter(Boolean);
  }, [unit, schedules, drivers]);

  // Evaluate status and conflicts for each driver on this date & shift
  const driverStatusList = useMemo(() => {
    return drivers.map((driver) => {
      const fullName = `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || "Driver";

      // Check if driver is assigned on the same day & same shift
      const sameShiftAssignment = schedules.find((s) => {
        const sDriverId = s.driver?._id || s.driver;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        return sDriverId === driver._id && sDate === dateStr && s.shiftType === shiftType;
      });

      // Check if driver is assigned on the same day & other shift (double shift)
      const altShift = shiftType === "First Shift" ? "Second Shift" : "First Shift";
      const otherShiftAssignment = schedules.find((s) => {
        const sDriverId = s.driver?._id || s.driver;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        return sDriverId === driver._id && sDate === dateStr && s.shiftType === altShift;
      });

      const isCurrentSlotDriver = currentSchedule && (currentSchedule.driver?._id || currentSchedule.driver) === driver._id;

      let status = "available"; // "available" | "on_leave" | "assigned" | "current"
      let statusDetail = "";
      let conflictScheduleId = null;

      if (isCurrentSlotDriver) {
        status = "current";
        statusDetail = "Currently assigned to this slot";
      } else if (driver.status === "On Leave" || driver.onLeave) {
        status = "on_leave";
        statusDetail = "On Leave";
      } else if (sameShiftAssignment) {
        status = "assigned";
        conflictScheduleId = sameShiftAssignment._id;
        const assignedUnit = units.find(
          (u) => u._id === (sameShiftAssignment.unit?._id || sameShiftAssignment.unit)
        );
        const assignedUnitName = assignedUnit
          ? `Unit ${assignedUnit.bodyNumber || assignedUnit.plateNumber}`
          : "another unit";
        const assignedRoute = sameShiftAssignment.route || "another route";
        statusDetail = `Assigned to ${assignedUnitName} on ${assignedRoute}`;
      } else if (otherShiftAssignment) {
        status = "double_shift";
        statusDetail = `Scheduled for ${altShift} (Double Shift)`;
      }

      return {
        ...driver,
        fullName,
        status,
        statusDetail,
        sameShiftAssignment,
        conflictScheduleId,
      };
    });
  }, [drivers, schedules, dateStr, shiftType, currentSchedule, units]);

  // Filtered drivers by search query
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return driverStatusList;
    const q = searchQuery.toLowerCase();
    return driverStatusList.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        (d.phone && d.phone.includes(q)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
    );
  }, [driverStatusList, searchQuery]);

  // Currently selected driver details
  const selectedDriver = useMemo(() => {
    return driverStatusList.find((d) => d._id === selectedDriverId) || null;
  }, [driverStatusList, selectedDriverId]);

  // Check if selected driver has a conflict
  const hasConflict = selectedDriver && selectedDriver.status === "assigned";

  // Handle Assign submission
  const handleAssign = (e) => {
    e?.preventDefault();
    if (!selectedDriverId || !unit?._id) return;

    onAssign({
      unitId: unit._id,
      driverId: selectedDriverId,
      dateStr,
      shiftType,
      route: unitRoute,
      existingScheduleId: currentSchedule?._id || null,
      reassignScheduleId: isReassignOverride ? selectedDriver.conflictScheduleId : null,
    });
  };

  // Handle Remove submission
  const handleRemove = () => {
    if (!currentSchedule?._id) return;
    onRemove(currentSchedule._id);
  };

  if (!isOpen || !unit) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Assign Driver
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select or reassign driver for this shift
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Context Summary */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-xs grid grid-cols-2 gap-y-1.5 gap-x-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Unit:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {unit.plateNumber || "N/A"}
            </span>
            {unit.bodyNumber && (
              <span className="text-[11px] text-slate-500">
                (#{unit.bodyNumber})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Route:</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${routeConfig.tailwindText}`}>
              <span className={`w-2 h-2 rounded-full ${routeConfig.dot}`}></span>
              {routeConfig.name || unitRoute}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Shift:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {shiftConfig.label} ({shiftConfig.start} - {shiftConfig.end})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Day:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatDateFriendly(dateStr)}
            </span>
          </div>
        </div>

        {/* Frequent / Recommended Drivers */}
        {frequentDrivers.length > 0 && !searchQuery && (
          <div className="px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Frequent Drivers for this Unit</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {frequentDrivers.map((fd) => {
                const isSelected = selectedDriverId === fd._id;
                return (
                  <button
                    key={fd._id}
                    type="button"
                    onClick={() => {
                      setSelectedDriverId(fd._id);
                      setIsReassignOverride(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <span>
                      {fd.firstName} {fd.lastName}
                    </span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      {fd.frequencyCount}x
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Driver Search Filter */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search driver by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Drivers List */}
        <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredDrivers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No drivers match "{searchQuery}"
            </div>
          ) : (
            filteredDrivers.map((driver) => {
              const isSelected = selectedDriverId === driver._id;
              const isAssigned = driver.status === "assigned";
              const isOnLeave = driver.status === "on_leave";
              const isCurrent = driver.status === "current";

              return (
                <div
                  key={driver._id}
                  onClick={() => {
                    setSelectedDriverId(driver._id);
                    if (!isAssigned) setIsReassignOverride(false);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-2xs"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {driver.fullName}
                        </span>
                        {driver.phone && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {driver.phone}
                          </span>
                        )}
                      </div>
                      {driver.statusDetail && (
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isAssigned
                              ? "text-rose-600 dark:text-rose-400 font-medium"
                              : isOnLeave
                              ? "text-amber-600 dark:text-amber-400 font-medium"
                              : isCurrent
                              ? "text-blue-600 dark:text-blue-400 font-medium"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {driver.statusDetail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator Icon */}
                  <div className="shrink-0 flex items-center">
                    {driver.status === "available" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Available
                      </span>
                    )}
                    {driver.status === "current" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                        Assigned
                      </span>
                    )}
                    {driver.status === "on_leave" && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        — On Leave
                      </span>
                    )}
                    {driver.status === "assigned" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3" />
                        Busy
                      </span>
                    )}
                    {driver.status === "double_shift" && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        Double Shift
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Conflict Warning & Reassign Override Banner */}
        {hasConflict && (
          <div className="px-5 py-3 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold leading-tight">
                  {selectedDriver.fullName} is already assigned on this shift.
                </p>
                <p className="text-[11px] mt-0.5 text-rose-700 dark:text-rose-400">
                  {selectedDriver.statusDetail}. Assigning here will transfer them from their previous unit.
                </p>
                <label className="mt-2 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isReassignOverride}
                    onChange={(e) => setIsReassignOverride(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 border-rose-300 w-3.5 h-3.5"
                  />
                  <span className="font-medium text-[11px]">
                    Confirm reassign and transfer driver
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-3">
          {currentSchedule ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Assignment</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAssign}
              disabled={
                !selectedDriverId ||
                isSubmitting ||
                (hasConflict && !isReassignOverride)
              }
              className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                !selectedDriverId || (hasConflict && !isReassignOverride)
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
              }`}
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : hasConflict ? (
                <ArrowRightLeft className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{hasConflict ? "Reassign & Transfer" : "Assign Driver"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPopover;


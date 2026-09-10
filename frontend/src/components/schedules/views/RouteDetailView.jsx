import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Copy,
  Trash2,
  Bookmark,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Pencil,
  Plus,
  Truck,
  User,
  Sparkles,
  ChevronDown,
  Download,
  XCircle,
  MoreVertical,
  Check,
  X,
  GripVertical
} from "lucide-react";
import {
  ROUTE_COLORS,
  SHIFT_TIMES,
  formatDateFriendly,
  getRouteConfig,
  getRouteForUnit
} from "../scheduleConstants";

/**
 * Level 2: Route Detail View
 * Focused daily dispatch table for a single route with 1st & 2nd shift assignments.
 * Includes in-context unit management (+ Add Unit, Remove Unit from Route, Bulk Operations, Driver History).
 */
const RouteDetailView = ({
  routeKey,
  selectedDate,
  onChangeDate,
  units = [],
  schedules = [],
  drivers = [],
  customRoutes = {},
  shiftFilter = "ALL",
  onBack,
  onAssignSlot,
  onDeleteSchedule,
  onOpenHistory,
  onOpenDriverHistory,
  onSwapOrAssign,
  onAddUnitToRoute,
  onRemoveUnitFromRoute,
  onBulkRemoveUnitsFromRoute,
  onBulkClearAssignments,
  onCopyFromYesterday,
  onCopyFromLastWeek,
  onClearDay,
  onSaveTemplate,
  onApplyTemplate,
  savedTemplates = [],
}) => {
  const [unitSearch, setUnitSearch] = useState("");
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSavingTemplateModal, setIsSavingTemplateModal] = useState(false);

  // Bulk row selection state
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  const routeConfig = getRouteConfig(routeKey, customRoutes);
  const routeName = routeConfig.name || routeKey;

  // Filter units assigned to this route
  const routeUnits = useMemo(() => {
    return units
      .filter((u) => {
        const uRoute = getRouteForUnit(u.bodyNumber, u.route, customRoutes);
        return uRoute === routeKey;
      })
      .sort((a, b) => {
        const numA = parseInt(a.bodyNumber || "999", 10);
        const numB = parseInt(b.bodyNumber || "999", 10);
        return numA - numB;
      });
  }, [units, routeKey, customRoutes]);

  // Day Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onChangeDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onChangeDate(d.toISOString().slice(0, 10));
  };

  const handleJumpToday = () => {
    onChangeDate(new Date().toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  // Active schedules for this route on this date
  const daySchedules = useMemo(() => {
    const unitIds = new Set(routeUnits.map((u) => u._id));
    return schedules.filter((s) => {
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      const sUnitId = s.unit?._id || s.unit;
      const sRoute = (s.route || "").toUpperCase();
      return sDate === selectedDate && (unitIds.has(sUnitId) || sRoute === routeKey);
    });
  }, [schedules, selectedDate, routeUnits, routeKey]);

  // Map each unit to its shift assignments
  const unitRows = useMemo(() => {
    return routeUnits.map((unit) => {
      const isMaintenance =
        unit.status === "Under Maintenance" ||
        unit.status === "Maintenance" ||
        unit.maintenanceStatus === "Maintenance" ||
        unit.availabilityStatus === "Under Maintenance";

      const firstShift = daySchedules.find((s) => {
        const uId = s.unit?._id || s.unit;
        return uId === unit._id && s.shiftType === "First Shift";
      });

      const secondShift = daySchedules.find((s) => {
        const uId = s.unit?._id || s.unit;
        return uId === unit._id && s.shiftType === "Second Shift";
      });

      const isFirstAssigned = !!(firstShift && (firstShift.driver?._id || firstShift.driver));
      const isSecondAssigned = !!(secondShift && (secondShift.driver?._id || secondShift.driver));

      // Row status
      let rowStatus = "unassigned";
      if (isMaintenance) {
        rowStatus = "unavailable";
      } else if (isFirstAssigned && isSecondAssigned) {
        rowStatus = "complete";
      } else if (isFirstAssigned || isSecondAssigned) {
        rowStatus = "partial";
      }

      // Detect conflicts
      const firstShiftDriverId = firstShift?.driver?._id || firstShift?.driver;
      const secondShiftDriverId = secondShift?.driver?._id || secondShift?.driver;

      const hasFirstConflict =
        firstShiftDriverId &&
        schedules.filter((s) => {
          const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
          const dId = s.driver?._id || s.driver;
          return sDate === selectedDate && s.shiftType === "First Shift" && dId === firstShiftDriverId;
        }).length > 1;

      const hasSecondConflict =
        secondShiftDriverId &&
        schedules.filter((s) => {
          const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
          const dId = s.driver?._id || s.driver;
          return sDate === selectedDate && s.shiftType === "Second Shift" && dId === secondShiftDriverId;
        }).length > 1;

      return {
        unit,
        isMaintenance,
        firstShift,
        secondShift,
        isFirstAssigned,
        isSecondAssigned,
        hasFirstConflict,
        hasSecondConflict,
        rowStatus,
      };
    });
  }, [routeUnits, daySchedules, selectedDate, schedules]);

  // Filtered unit rows based on search & unassigned toggle
  const filteredUnitRows = useMemo(() => {
    return unitRows.filter(({ unit, rowStatus }) => {
      if (showOnlyUnassigned && rowStatus === "complete") {
        return false;
      }
      if (unitSearch.trim()) {
        const q = unitSearch.toLowerCase();
        const plate = (unit.plateNumber || "").toLowerCase();
        const body = (unit.bodyNumber || "").toLowerCase();
        return plate.includes(q) || body.includes(q);
      }
      return true;
    });
  }, [unitRows, showOnlyUnassigned, unitSearch]);

  // Metrics summary
  const summary = useMemo(() => {
    const total = unitRows.length;
    const fullyAssigned = unitRows.filter((r) => r.rowStatus === "complete").length;
    const partiallyAssigned = unitRows.filter((r) => r.rowStatus === "partial").length;
    const unassigned = unitRows.filter((r) => r.rowStatus === "unassigned").length;
    const unavailable = unitRows.filter((r) => r.rowStatus === "unavailable").length;
    return { total, fullyAssigned, partiallyAssigned, unassigned, unavailable };
  }, [unitRows]);

  // Row selection helpers
  const toggleSelectRow = (unitId) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const handleSelectAllRows = () => {
    if (selectedRowIds.size === filteredUnitRows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredUnitRows.map((r) => r.unit._id)));
    }
  };

  // Export CSV for this route
  const handleExportCSV = (selectedOnly = false) => {
    const targetRows = selectedOnly
      ? filteredUnitRows.filter((r) => selectedRowIds.has(r.unit._id))
      : filteredUnitRows;

    if (targetRows.length === 0) return;

    const headers = [
      "Unit Plate",
      "Body Number",
      "Unit Status",
      "Route",
      "Date",
      "1st Shift Driver",
      "1st Shift Status",
      "2nd Shift Driver",
      "2nd Shift Status",
    ];

    const csvData = targetRows.map(({ unit, firstShift, secondShift, isMaintenance }) => {
      const d1 = firstShift?.driver
        ? `${firstShift.driver.firstName || ""} ${firstShift.driver.lastName || ""}`.trim()
        : "Unassigned";
      const d2 = secondShift?.driver
        ? `${secondShift.driver.firstName || ""} ${secondShift.driver.lastName || ""}`.trim()
        : "Unassigned";

      return [
        unit.plateNumber || "N/A",
        unit.bodyNumber || "N/A",
        isMaintenance ? "Maintenance" : "Available",
        routeName,
        selectedDate,
        d1,
        firstShift ? "Assigned" : "Unassigned",
        d2,
        secondShift ? "Assigned" : "Unassigned",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvData.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `schedule_${routeName.replace(/\s+/g, "_")}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col gap-4">
        {/* Top line: Back button, Route Title & Day Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Routes</span>
            </button>

            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: routeConfig.hex }}
              />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {routeName}
              </h2>
            </div>
          </div>

          {/* Day Navigation Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-50 dark:bg-slate-750 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrevDay}
                title="Previous Day"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onChangeDate(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 focus:ring-0 cursor-pointer"
              />

              <button
                type="button"
                onClick={handleNextDay}
                title="Next Day"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                type="button"
                onClick={handleJumpToday}
                className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-blue-900/40 transition"
              >
                Today
              </button>
            )}

            {/* + Add Unit Button in Header Bar */}
            <button
              type="button"
              onClick={() => onAddUnitToRoute(routeKey)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Unit</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar: Copy, Clear, Templates & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onCopyFromYesterday(routeKey)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy from Yesterday</span>
            </button>

            <button
              type="button"
              onClick={() => onCopyFromLastWeek(routeKey)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy from Last Week</span>
            </button>

            {/* Templates Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>Templates</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isTemplateDropdownOpen && (
                <div
                  className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-30 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setIsTemplateDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Schedule Templates
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTemplateDropdownOpen(false);
                      setIsSavingTemplateModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save current day as template</span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

                  {savedTemplates.length === 0 ? (
                    <div className="px-3.5 py-2 text-xs text-slate-400">
                      No saved templates yet
                    </div>
                  ) : (
                    savedTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onApplyTemplate(t.id)}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-[10px] text-slate-400">Apply</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Day</span>
            </button>
          </div>

          {/* Search and Unassigned Filter Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search units..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowOnlyUnassigned((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                showOnlyUnassigned
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Only Unassigned</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unit Assignment Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[700px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredUnitRows.length > 0 &&
                      selectedRowIds.size === filteredUnitRows.length
                    }
                    onChange={handleSelectAllRows}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all units"
                  />
                </th>
                <th className="py-3.5 px-4 w-48">UNIT</th>
                <th className="py-3.5 px-4">1ST SHIFT (05:00 - 13:00)</th>
                <th className="py-3.5 px-4">2ND SHIFT (13:00 - 21:00)</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredUnitRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 text-xs">
                    {showOnlyUnassigned ? (
                      "All units on this route are fully assigned for this date!"
                    ) : unitSearch ? (
                      `No units found matching "${unitSearch}"`
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          No units currently assigned to {routeName}
                        </p>
                        <button
                          type="button"
                          onClick={() => onAddUnitToRoute(routeKey)}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Unit to Route</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUnitRows.map(
                  ({
                    unit,
                    isMaintenance,
                    firstShift,
                    secondShift,
                    isFirstAssigned,
                    isSecondAssigned,
                    hasFirstConflict,
                    hasSecondConflict,
                    rowStatus,
                  }) => {
                    const isRowSelected = selectedRowIds.has(unit._id);

                    // Row states per prompt:
                    // Fully assigned: White row with green left border
                    // Partially assigned: White row with yellow left border
                    // Unassigned: Light gray background with dashed border
                    // Unavailable: Dark gray with strikethrough text
                    let rowClass = "border-l-4 border-l-slate-300 bg-slate-50/50 dark:bg-slate-800/40";
                    if (rowStatus === "complete") {
                      rowClass = "border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800";
                    } else if (rowStatus === "partial") {
                      rowClass = "border-l-4 border-l-amber-500 bg-white dark:bg-slate-800";
                    } else if (rowStatus === "unavailable") {
                      rowClass = "border-l-4 border-l-slate-400 bg-slate-100/70 dark:bg-slate-850/60 opacity-60";
                    } else if (rowStatus === "unassigned") {
                      rowClass = "border-l-4 border-l-slate-300 bg-slate-50/60 dark:bg-slate-800/40";
                    }

                    return (
                      <tr
                        key={unit._id}
                        className={`hover:bg-blue-50/30 dark:hover:bg-slate-750/50 transition-colors ${rowClass} ${
                          isRowSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        {/* Checkbox Column */}
                        <td className="py-3.5 px-4 text-center align-top">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() => toggleSelectRow(unit._id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Unit Column */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenHistory(unit)}
                                  className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition cursor-pointer"
                                  title="Click to view schedule history"
                                >
                                  {unit.plateNumber || "NO-PLATE"}
                                </button>
                                {unit.bodyNumber && (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    #{unit.bodyNumber}
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex items-center gap-1.5">
                                {isMaintenance ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Maintenance
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Available
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Unit row actions */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenHistory(unit)}
                                title="Unit schedule history"
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onRemoveUnitFromRoute(unit._id, routeKey)}
                                title="Remove unit from this route"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 1st Shift Column */}
                        <td className="py-2.5 px-3 align-top">
                          <ShiftAssignmentCell
                            unit={unit}
                            shiftType="First Shift"
                            schedule={firstShift}
                            isMaintenance={isMaintenance}
                            hasConflict={hasFirstConflict}
                            dateStr={selectedDate}
                            onAssign={() =>
                              onAssignSlot({
                                unit,
                                dateStr: selectedDate,
                                shiftType: "First Shift",
                                currentSchedule: firstShift,
                                route: routeKey,
                              })
                            }
                            onDelete={() => firstShift && onDeleteSchedule(firstShift._id)}
                            onOpenDriverHistory={onOpenDriverHistory}
                            onSwapOrAssign={onSwapOrAssign}
                          />
                        </td>

                        {/* 2nd Shift Column */}
                        <td className="py-2.5 px-3 align-top">
                          <ShiftAssignmentCell
                            unit={unit}
                            shiftType="Second Shift"
                            schedule={secondShift}
                            isMaintenance={isMaintenance}
                            hasConflict={hasSecondConflict}
                            dateStr={selectedDate}
                            onAssign={() =>
                              onAssignSlot({
                                unit,
                                dateStr: selectedDate,
                                shiftType: "Second Shift",
                                currentSchedule: secondShift,
                                route: routeKey,
                              })
                            }
                            onDelete={() => secondShift && onDeleteSchedule(secondShift._id)}
                            onOpenDriverHistory={onOpenDriverHistory}
                            onSwapOrAssign={onSwapOrAssign}
                          />
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Bar */}
        <div className="py-3 px-5 bg-slate-50/80 dark:bg-slate-750 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Showing <strong>{summary.total}</strong> units ·{" "}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {summary.fullyAssigned} fully assigned
            </strong>{" "}
            ·{" "}
            <strong className="text-amber-600 dark:text-amber-400">
              {summary.partiallyAssigned} partially
            </strong>{" "}
            ·{" "}
            <strong className="text-slate-600 dark:text-slate-300">
              {summary.unassigned} unassigned
            </strong>
            {summary.unavailable > 0 && ` · ${summary.unavailable} in maintenance`}
          </div>

          <div className="flex items-center gap-2">
            {selectedRowIds.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  const ids = Array.from(selectedRowIds);
                  onBulkRemoveUnitsFromRoute(ids, routeKey);
                  setSelectedRowIds(new Set());
                }}
                className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
              >
                [Remove Unit]
              </button>
            )}

            <button
              type="button"
              onClick={() => handleExportCSV(false)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>[Export]</span>
            </button>
          </div>
        </div>
      </div>

      {/* BULK ACTION BAR (Floating hover at bottom, matching Unit Management) */}
      {selectedRowIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-200">
          <span className="font-semibold text-sm whitespace-nowrap">
            {selectedRowIds.size} {selectedRowIds.size === 1 ? "unit" : "units"} selected
          </span>
          <div className="h-5 w-px bg-gray-700"></div>

          <button
            type="button"
            onClick={() => {
              const ids = Array.from(selectedRowIds);
              onBulkRemoveUnitsFromRoute(ids, routeKey);
              setSelectedRowIds(new Set());
            }}
            className="text-sm font-medium hover:text-rose-400 text-rose-300 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            title="Remove selected units from this route"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Remove from Route</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const ids = Array.from(selectedRowIds);
              onBulkClearAssignments(ids, selectedDate);
              setSelectedRowIds(new Set());
            }}
            className="text-sm font-medium hover:text-blue-400 text-gray-200 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Assignments</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCSV(true)}
            className="text-sm font-medium hover:text-blue-400 text-gray-200 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export Selected</span>
          </button>

          <div className="h-5 w-px bg-gray-700"></div>

          <button
            type="button"
            onClick={() => setSelectedRowIds(new Set())}
            className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white cursor-pointer"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Save Template Modal */}
      {isSavingTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsSavingTemplateModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 max-w-sm w-full shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Save Schedule as Template
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Save {routeName}'s current assignments ({formatDateFriendly(selectedDate)}) as a reusable template to apply on future dates.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g. Regular Monday, Peak Fleet"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-750 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSavingTemplateModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newTemplateName.trim()}
                onClick={() => {
                  onSaveTemplate(newTemplateName.trim());
                  setIsSavingTemplateModal(false);
                  setNewTemplateName("");
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-xs"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Day Confirmation Modal */}
      {isClearConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsClearConfirmOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 max-w-sm w-full shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Clear Day's Schedules?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove all assignments on <strong>{routeName}</strong> for <strong>{formatDateFriendly(selectedDate)}</strong>? This action can be reversed via Undo (<kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">Ctrl+Z</kbd>).
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearDay(routeKey);
                  setIsClearConfirmOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
              >
                Yes, Clear Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Shift Cell inside the Route Detail Table
 */
const ShiftAssignmentCell = ({
  unit,
  shiftType,
  schedule,
  isMaintenance,
  hasConflict,
  dateStr,
  onAssign,
  onDelete,
  onOpenDriverHistory,
  onSwapOrAssign,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const driver = schedule?.driver;
  const driverName = driver
    ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || "Assigned Driver"
    : null;

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        sourceScheduleId: schedule?._id,
        sourceDriverId: driver?._id,
        sourceUnitId: unit._id,
        sourceShiftType: shiftType,
        sourceDateStr: dateStr,
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
      if (data.sourceDriverId && onSwapOrAssign) {
        onSwapOrAssign(data, {
          targetScheduleId: schedule?._id,
          targetUnitId: unit._id,
          targetShiftType: shiftType,
          targetDateStr: dateStr,
        });
      }
    } catch (err) {
      console.error("Drop parsing failed", err);
    }
  };

  if (isMaintenance) {
    return (
      <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1.5 select-none line-through">
        <span>— (Unavailable)</span>
      </div>
    );
  }

  if (driverName) {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs cursor-grab active:cursor-grabbing ${
          isDragging ? "opacity-50 scale-95" : ""
        } ${
          isDragOver
            ? "ring-2 ring-blue-500 bg-blue-50/80 dark:bg-blue-900/40 border-blue-400"
            : hasConflict
            ? "border-rose-400 bg-rose-50/60 dark:bg-rose-950/30"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
        }`}
      >
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {/* Drag Handle */}
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500 shrink-0 cursor-grab" />
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (driver && onOpenDriverHistory) {
                    onOpenDriverHistory(driver);
                  } else {
                    onAssign();
                  }
                }}
                className="font-medium text-xs text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left cursor-pointer"
                title="Click to view driver work history"
              >
                {driverName}
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 pointer-events-none">
              {hasConflict ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3 h-3" />
                  ⚠ Conflict
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  ✓ Assigned
                </span>
              )}
              {driver?.phone && (
                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                  · {driver.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick action buttons on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssign();
            }}
            title="Edit assignment"
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Remove assignment"
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Unassigned slot
  return (
    <div
      onClick={onAssign}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group p-2.5 rounded-xl border border-dashed hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex items-center justify-between text-xs ${
        isDragOver
          ? "ring-2 ring-blue-500 bg-blue-50/80 dark:bg-blue-900/40 border-blue-400 text-blue-600"
          : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
      }`}
    >
      <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-medium">
        (Unassigned)
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
        <Plus className="w-3 h-3" />
        Assign
      </span>
    </div>
  );
};

export default RouteDetailView;


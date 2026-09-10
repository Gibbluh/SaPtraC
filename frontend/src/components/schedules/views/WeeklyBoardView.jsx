import { useState, useMemo } from "react";
import {
  Plus,
  MoreVertical,
  History,
  AlertTriangle,
  GripVertical,
  ArrowRightLeft,
  Copy,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  ROUTE_COLORS,
  SHIFT_TIMES,
  getRouteForUnit,
  getDaysOfWeek
} from "../scheduleConstants";

const WeeklyBoardView = ({
  currentWeekStartDate,
  units = [],
  schedules = [],
  drivers = [],
  routeFilter = "ALL",
  shiftFilter = "ALL",
  onQuickAssign,
  onOpenHistory,
  onOpenRouteDetail,
  onMoveAssignment,
  onSwapAssignment,
  onDuplicateAssignment,
  onDeleteAssignment,
  conflictsByScheduleId = {},
}) => {
  const [collapsedRoutes, setCollapsedRoutes] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null); // `${unitId}_${dateStr}_${shiftType}`
  const [contextMenu, setContextMenu] = useState(null); // { x, y, schedule, unit, dateStr, shiftType }

  const daysOfWeek = useMemo(() => {
    return getDaysOfWeek(currentWeekStartDate);
  }, [currentWeekStartDate]);

  // Fast index mapping: schedulesByKey[`${unitId}_${dateStr}_${shiftType}`] = schedule
  const schedulesByKey = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const uId = s.unit?._id || s.unit;
      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
      if (uId && sDate && s.shiftType) {
        map[`${uId}_${sDate}_${s.shiftType}`] = s;
      }
    });
    return map;
  }, [schedules]);

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

    // Sort units numerically inside each route
    Object.keys(groups).forEach((r) => {
      groups[r].sort((a, b) => {
        const numA = parseInt(a.bodyNumber, 10) || 0;
        const numB = parseInt(b.bodyNumber, 10) || 0;
        return numA - numB;
      });
    });

    return groups;
  }, [units]);

  const toggleRouteCollapse = (route) => {
    setCollapsedRoutes((prev) => ({
      ...prev,
      [route]: !prev[route],
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e, schedule, unit, dateStr, shiftType) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "SCHEDULED_CARD",
        scheduleId: schedule._id,
        driverId: schedule.driver?._id || schedule.driver,
        unitId: unit._id,
        dateStr,
        shiftType,
      })
    );
    setDraggedItem({ schedule, unit, dateStr, shiftType });
  };

  const handleDragOver = (e, cellKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCell !== cellKey) {
      setDragOverCell(cellKey);
    }
  };

  const handleDragLeave = (e, cellKey) => {
    // Prevent flickering when dragging over child elements inside the cell
    if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    if (dragOverCell === cellKey) {
      setDragOverCell(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverCell(null);
  };

  const handleDrop = (e, targetUnit, targetDateStr, targetShiftType) => {
    e.preventDefault();
    setDragOverCell(null);

    const rawData = e.dataTransfer.getData("application/json");
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);

      // 1. If dropping an unscheduled driver from the right sidebar
      if (data.type === "UNSCHEDULED_DRIVER") {
        onQuickAssign({
          unitId: targetUnit._id,
          dateStr: targetDateStr,
          shiftType: targetShiftType,
          driverId: data.driverId,
        });
        return;
      }

      // 2. If dropping an existing scheduled assignment
      if (data.type === "SCHEDULED_CARD") {
        const targetSchedule = schedulesByKey[`${targetUnit._id}_${targetDateStr}_${targetShiftType}`];

        // If dropped onto exact same slot: do nothing
        if (
          data.unitId === targetUnit._id &&
          data.dateStr === targetDateStr &&
          data.shiftType === targetShiftType
        ) {
          return;
        }

        if (!targetSchedule) {
          // Empty destination -> Move assignment
          onMoveAssignment({
            scheduleId: data.scheduleId,
            newUnitId: targetUnit._id,
            newDateStr: targetDateStr,
            newShiftType: targetShiftType,
          });
        } else {
          // Occupied destination -> Swap assignments
          onSwapAssignment({
            sourceScheduleId: data.scheduleId,
            targetScheduleId: targetSchedule._id,
          });
        }
      }
    } catch (err) {
      console.error("Drop handling error:", err);
    }
  };

  // Close context menu on outside click
  const handleContextMenu = (e, schedule, unit, dateStr, shiftType) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      schedule,
      unit,
      dateStr,
      shiftType,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div className="w-full flex flex-col flex-1 select-none" onClick={closeContextMenu}>
      {/* Board Scrollable Table Container */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-slate-800/95 shadow-xs">
        <table className="w-full table-fixed border-collapse text-left min-w-[1050px]">
          {/* Table Header: Unit column + 7 Days of the Week */}
          <thead className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 backdrop-blur-xs">
            <tr>
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider w-44 min-w-44 border-r border-slate-200 dark:border-slate-700/60 bg-slate-50/95 dark:bg-slate-800/95 sticky left-0 z-30">
                Route / Unit
              </th>
              {daysOfWeek.map((day) => (
                <th
                  key={day.dateStr}
                  className={`py-3 px-3 font-semibold text-xs border-r border-slate-200/80 dark:border-slate-700/60 transition-colors w-[calc((100%-11rem)/7)] min-w-[125px] ${
                    day.isToday
                      ? "bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="uppercase text-[10px] tracking-wider text-slate-400 font-bold">
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black mt-0.5">
                    {day.monthShort} {day.dayNum}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {Object.entries(routeGroups).map(([routeKey, routeUnits]) => {
              if (routeFilter !== "ALL" && routeKey !== routeFilter) return null;
              if (routeUnits.length === 0) return null;

              const routeConfig = ROUTE_COLORS[routeKey] || ROUTE_COLORS.LANGGAM;
              const isCollapsed = collapsedRoutes[routeKey];

              return (
                <tr key={routeKey} className="group/route">
                  <td colSpan={8} className="p-0">
                    {/* Route Section Header Bar */}
                    <div
                      onClick={() => toggleRouteCollapse(routeKey)}
                      className={`px-4 py-2.5 flex items-center justify-between cursor-pointer border-y border-slate-200/80 dark:border-slate-700 transition ${routeConfig.lightBg || "bg-slate-100/70"} hover:brightness-95`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-400">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${routeConfig.dot}`}></span>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                          {routeConfig.name} Route
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-2xs">
                          {routeUnits.length} Units
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRouteDetail(routeKey);
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Route Coverage & Units
                      </button>
                    </div>

                    {/* Unit Rows inside Route */}
                    {!isCollapsed && (
                      <table className="w-full table-fixed border-collapse">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                          {routeUnits.map((unit) => {
                            const isMaintenance =
                              unit.status === "Under Maintenance" ||
                              unit.maintenanceStatus === "Maintenance";

                            return (
                              <tr
                                key={unit._id}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                              >
                                {/* Unit Identity Cell (Sticky left) */}
                                <td className="py-3 px-4 w-44 min-w-44 border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 sticky left-0 z-10">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                                          Unit {unit.bodyNumber}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => onOpenHistory(unit)}
                                        className="font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                        title="Click to view full schedule history"
                                      >
                                        <span>{unit.plateNumber}</span>
                                        <History className="w-2.5 h-2.5" />
                                      </button>
                                    </div>

                                    {isMaintenance ? (
                                      <span
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                        title="Unit Under Maintenance"
                                      >
                                        Maint
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Day Cells */}
                                {daysOfWeek.map((day) => {
                                  const cellFirstKey = `${unit._id}_${day.dateStr}_First Shift`;
                                  const cellSecondKey = `${unit._id}_${day.dateStr}_Second Shift`;

                                  const firstShiftSchedule = schedulesByKey[cellFirstKey];
                                  const secondShiftSchedule = schedulesByKey[cellSecondKey];

                                  const isFirstDragOver = dragOverCell === cellFirstKey;
                                  const isSecondDragOver = dragOverCell === cellSecondKey;

                                  return (
                                    <td
                                      key={day.dateStr}
                                      className={`p-1.5 border-r border-slate-200/80 dark:border-slate-700/50 align-top transition-colors w-[calc((100%-11rem)/7)] min-w-[125px] ${
                                        day.isToday ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                                      }`}
                                    >
                                      <div className="space-y-1.5 min-w-[125px]">
                                        {/* 1st Shift Slot */}
                                        {(shiftFilter === "ALL" || shiftFilter === "First Shift") && (
                                          <div
                                            onDragOver={(e) => handleDragOver(e, cellFirstKey)}
                                            onDragLeave={(e) => handleDragLeave(e, cellFirstKey)}
                                            onDrop={(e) => handleDrop(e, unit, day.dateStr, "First Shift")}
                                            className={`rounded-xl transition-all duration-150 relative ${
                                              isFirstDragOver
                                                ? "ring-2 ring-blue-500 bg-blue-50/80 dark:bg-blue-900/30"
                                                : ""
                                            }`}
                                          >
                                            {firstShiftSchedule ? (
                                              <ScheduleCard
                                                schedule={firstShiftSchedule}
                                                unit={unit}
                                                routeConfig={routeConfig}
                                                dateStr={day.dateStr}
                                                shiftType="First Shift"
                                                conflict={conflictsByScheduleId[firstShiftSchedule._id]}
                                                onDragStart={(e) =>
                                                  handleDragStart(e, firstShiftSchedule, unit, day.dateStr, "First Shift")
                                                }
                                                onDragEnd={handleDragEnd}
                                                onEdit={() =>
                                                  onQuickAssign({
                                                    unitId: unit._id,
                                                    dateStr: day.dateStr,
                                                    shiftType: "First Shift",
                                                    driverId:
                                                      firstShiftSchedule.driver?._id || firstShiftSchedule.driver,
                                                  })
                                                }
                                                onOpenHistory={() => onOpenHistory(unit)}
                                                onDelete={() => onDeleteAssignment(firstShiftSchedule._id)}
                                                onContextMenu={(e) =>
                                                  handleContextMenu(e, firstShiftSchedule, unit, day.dateStr, "First Shift")
                                                }
                                              />
                                            ) : (
                                              <EmptySlotButton
                                                shiftLabel="1st"
                                                shiftFullName="First Shift"
                                                onClick={() =>
                                                  onQuickAssign({
                                                    unitId: unit._id,
                                                    dateStr: day.dateStr,
                                                    shiftType: "First Shift",
                                                  })
                                                }
                                              />
                                            )}
                                          </div>
                                        )}

                                        {/* 2nd Shift Slot */}
                                        {(shiftFilter === "ALL" || shiftFilter === "Second Shift") && (
                                          <div
                                            onDragOver={(e) => handleDragOver(e, cellSecondKey)}
                                            onDragLeave={(e) => handleDragLeave(e, cellSecondKey)}
                                            onDrop={(e) => handleDrop(e, unit, day.dateStr, "Second Shift")}
                                            className={`rounded-xl transition-all duration-150 relative ${
                                              isSecondDragOver
                                                ? "ring-2 ring-blue-500 bg-blue-50/80 dark:bg-blue-900/30"
                                                : ""
                                            }`}
                                          >
                                            {secondShiftSchedule ? (
                                              <ScheduleCard
                                                schedule={secondShiftSchedule}
                                                unit={unit}
                                                routeConfig={routeConfig}
                                                dateStr={day.dateStr}
                                                shiftType="Second Shift"
                                                conflict={conflictsByScheduleId[secondShiftSchedule._id]}
                                                onDragStart={(e) =>
                                                  handleDragStart(e, secondShiftSchedule, unit, day.dateStr, "Second Shift")
                                                }
                                                onDragEnd={handleDragEnd}
                                                onEdit={() =>
                                                  onQuickAssign({
                                                    unitId: unit._id,
                                                    dateStr: day.dateStr,
                                                    shiftType: "Second Shift",
                                                    driverId:
                                                      secondShiftSchedule.driver?._id || secondShiftSchedule.driver,
                                                  })
                                                }
                                                onOpenHistory={() => onOpenHistory(unit)}
                                                onDelete={() => onDeleteAssignment(secondShiftSchedule._id)}
                                                onContextMenu={(e) =>
                                                  handleContextMenu(e, secondShiftSchedule, unit, day.dateStr, "Second Shift")
                                                }
                                              />
                                            ) : (
                                              <EmptySlotButton
                                                shiftLabel="2nd"
                                                shiftFullName="Second Shift"
                                                onClick={() =>
                                                  onQuickAssign({
                                                    unitId: unit._id,
                                                    dateStr: day.dateStr,
                                                    shiftType: "Second Shift",
                                                  })
                                                }
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-1 w-48 text-xs font-medium text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onDuplicateAssignment({
                schedule: contextMenu.schedule,
                unit: contextMenu.unit,
                dateStr: contextMenu.dateStr,
                shiftType: contextMenu.shiftType,
              });
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-blue-500" />
            Duplicate to Next Day
          </button>

          <button
            onClick={() => {
              onOpenHistory(contextMenu.unit);
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            View Unit History
          </button>

          <button
            onClick={() => {
              onQuickAssign({
                unitId: contextMenu.unit._id,
                dateStr: contextMenu.dateStr,
                shiftType: contextMenu.shiftType,
                driverId: contextMenu.schedule.driver?._id || contextMenu.schedule.driver,
              });
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500" />
            Edit / Swap Driver
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>

          <button
            onClick={() => {
              onDeleteAssignment(contextMenu.schedule._id);
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            Clear Assignment
          </button>
        </div>
      )}
    </div>
  );
};

// Compact Assigned Schedule Card
const ScheduleCard = ({
  schedule,
  unit,
  routeConfig,
  shiftType,
  conflict,
  onDragStart,
  onDragEnd,
  onEdit,
  onOpenHistory,
  onDelete,
  onContextMenu,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const driver = schedule.driver;
  const driverName = driver
    ? `${driver.firstName || ""}`.trim() + (driver.lastName ? ` ${driver.lastName}` : "") || "Assigned Driver"
    : "Unassigned";

  const isFirst = shiftType === "First Shift";

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) onDragStart(e);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd(e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={onContextMenu}
      className={`group relative p-2 rounded-xl border bg-white dark:bg-slate-800/90 shadow-2xs hover:shadow-xs transition cursor-grab active:cursor-grabbing border-l-4 ${
        routeConfig.borderLeft || "border-l-blue-500"
      } border-slate-200/80 dark:border-slate-700 ${isDragging ? "opacity-50 scale-95" : ""}`}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <div className="flex items-center gap-1">
          <GripVertical className="w-3 h-3 text-slate-300 dark:text-slate-500 cursor-grab shrink-0" />
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
              isFirst
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            }`}
          >
            {isFirst ? "1st Shift" : "2nd Shift"}
          </span>
        </div>

        {conflict && (
          <span
            className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-1 rounded flex items-center gap-0.5"
            title={conflict.text}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            {conflict.label || "Conflict"}
          </span>
        )}
      </div>

      <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate pl-4 flex items-center gap-1">
        <span className="truncate">{driverName}</span>
      </div>

      {/* Quick hover actions */}
      <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-white/95 dark:bg-slate-800/95 px-1 py-0.5 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="Edit assignment"
        >
          <ArrowRightLeft className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="Remove assignment"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Subtle Empty Slot
const EmptySlotButton = ({ shiftLabel, shiftFullName, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-1.5 px-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-1 group"
    >
      <Plus className="w-3 h-3 text-slate-300 dark:text-slate-400 group-hover:text-blue-500" />
      <span>+ {shiftLabel} Shift</span>
    </button>
  );
};

export default WeeklyBoardView;


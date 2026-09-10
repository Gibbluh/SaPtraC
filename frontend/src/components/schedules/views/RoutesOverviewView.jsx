import React, { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Truck,
  Plus,
  Layers
} from "lucide-react";
import {
  ROUTES,
  ROUTE_COLORS,
  getRouteConfig,
  getRouteForUnit,
  formatDateFriendly
} from "../scheduleConstants";

/**
 * Level 1: Routes Overview
 * Route-focused summary grid showing assignment progress per route at a glance.
 * Now equipped with in-context unit management: "+ Unit" per card and "+ Add New Route".
 */
const RoutesOverviewView = ({
  routes = ROUTES,
  customRoutes = {},
  units = [],
  schedules = [],
  selectedDate,
  shiftFilter = "ALL",
  routeFilter = "ALL",
  onSelectRoute,
  onAddUnitToRoute,
  onOpenAddNewRoute,
}) => {
  // Compute route statistics for the selected date
  const routeStats = useMemo(() => {
    return routes.map((routeKey, index) => {
      const config = getRouteConfig(routeKey, customRoutes);
      const routeName = config.name || routeKey;

      // Units mapped to this route
      const routeUnits = units.filter((u) => {
        const uRoute = getRouteForUnit(u.bodyNumber, u.route, customRoutes);
        return uRoute === routeKey;
      });

      const totalUnits = routeUnits.length;
      const unitIds = new Set(routeUnits.map((u) => u._id));

      // Active schedules on this route & date
      const daySchedules = schedules.filter((s) => {
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        const sUnitId = s.unit?._id || s.unit;
        const sRoute = (s.route || "").toUpperCase();
        return (
          sDate === selectedDate &&
          (unitIds.has(sUnitId) || sRoute === routeKey) &&
          (s.driver?._id || s.driver)
        );
      });

      // Shift breakdowns
      const firstShiftCount = daySchedules.filter((s) => s.shiftType === "First Shift").length;
      const secondShiftCount = daySchedules.filter((s) => s.shiftType === "Second Shift").length;

      // Determine total slots based on shiftFilter
      let totalSlots = totalUnits * 2;
      let assignedSlots = firstShiftCount + secondShiftCount;

      if (shiftFilter === "First Shift") {
        totalSlots = totalUnits;
        assignedSlots = firstShiftCount;
      } else if (shiftFilter === "Second Shift") {
        totalSlots = totalUnits;
        assignedSlots = secondShiftCount;
      }

      const percent = totalSlots > 0 ? Math.round((assignedSlots / totalSlots) * 100) : 0;

      // Status determination
      let statusType = "unassigned"; // 'complete' | 'partial' | 'unassigned' | 'empty'
      if (totalUnits === 0) {
        statusType = "empty";
      } else if (assignedSlots >= totalSlots && totalSlots > 0) {
        statusType = "complete";
      } else if (assignedSlots > 0) {
        statusType = "partial";
      }

      return {
        key: routeKey,
        name: routeName,
        config,
        totalUnits,
        totalSlots,
        assignedSlots,
        firstShiftCount,
        secondShiftCount,
        percent,
        statusType,
      };
    });
  }, [routes, customRoutes, units, schedules, selectedDate, shiftFilter]);

  // Filter routes if routeFilter is active
  const filteredRouteStats = useMemo(() => {
    if (routeFilter === "ALL") return routeStats;
    return routeStats.filter((r) => r.key === routeFilter);
  }, [routeStats, routeFilter]);

  // Overview total summary
  const summary = useMemo(() => {
    const totalUnits = routeStats.reduce((acc, r) => acc + r.totalUnits, 0);
    const totalAssigned = routeStats.reduce((acc, r) => acc + r.assignedSlots, 0);
    const totalSlots = routeStats.reduce((acc, r) => acc + r.totalSlots, 0);
    const completedRoutes = routeStats.filter((r) => r.statusType === "complete").length;
    return { totalUnits, totalAssigned, totalSlots, completedRoutes, count: routeStats.length };
  }, [routeStats]);

  return (
    <div className="space-y-6">
      {/* Route Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRouteStats.map((route) => {
          const { config } = route;
          const isComplete = route.statusType === "complete";
          const isPartial = route.statusType === "partial";
          const isUnassigned = route.statusType === "unassigned";
          const isEmpty = route.statusType === "empty";

          return (
            <div
              key={route.key}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              style={{
                borderTopColor: config.hex,
                borderTopWidth: "4px",
              }}
            >
              {/* Top Accent Glow on Hover */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, ${config.hex}, transparent)`,
                }}
              />

              {/* Card Header & Body */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: config.hex }}
                    />
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white tracking-tight">
                      {route.name}
                    </h3>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-1.5">
                    {isComplete && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete
                      </span>
                    )}
                    {isPartial && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        {route.totalSlots - route.assignedSlots} left
                      </span>
                    )}
                    {isUnassigned && route.totalUnits > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Needs Attention
                      </span>
                    )}
                    {isEmpty && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                        No Units
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {route.totalUnits} {route.totalUnits === 1 ? "unit" : "units"} assigned to route
                  </span>
                </div>

                {/* Assignment Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-300">
                      {route.totalUnits === 0
                        ? "0/0 assigned"
                        : `${route.assignedSlots}/${route.totalSlots} assigned`}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {route.percent}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${route.percent}%`,
                        backgroundColor: isComplete
                          ? "#059669"
                          : isPartial
                          ? "#D97706"
                          : route.totalUnits === 0
                          ? "#94A3B8"
                          : config.hex,
                      }}
                    />
                  </div>
                </div>

                {/* Shift Breakdown Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-4">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">
                      1st Shift (05:00 - 13:00)
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 inline-block">
                      {route.firstShiftCount}/{route.totalUnits}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">
                      2nd Shift (13:00 - 21:00)
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 inline-block">
                      {route.secondShiftCount}/{route.totalUnits}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: [+ Unit] and [Open] buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddUnitToRoute(route.key);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-400 transition flex items-center gap-1 shadow-2xs"
                  title={`Add vehicle to ${route.name}`}
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>+ Unit</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectRoute(route.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Route Button */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={onOpenAddNewRoute}
          className="px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>+ Add New Route</span>
        </button>
      </div>

      {/* Overview Bottom Tip Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>
            Showing <strong>{filteredRouteStats.length}</strong> active routes for{" "}
            <strong>{formatDateFriendly(selectedDate)}</strong> ·{" "}
            <strong className="text-slate-800 dark:text-slate-200">{summary.totalAssigned}</strong> of{" "}
            <strong>{summary.totalSlots}</strong> shift slots filled
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden md:inline">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border font-mono">1</kbd>–
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border font-mono">5</kbd> to open routes
          </span>
          <span className="hidden md:inline">·</span>
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border font-mono">U</kbd> to Add Unit
          </span>
          <span className="hidden md:inline">·</span>
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border font-mono">T</kbd> for Today
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoutesOverviewView;


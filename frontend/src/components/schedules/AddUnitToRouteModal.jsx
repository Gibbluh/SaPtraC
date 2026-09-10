import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Truck,
  Check,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight
} from "lucide-react";
import {
  ROUTES,
  ROUTE_COLORS,
  getRouteConfig,
  getRouteForUnit
} from "./scheduleConstants";

/**
 * AddUnitToRouteModal
 * Allows selecting units to attach to a route (with conflict/reassignment warnings).
 */
const AddUnitToRouteModal = ({
  isOpen,
  onClose,
  initialRouteKey = "LANGGAM",
  allRoutes = ROUTES,
  customRoutes = {},
  units = [],
  onAddUnits,
  isSubmitting = false,
}) => {
  const [selectedRoute, setSelectedRoute] = useState(initialRouteKey || "LANGGAM");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());

  // Sync initial route when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedRoute(initialRouteKey || allRoutes[0] || "LANGGAM");
      setSearchQuery("");
      setSelectedUnitIds(new Set());
    }
  }, [isOpen, initialRouteKey, allRoutes]);

  const targetRouteConfig = getRouteConfig(selectedRoute, customRoutes);

  // Compute unit statuses relative to the selected route
  const candidateUnits = useMemo(() => {
    return units.map((u) => {
      const currentRoute = getRouteForUnit(u.bodyNumber, u.route, customRoutes);
      const isAlreadyOnRoute = currentRoute === selectedRoute;
      const isMaintenance =
        u.status === "Under Maintenance" ||
        u.status === "Maintenance" ||
        u.maintenanceStatus === "Maintenance" ||
        u.availabilityStatus === "Under Maintenance";

      let statusLabel = "Available";
      let statusType = "available"; // 'available' | 'maintenance' | 'other_route' | 'same_route'

      if (isAlreadyOnRoute) {
        statusLabel = `Already on ${targetRouteConfig.name}`;
        statusType = "same_route";
      } else if (isMaintenance) {
        statusLabel = "In Maintenance";
        statusType = "maintenance";
      } else if (currentRoute) {
        const otherCfg = getRouteConfig(currentRoute, customRoutes);
        statusLabel = `On ${otherCfg.name}`;
        statusType = "other_route";
      }

      return {
        unit: u,
        currentRoute,
        isAlreadyOnRoute,
        isMaintenance,
        statusLabel,
        statusType,
      };
    });
  }, [units, selectedRoute, customRoutes, targetRouteConfig]);

  // Filter candidate units: filter out already on route, apply search
  const filteredCandidates = useMemo(() => {
    return candidateUnits.filter((item) => {
      // Exclude units already on the selected route
      if (item.isAlreadyOnRoute) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const plate = (item.unit.plateNumber || "").toLowerCase();
        const body = (item.unit.bodyNumber || "").toLowerCase();
        return plate.includes(q) || body.includes(q);
      }
      return true;
    });
  }, [candidateUnits, searchQuery]);

  // Toggle selection
  const toggleUnit = (unitId) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  // Select all visible
  const handleSelectAllVisible = () => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      filteredCandidates.forEach((c) => next.add(c.unit._id));
      return next;
    });
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedUnitIds(new Set());
  };

  const handleConfirm = () => {
    if (selectedUnitIds.size === 0) return;
    const unitsToAdd = units.filter((u) => selectedUnitIds.has(u._id));
    onAddUnits(selectedRoute, unitsToAdd);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-750/70">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-2xs"
              style={{ backgroundColor: targetRouteConfig.hex }}
            >
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                Add Unit to Route
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Attach available vehicles to this route's fleet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Route Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Target Route
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedRoute}
                onChange={(e) => {
                  setSelectedRoute(e.target.value);
                  setSelectedUnitIds(new Set()); // Reset selections on route switch
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-800 dark:text-slate-100 cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                {allRoutes.map((rk) => {
                  const cfg = getRouteConfig(rk, customRoutes);
                  return (
                    <option key={rk} value={rk}>
                      {cfg.name} Route
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Search Available Units */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Available Units
              </label>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Select all visible
                </button>
                {selectedUnitIds.size > 0 && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search plate or body number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Units Scrollable List */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60 max-h-60 overflow-y-auto bg-slate-50/40 dark:bg-slate-750/30">
              {filteredCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {searchQuery ? `No units matching "${searchQuery}"` : "No available units to add."}
                </div>
              ) : (
                filteredCandidates.map(({ unit, statusLabel, statusType, currentRoute }) => {
                  const isSelected = selectedUnitIds.has(unit._id);
                  const isReassign = statusType === "other_route";

                  return (
                    <label
                      key={unit._id}
                      className={`p-3 flex items-start justify-between gap-3 cursor-pointer transition select-none ${
                        isSelected
                          ? "bg-blue-50/80 dark:bg-blue-950/40"
                          : "hover:bg-slate-100/60 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUnit(unit._id)}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {unit.plateNumber || "NO-PLATE"}
                            </span>
                            {unit.bodyNumber && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                #{unit.bodyNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            {statusType === "available" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Available
                              </span>
                            )}

                            {statusType === "maintenance" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                In Maintenance
                              </span>
                            )}

                            {isReassign && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {statusLabel}
                              </span>
                            )}
                          </div>

                          {/* Warning if reassigned */}
                          {isReassign && isSelected && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Will be reassigned from {getRouteConfig(currentRoute, customRoutes).name} to {targetRouteConfig.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right tag */}
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {unit.unitType || "Jeepney"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-750/70 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Selected: <strong>{selectedUnitIds.size}</strong>{" "}
            {selectedUnitIds.size === 1 ? "unit" : "units"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedUnitIds.size === 0 || isSubmitting}
              onClick={handleConfirm}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Adding...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Add Selected ({selectedUnitIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUnitToRouteModal;


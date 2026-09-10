import { useMemo } from "react";
import {
  X,
  MapPin,
  Truck,
  CheckCircle2,
  Wrench,
  UserCheck,
  Plus,
  AlertCircle
} from "lucide-react";
import { ROUTE_COLORS, SHIFT_TIMES, formatDateFriendly } from "./scheduleConstants";

const RouteDetailModal = ({
  isOpen,
  onClose,
  routeKey,
  selectedDate,
  units = [],
  schedules = [],
  drivers = [],
  onQuickAssign,
}) => {
  const routeConfig = ROUTE_COLORS[routeKey] || ROUTE_COLORS.LANGGAM;

  // Filter units for this route
  const routeUnits = useMemo(() => {
    return units.filter((u) => {
      const num = parseInt(u.bodyNumber, 10);
      if (routeKey === "LANGGAM") return num >= 1 && num <= 20;
      if (routeKey === "ESTRELLA") return (num >= 31 && num <= 40) || (num >= 46 && num <= 52) || num === 66;
      if (routeKey === "VILLAROSA") return (num >= 21 && num <= 30) || (num >= 41 && num <= 45);
      if (routeKey === "BAYAN-BAYANAN") return num >= 53 && num <= 56;
      if (routeKey === "CALAMBA") return num >= 57 && num <= 65;
      return (u.route || "").toUpperCase() === routeKey;
    });
  }, [units, routeKey]);

  // Status counts
  const stats = useMemo(() => {
    const total = routeUnits.length;
    let inMaintenance = 0;
    routeUnits.forEach((u) => {
      if (u.status === "Under Maintenance" || u.maintenanceStatus === "Maintenance") {
        inMaintenance++;
      }
    });
    const active = total - inMaintenance;

    // Shift coverage
    let coveredShifts = 0;
    const totalPossibleShifts = total * 2;

    routeUnits.forEach((u) => {
      const unitSchedules = schedules.filter((s) => {
        const uId = s.unit?._id || s.unit;
        const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
        return uId === u._id && sDate === selectedDate;
      });
      coveredShifts += unitSchedules.length;
    });

    const coveragePct = totalPossibleShifts > 0 ? Math.round((coveredShifts / totalPossibleShifts) * 100) : 0;

    return { total, active, inMaintenance, coveredShifts, totalPossibleShifts, coveragePct };
  }, [routeUnits, schedules, selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Route Color Banner */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${routeConfig.tailwindBg}`}
            >
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  {routeConfig.name} Route
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${routeConfig.tailwindBadge}`}>
                  {stats.total} Assigned Units
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatch & Schedule Overview • {formatDateFriendly(selectedDate)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-slate-50/50 dark:bg-slate-700/20 border-b border-slate-100 dark:border-slate-700/60">
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Units
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.total}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Operational
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {stats.active}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Maintenance
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {stats.inMaintenance}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Shift Coverage
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                {stats.coveragePct}%
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                ({stats.coveredShifts}/{stats.totalPossibleShifts})
              </span>
            </div>
          </div>
        </div>

        {/* Units Matrix Table */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/75 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold">Unit / Plate</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">1st Shift (05:00-13:00)</th>
                  <th className="py-3 px-4 font-bold">2nd Shift (13:00-21:00)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                {routeUnits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                      No units currently assigned to this route.
                    </td>
                  </tr>
                ) : (
                  routeUnits.map((unit) => {
                    const isMaint = unit.status === "Under Maintenance" || unit.maintenanceStatus === "Maintenance";

                    // Find schedules for this unit on selected date
                    const firstShift = schedules.find((s) => {
                      const uId = s.unit?._id || s.unit;
                      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
                      return uId === unit._id && sDate === selectedDate && s.shiftType === "First Shift";
                    });

                    const secondShift = schedules.find((s) => {
                      const uId = s.unit?._id || s.unit;
                      const sDate = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : "";
                      return uId === unit._id && sDate === selectedDate && s.shiftType === "Second Shift";
                    });

                    return (
                      <tr key={unit._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Unit {unit.bodyNumber}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {unit.plateNumber}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                              isMaint
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isMaint ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                            {isMaint ? "Maintenance" : "Active"}
                          </span>
                        </td>

                        {/* 1st Shift Cell */}
                        <td className="py-3 px-4">
                          {firstShift ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {firstShift.driver?.firstName
                                  ? `${firstShift.driver.firstName} ${firstShift.driver.lastName}`
                                  : "Assigned Driver"}
                              </span>
                              <button
                                onClick={() => onQuickAssign({ unitId: unit._id, dateStr: selectedDate, shiftType: "First Shift", driverId: firstShift.driver?._id || firstShift.driver })}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onQuickAssign({ unitId: unit._id, dateStr: selectedDate, shiftType: "First Shift" })}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-600 transition"
                            >
                              <Plus className="w-3 h-3" /> Assign 1st
                            </button>
                          )}
                        </td>

                        {/* 2nd Shift Cell */}
                        <td className="py-3 px-4">
                          {secondShift ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {secondShift.driver?.firstName
                                  ? `${secondShift.driver.firstName} ${secondShift.driver.lastName}`
                                  : "Assigned Driver"}
                              </span>
                              <button
                                onClick={() => onQuickAssign({ unitId: unit._id, dateStr: selectedDate, shiftType: "Second Shift", driverId: secondShift.driver?._id || secondShift.driver })}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onQuickAssign({ unitId: unit._id, dateStr: selectedDate, shiftType: "Second Shift" })}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-600 transition"
                            >
                              <Plus className="w-3 h-3" /> Assign 2nd
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailModal;


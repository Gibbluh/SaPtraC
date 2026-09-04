import PropTypes from "prop-types";

const getBorderColor = (kpiKey, displayLabel) => {
  const key = kpiKey ?? "";
  if (key === "totalRevenue" || key === "totalRemittance") return "bg-blue-600";
  if (key === "totalFuelCost" || key === "maintenanceIncidents") return "bg-red-600";
  if (key === "activeDrivers" || key === "activeUnits") return "bg-green-600";
  
  const lbl = displayLabel ?? "";
  const l = lbl.toLowerCase();
  if (l.includes("revenue") || l.includes("remittance")) return "bg-blue-600";
  if (l.includes("fuel") || l.includes("incident") || l.includes("maintenance")) return "bg-red-600";
  if (l.includes("driver") || l.includes("unit") || l.includes("schedule")) return "bg-green-600";
  return "bg-slate-300";
};

const getIconBgColor = (kpiKey, displayLabel) => {
  const key = kpiKey ?? "";
  if (key === "totalRevenue" || key === "totalRemittance") return "bg-blue-50 text-blue-600";
  if (key === "totalFuelCost" || key === "maintenanceIncidents") return "bg-red-50 text-red-600";
  if (key === "activeDrivers" || key === "activeUnits") return "bg-green-50 text-green-600";

  const lbl = displayLabel ?? "";
  const l = lbl.toLowerCase();
  if (l.includes("revenue") || l.includes("remittance")) return "bg-blue-50 text-blue-600";
  if (l.includes("fuel") || l.includes("incident") || l.includes("maintenance")) return "bg-red-50 text-red-600";
  if (l.includes("driver") || l.includes("unit") || l.includes("schedule")) return "bg-green-50 text-green-600";
  return "bg-slate-50 text-slate-600";
};

const KPICard = ({ label, value, icon, loading, currency, animate, kpiKey, kpiLabel }) => {
  const displayLabel = label ?? kpiLabel ?? "";

  return (
    <div className="relative bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm transition-all duration-150 flex flex-col justify-between min-h-[90px] overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getBorderColor(kpiKey, displayLabel)}`} />
      
      <div className="flex items-center justify-between gap-2 w-full pl-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{displayLabel}</span>
        {icon && (
          <div className={`p-1.5 rounded-lg text-base flex items-center justify-center shrink-0 ${getIconBgColor(kpiKey, displayLabel)}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="pl-1 mt-1">
        {loading ? (
          <div className="w-16 h-6 bg-slate-100 animate-pulse rounded" />
        ) : (
          <span
            className={`text-xl font-bold tracking-tight text-slate-900 ${animate ? "transition-all duration-700" : ""}`}
          >
            {currency ? "₱" : ""}
            {value !== undefined && value !== null ? value.toLocaleString() : "-"}
          </span>
        )}
      </div>
    </div>
  );
};

KPICard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  icon: PropTypes.node,
  loading: PropTypes.bool,
  currency: PropTypes.bool,
  animate: PropTypes.bool,
  kpiKey: PropTypes.string,
  kpiLabel: PropTypes.string,
};

export default KPICard;

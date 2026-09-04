import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

// Debounce hook
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Date Range Picker
function DateRangeFilter({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-medium">Date Range</label>
      <div className="flex gap-2">
        <input
          type="date"
          className="input input-bordered input-sm w-full"
          value={value.start || ""}
          onChange={e => onChange({ ...value, start: e.target.value })}
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          className="input input-bordered input-sm w-full"
          value={value.end || ""}
          onChange={e => onChange({ ...value, end: e.target.value })}
        />
      </div>
    </div>
  );
}

DateRangeFilter.propTypes = {
  value: PropTypes.shape({ start: PropTypes.string, end: PropTypes.string }),
  onChange: PropTypes.func.isRequired,
};

// Month Picker
function MonthFilter({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-medium">Month</label>
      <input
        type="month"
        className="input input-bordered input-sm w-full"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

MonthFilter.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

// Year Picker
function YearFilter({ value, onChange }) {
  // Generate years from 2015 to current year
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: now - 2014 }, (_, i) => (2015 + i).toString());
  }, []);
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-medium">Year</label>
      <select
        className="select select-bordered select-sm w-full"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">All</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

YearFilter.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

// Dropdown Filter (reusable)
function DropdownFilter({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-medium">{label}</label>
      <select
        className="select select-bordered select-sm w-full"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

DropdownFilter.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
  ).isRequired,
};

/**
 * AnalyticsFilters
 * @param {Object} props
 * @param {Object} props.initialFilters
 * @param {Function} props.onChange - called with debounced filters
 * @param {Array} props.driverOptions - [{ value, label }]
 * @param {Array} props.unitOptions - [{ value, label }]
 * @param {Array} props.maintenanceStatusOptions - [{ value, label }]
 */
export default function AnalyticsFilters({
  initialFilters = {},
  onChange,
  driverOptions = [],
  unitOptions = [],
  maintenanceStatusOptions = [],
}) {
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    month: "",
    year: "",
    driver: "",
    unit: "",
    maintenanceStatus: "",
    ...initialFilters,
  });

  // Debounce filter updates
  const debouncedFilters = useDebounce(filters, 500);
  useEffect(() => {
    onChange && onChange(debouncedFilters);
    // eslint-disable-next-line
  }, [debouncedFilters]);

  return (
    <div className="w-full bg-white rounded shadow p-4 mb-6 flex flex-col gap-4 md:flex-row md:gap-6 flex-wrap">
      <div className="flex flex-col md:w-1/5 min-w-[180px]">
        <DateRangeFilter
          value={filters.dateRange}
          onChange={val => setFilters(f => ({ ...f, dateRange: val }))}
        />
      </div>
      <div className="flex flex-col md:w-1/6 min-w-[120px]">
        <MonthFilter
          value={filters.month}
          onChange={val => setFilters(f => ({ ...f, month: val }))}
        />
      </div>
      <div className="flex flex-col md:w-1/6 min-w-[100px]">
        <YearFilter
          value={filters.year}
          onChange={val => setFilters(f => ({ ...f, year: val }))}
        />
      </div>
      <div className="flex flex-col md:w-1/6 min-w-[120px]">
        <DropdownFilter
          label="Driver"
          value={filters.driver}
          onChange={val => setFilters(f => ({ ...f, driver: val }))}
          options={driverOptions}
        />
      </div>
      <div className="flex flex-col md:w-1/6 min-w-[120px]">
        <DropdownFilter
          label="Unit"
          value={filters.unit}
          onChange={val => setFilters(f => ({ ...f, unit: val }))}
          options={unitOptions}
        />
      </div>
      <div className="flex flex-col md:w-1/6 min-w-[140px]">
        <DropdownFilter
          label="Maintenance Status"
          value={filters.maintenanceStatus}
          onChange={val => setFilters(f => ({ ...f, maintenanceStatus: val }))}
          options={maintenanceStatusOptions}
        />
      </div>
    </div>
  );
}

AnalyticsFilters.propTypes = {
  initialFilters: PropTypes.object,
  onChange: PropTypes.func,
  driverOptions: PropTypes.array,
  unitOptions: PropTypes.array,
  maintenanceStatusOptions: PropTypes.array,
};

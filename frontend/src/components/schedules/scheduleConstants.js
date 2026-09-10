// Schedule constants, route colors, date utilities, and route mappings

export const ROUTES = [
  "LANGGAM",
  "VILLAROSA",
  "BAYAN-BAYANAN",
  "ESTRELLA",
  "CALAMBA",
];

export const ROUTE_COLORS = {
  LANGGAM: {
    name: "Langgam",
    hex: "#3B82F6",
    tailwindBorder: "border-blue-500",
    tailwindBg: "bg-blue-500",
    tailwindText: "text-blue-600 dark:text-blue-400",
    tailwindBadge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    dot: "bg-blue-500",
    chipBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    borderLeft: "border-l-[#3B82F6]",
    timelineBg: "bg-blue-500/90 text-white",
  },
  VILLAROSA: {
    name: "Villarosa",
    hex: "#10B981",
    tailwindBorder: "border-emerald-500",
    tailwindBg: "bg-emerald-500",
    tailwindText: "text-emerald-600 dark:text-emerald-400",
    tailwindBadge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
    chipBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    borderLeft: "border-l-[#10B981]",
    timelineBg: "bg-emerald-500/90 text-white",
  },
  "BAYAN-BAYANAN": {
    name: "Bayan-Bayanan",
    hex: "#8B5CF6",
    tailwindBorder: "border-purple-500",
    tailwindBg: "bg-purple-500",
    tailwindText: "text-purple-600 dark:text-purple-400",
    tailwindBadge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    dot: "bg-purple-500",
    chipBg: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    borderLeft: "border-l-[#8B5CF6]",
    timelineBg: "bg-purple-500/90 text-white",
  },
  ESTRELLA: {
    name: "Estrella",
    hex: "#F97316",
    tailwindBorder: "border-orange-500",
    tailwindBg: "bg-orange-500",
    tailwindText: "text-orange-600 dark:text-orange-400",
    tailwindBadge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    dot: "bg-orange-500",
    chipBg: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    borderLeft: "border-l-[#F97316]",
    timelineBg: "bg-orange-500/90 text-white",
  },
  CALAMBA: {
    name: "Calamba",
    hex: "#EF4444",
    tailwindBorder: "border-red-500",
    tailwindBg: "bg-red-500",
    tailwindText: "text-red-600 dark:text-red-400",
    tailwindBadge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
    chipBg: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    borderLeft: "border-l-[#EF4444]",
    timelineBg: "bg-red-500/90 text-white",
  },
};

export const SHIFT_TIMES = {
  "First Shift": {
    label: "1st Shift",
    fullName: "First Shift",
    start: "05:00",
    end: "13:00",
    rangeLabel: "05:00 - 13:00",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  "Second Shift": {
    label: "2nd Shift",
    fullName: "Second Shift",
    start: "13:00",
    end: "21:00",
    rangeLabel: "13:00 - 21:00",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
};

export const getRouteForUnit = (bodyNumber, fallbackRoute, customRoutesMap = {}) => {
  if (fallbackRoute) {
    const upper = fallbackRoute.trim().toUpperCase();
    if (upper === "UNASSIGNED" || upper === "NONE" || upper === "") return null;
    return upper;
  }
  const num = parseInt(bodyNumber, 10);
  if (isNaN(num)) return "LANGGAM";
  if (num >= 1 && num <= 20) return "LANGGAM";
  if ((num >= 31 && num <= 40) || (num >= 46 && num <= 52) || num === 66) return "ESTRELLA";
  if ((num >= 21 && num <= 30) || (num >= 41 && num <= 45)) return "VILLAROSA";
  if (num >= 53 && num <= 56) return "BAYAN-BAYANAN";
  if (num >= 57 && num <= 65) return "CALAMBA";
  return "LANGGAM";
};

export const COLOR_PRESETS = [
  { name: "Blue", hex: "#3B82F6", tailwindBg: "bg-blue-500", tailwindBorder: "border-blue-500", tailwindText: "text-blue-600" },
  { name: "Green", hex: "#10B981", tailwindBg: "bg-emerald-500", tailwindBorder: "border-emerald-500", tailwindText: "text-emerald-600" },
  { name: "Purple", hex: "#8B5CF6", tailwindBg: "bg-purple-500", tailwindBorder: "border-purple-500", tailwindText: "text-purple-600" },
  { name: "Orange", hex: "#F97316", tailwindBg: "bg-orange-500", tailwindBorder: "border-orange-500", tailwindText: "text-orange-600" },
  { name: "Red", hex: "#EF4444", tailwindBg: "bg-red-500", tailwindBorder: "border-red-500", tailwindText: "text-red-600" },
  { name: "Gray", hex: "#6B7280", tailwindBg: "bg-slate-500", tailwindBorder: "border-slate-500", tailwindText: "text-slate-600" },
  { name: "Teal", hex: "#14B8A6", tailwindBg: "bg-teal-500", tailwindBorder: "border-teal-500", tailwindText: "text-teal-600" },
  { name: "Indigo", hex: "#6366F1", tailwindBg: "bg-indigo-500", tailwindBorder: "border-indigo-500", tailwindText: "text-indigo-600" },
];

export const getRouteConfig = (routeKey, customRoutes = {}) => {
  if (!routeKey) return ROUTE_COLORS.LANGGAM;
  const upper = routeKey.toUpperCase();
  if (ROUTE_COLORS[upper]) return ROUTE_COLORS[upper];
  if (customRoutes[upper]) {
    const cr = customRoutes[upper];
    return {
      name: cr.name || routeKey,
      hex: cr.hex || "#3B82F6",
      tailwindBorder: "border-blue-500",
      tailwindBg: "bg-blue-500",
      tailwindText: "text-blue-600 dark:text-blue-400",
      tailwindBadge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
      dot: "bg-blue-500",
      chipBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      borderLeft: `border-l-[${cr.hex || "#3B82F6"}]`,
      timelineBg: "bg-blue-500/90 text-white",
    };
  }
  return {
    name: routeKey,
    hex: "#6B7280",
    tailwindBorder: "border-slate-500",
    tailwindBg: "bg-slate-500",
    tailwindText: "text-slate-600 dark:text-slate-400",
    tailwindBadge: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    chipBg: "bg-slate-100 text-slate-800",
    borderLeft: "border-l-slate-400",
    timelineBg: "bg-slate-500/90 text-white",
  };
};

// Date utilities
export const getMondayOfWeek = (dateInput) => {
  const d = new Date(dateInput);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getDaysOfWeek = (startDate) => {
  const monday = getMondayOfWeek(startDate);
  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = current.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    days.push({
      date: current,
      dateStr,
      dayName: dayNames[i],
      fullDayName: fullDayNames[i],
      dayNum: current.getDate(),
      monthShort: current.toLocaleDateString("en-US", { month: "short" }),
      monthNum: current.getMonth() + 1,
      isToday: dateStr === todayStr,
    });
  }
  return days;
};

export const formatWeekRangeLabel = (startDate) => {
  const days = getDaysOfWeek(startDate);
  const first = days[0];
  const last = days[6];
  return `${first.monthShort} ${first.dayNum} – ${last.monthShort} ${last.dayNum}, ${last.date.getFullYear()}`;
};

export const formatDateFriendly = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTimestamp = (ts) => {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};


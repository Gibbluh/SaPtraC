import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Calendar,
  Layers,
  List,
  Clock,
  Copy,
  Trash2,
  Bookmark,
  Users,
  Truck,
  Sparkles,
  Command,
  ArrowRight,
  MapPin,
  HelpCircle,
  X
} from "lucide-react";
import { ROUTES, ROUTE_COLORS } from "./scheduleConstants";

const CommandPalette = ({
  isOpen,
  onClose,
  onAction, // (actionKey, payload) => void
  drivers = [],
  units = [],
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Built-in commands
  const defaultCommands = useMemo(() => [
    {
      id: "view-board",
      title: "Switch to Weekly Board View",
      subtitle: "Default hybrid Kanban & calendar grid",
      category: "Views",
      icon: Layers,
      shortcut: "W",
      action: () => onAction("SET_VIEW", "BOARD"),
    },
    {
      id: "view-list",
      title: "Switch to List View",
      subtitle: "Quick schedule overview grouped by route",
      category: "Views",
      icon: List,
      shortcut: "L",
      action: () => onAction("SET_VIEW", "LIST"),
    },
    {
      id: "view-month",
      title: "Switch to Month Calendar View",
      subtitle: "Notion-inspired month-at-a-glance",
      category: "Views",
      icon: Calendar,
      shortcut: "M",
      action: () => onAction("SET_VIEW", "MONTH"),
    },
    {
      id: "view-timeline",
      title: "Switch to Day Timeline View",
      subtitle: "04:00 - 22:00 operational Gantt timeline",
      category: "Views",
      icon: Clock,
      shortcut: "D",
      action: () => onAction("SET_VIEW", "TIMELINE"),
    },
    {
      id: "action-today",
      title: "Jump to Today",
      subtitle: "Center schedule on current calendar date",
      category: "Navigation",
      icon: Calendar,
      shortcut: "T",
      action: () => onAction("JUMP_TODAY"),
    },
    {
      id: "action-assign",
      title: "Create New Assignment",
      subtitle: "One-click dispatch modal for unit and driver",
      category: "Scheduling",
      icon: Sparkles,
      shortcut: "A",
      action: () => onAction("OPEN_ASSIGN"),
    },
    {
      id: "action-copy-week",
      title: "Copy Current Week Schedule",
      subtitle: "Duplicate all active assignments to next week",
      category: "Bulk Actions",
      icon: Copy,
      action: () => onAction("COPY_WEEK"),
    },
    {
      id: "action-template",
      title: "Save Current Week as Template",
      subtitle: "Save recurring roster pattern for fast re-use",
      category: "Bulk Actions",
      icon: Bookmark,
      action: () => onAction("SAVE_TEMPLATE"),
    },
    {
      id: "action-toggle-unscheduled",
      title: "Toggle Unscheduled Resources Sidebar",
      subtitle: "Show/hide unassigned drivers and idle units",
      category: "Panels",
      icon: Users,
      action: () => onAction("TOGGLE_UNSCHEDULED"),
    },
    ...ROUTES.map((route) => ({
      id: `filter-route-${route}`,
      title: `Filter Route: ${route}`,
      subtitle: `Show only units on ${route} route`,
      category: "Route Filters",
      icon: MapPin,
      action: () => onAction("SET_ROUTE_FILTER", route),
    })),
    {
      id: "filter-route-all",
      title: "Clear Route Filters (Show All Routes)",
      subtitle: "Display all routes and units",
      category: "Route Filters",
      icon: MapPin,
      action: () => onAction("SET_ROUTE_FILTER", "ALL"),
    },
  ], [onAction]);

  // Combine commands with driver/unit searches
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return defaultCommands;

    const matchedCommands = defaultCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );

    // Driver search
    const matchedDrivers = drivers
      .filter((d) => `${d.firstName} ${d.lastName}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((d) => ({
        id: `driver-${d._id}`,
        title: `${d.firstName} ${d.lastName}`,
        subtitle: `Driver • ${d.phone || "Active"}`,
        category: "Drivers",
        icon: Users,
        action: () => onAction("SELECT_DRIVER", d),
      }));

    // Unit search
    const matchedUnits = units
      .filter((u) => `Unit ${u.bodyNumber} ${u.plateNumber}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((u) => ({
        id: `unit-${u._id}`,
        title: `Unit ${u.bodyNumber}`,
        subtitle: `Plate ${u.plateNumber} • ${u.route || "Modern Jeepney"}`,
        category: "Units",
        icon: Truck,
        action: () => onAction("VIEW_UNIT_HISTORY", u),
      }));

    return [...matchedCommands, ...matchedDrivers, ...matchedUnits];
  }, [query, defaultCommands, drivers, units, onAction]);

  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          selected.action();
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <Command className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search drivers, units..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-700/40 text-xs">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">
              No matching commands or resources found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span className="font-medium text-blue-600">Linear-Inspired Command Engine</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;


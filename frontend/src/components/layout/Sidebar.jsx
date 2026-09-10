import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import AuthContext from "../../lib/AuthContext";
import ThemeContext from "../../lib/ThemeContext";
import NotificationContext from "../../lib/NotificationContext";
import { PERMISSIONS } from "../../config/rolePermissions";
import LogoutModal from "./LogoutModal";

import {
  LayoutDashboard,
  Users,
  Truck,
  CalendarDays,
  BarChart3,
  HandCoins,
  Fuel,
  Wrench,
  UserCog,
  LogOut,
  Pin,
} from "lucide-react";

const Sidebar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { currentThemeConfig } = useContext(ThemeContext);
  const { notifications = [] } = useContext(NotificationContext) || {};
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  // Persistent setting: true = permanently expanded, false = compact icons with hover expansion
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem("sidebar_pinned") === "true";
    } catch {
      return false;
    }
  });

  // Transient hover state when not permanently pinned
  const [isHovered, setIsHovered] = useState(false);

  // Expanded state is active if pinned or hovered
  const isExpanded = isPinned || isHovered;

  const renderNavItem = (item) => {
    const Icon = getIcon(item.key);
    return (
      <NavLink
        key={item.key}
        to={item.path}
        className={({ isActive }) =>
          `group flex items-center h-11 w-full px-2 rounded-xl transition-all duration-150 border-l-4 mb-1 ${
            isActive
              ? "bg-white/10 text-white font-semibold border-red-600 shadow-sm"
              : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 2}
                className={`shrink-0 transition-colors duration-150 ${
                  isActive ? "text-white" : "text-white/70 group-hover:text-white"
                }`}
              />
              {!isExpanded && ['remittances', 'maintenance'].includes(item.key) && notifications.filter(n => n.type === item.key && !n.readStatus).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white border border-[#1B3679] shadow-sm z-10">
                  {notifications.filter(n => n.type === item.key && !n.readStatus).length}
                </span>
              )}
            </div>
            <span
              className={`ml-2 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-100 ease-out ${
                isExpanded
                  ? "opacity-100 max-w-[170px] translate-x-0"
                  : "opacity-0 max-w-0 -translate-x-4 pointer-events-none"
              }`}
            >
              {item.label}
            </span>
            {item.key === 'remittances' && notifications.filter(n => n.type === 'remittances' && !n.readStatus).length > 0 && (
              <span className={`ml-auto bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-opacity duration-150 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {notifications.filter(n => n.type === 'remittances' && !n.readStatus).length}
              </span>
            )}
            {item.key === 'maintenance' && notifications.filter(n => n.type === 'maintenance' && !n.readStatus).length > 0 && (
              <span className={`ml-auto bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-opacity duration-150 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {notifications.filter(n => n.type === 'maintenance' && !n.readStatus).length}
              </span>
            )}

          </>
        )}
      </NavLink>
    );
  };


  const CATEGORIES = [
    {
      name: "Operations",
      keys: ["dashboard", "schedules", "drivers", "units"]
    },
    {
      name: "Finance",
      keys: ["remittances", "fuel"]
    },
    {
      name: "Maintenance",
      keys: ["maintenance"]
    },
    {
      name: "System",
      keys: ["analytics", "users"]
    }
  ];

  const togglePin = (e) => {
    e?.stopPropagation();
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_pinned", String(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const rawRole = user?.role || "";
  const roleLower = String(rawRole).trim().toLowerCase().replace(/[-_]/g, " ");

  const isSuperAdmin =
    !rawRole ||
    roleLower.includes("super") ||
    roleLower === "super admin" ||
    roleLower === "superadmin" ||
    roleLower === "admin";

  const normalizedRole = (() => {
    if (isSuperAdmin) return "Super Admin";
    if (roleLower.includes("admin")) return "Administrator";
    if (roleLower.includes("operational") || roleLower.includes("op manager")) return "Operational Manager";
    if (roleLower.includes("cashier")) return "Cashier";
    if (roleLower.includes("pump") || roleLower.includes("fuel")) return "Fuel Pump Attendant";
    if (roleLower.includes("mechanic") || roleLower.includes("mech")) return "Mechanic";
    if (roleLower.includes("driver")) return "Driver";
    return rawRole;
  })();

  const items = isAuthenticated
    ? PERMISSIONS.filter((p) => {
        // Super Admin has full unrestricted access to all menu items
        if (isSuperAdmin) return true;

        const isAllowedRole = p.roles.includes(normalizedRole);
        if (!isAllowedRole) return false;

        // Custom display filters for presentation mode
        if (normalizedRole === "Operational Manager") {
          return [
            "dashboard",
            "drivers",
            "units",
            "schedules",
            "analytics",
          ].includes(p.key);
        }

        if (normalizedRole === "Cashier") {
          return ["dashboard", "remittances"].includes(p.key);
        }

        if (normalizedRole === "Fuel Pump Attendant") {
          return ["dashboard", "fuel"].includes(p.key);
        }

        if (normalizedRole === "Mechanic") {
          return ["dashboard", "maintenance"].includes(p.key);
        }

        return true;
      })
    : [];

  const getIcon = (key) => {
    const icons = {
      dashboard: LayoutDashboard,
      users: UserCog,
      drivers: Users,
      units: Truck,
      schedules: CalendarDays,
      scheduling: CalendarDays,
      analytics: BarChart3,
      remittances: HandCoins,
      remittance: HandCoins,
      fuel: Fuel,
      maintenance: Wrench,
    };

    return icons[key] || LayoutDashboard;
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogout(false);
    navigate("/");
  };

  return (
    <>
      {/* Structural layout spacer that reserves space in the document flow - only expands when pinned to avoid layout thrashing on hover */}
      <div
        className={`shrink-0 transition-[width] duration-100 ease-out relative ${
          isExpanded ? "w-64" : "w-20"
        }`}
      />

      {/* Sidebar Panel: compact w-20 when idle, expands smoothly to w-64 on hover or when pinned */}
      <aside
        id="app-sidebar"
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
        className={`fixed top-0 left-0 h-screen ${currentThemeConfig.sidebar || "bg-blue-950 text-blue-100 border-white/10"} flex flex-col justify-between border-r z-40 transition-[width,box-shadow] duration-100 ease-out select-none ${
          isExpanded ? "w-64 shadow-2xl" : "w-20 shadow-md"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* TOP HEADER - Fixed height: exactly 76px in both collapsed & expanded states */}
          <div className={`h-[76px] shrink-0 border-b border-white/10 flex items-center px-3.5 overflow-hidden transition-colors duration-150 ${currentThemeConfig.sidebarHeader || "bg-transparent"}`}>
            {/* Logo emblem - stays in exact same position */}
            <div
              className="w-11 h-11 shrink-0 flex items-center justify-center cursor-pointer"
              onClick={togglePin}
              title={isPinned ? "Sidebar is pinned. Click to unpin." : "Click to pin sidebar"}
            >
              <img
                src="/images/9d87ecd4-644f-4661-8a04-b7e529051f85.png"
                alt="San Pedro Transport Cooperative logo"
                className="h-9 w-9 object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105"
              />
            </div>

            {/* Cooperative Portal branding - reveals strictly from left to right */}
            <div
              className={`ml-2.5 flex-1 min-w-0 overflow-hidden whitespace-nowrap transition-all duration-100 ease-out ${
                isExpanded
                  ? "opacity-100 max-w-[170px] translate-x-0"
                  : "opacity-0 max-w-0 -translate-x-4 pointer-events-none"
              }`}
            >
              <span className="block text-[9px] font-bold text-white/70 tracking-wider uppercase truncate">
                Cooperative Portal
              </span>
              <span className="block text-xs font-black text-white tracking-tight uppercase truncate">
                SAN PEDRO
              </span>
              <span className="block text-[10px] font-bold text-white/80 tracking-tight uppercase truncate">
                TRANSPORT COOP
              </span>
            </div>
          </div>

          {/* NAVIGATION LINKS - Constant heights & fixed icon alignment; text slides in left-to-right */}
                              <nav className="px-2.5 flex-1 min-h-0 overflow-y-auto py-3">
            {isSuperAdmin ? (
              CATEGORIES.map((category, idx) => {
                const categoryItems = items.filter(item => category.keys.includes(item.key));
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.name} className={idx !== 0 ? (isExpanded ? "mt-4" : "mt-1") : ""}>
                    {/* Category Header - Horizontal Slide */}
                    <div className={`px-3 font-bold text-white tracking-wider transition-all duration-100 ease-out overflow-hidden whitespace-nowrap ${
                      isExpanded
                        ? "text-xs pt-3 pb-1.5 opacity-100 max-w-[170px]"
                        : "text-[0px] h-0 opacity-0 max-w-0 pointer-events-none"
                    }`}>
                      {category.name}
                    </div>
                    
                    <div className="space-y-1">
                      {categoryItems.map((item) => renderNavItem(item))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-1">
                {items.map(item => renderNavItem(item))}
              </div>
            )}
            
            {items.length === 0 && (
              <div
                className={`px-3 py-3 text-sm font-medium text-white/70 overflow-hidden whitespace-nowrap transition-all duration-150 ${
                  isExpanded ? "opacity-100" : "opacity-0"
                }`}
              >
                Menu unavailable for this account.
              </div>
            )}
          </nav>
        </div>

        {/* BOTTOM CONTROLS - Fixed heights and left-to-right reveals */}
        <div className="shrink-0 p-2.5 border-t border-white/10 space-y-1">

          {/* Keep Expanded Setting Button / Row */}
          <div
            id="sidebar-permanent-expand-switch"
            role="button"
            tabIndex={0}
            onClick={togglePin}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePin();
              }
            }}
            title={
              isPinned
                ? "Keep Expanded is ON (Click to collapse to icon rail)"
                : "Keep Expanded is OFF (Click to permanently expand)"
            }
            className={`group flex items-center h-11 w-full px-2 rounded-xl cursor-pointer transition-all duration-150 select-none ${
              isPinned
                ? "bg-black/20 text-white ring-1 ring-white/10"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {/* Fixed Icon container */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <Pin
                size={18}
                className={`transition-transform duration-200 ${
                  isPinned
                    ? "text-amber-400 fill-amber-400 rotate-45"
                    : "text-white/70 group-hover:text-white"
                }`}
              />
            </div>

            {/* Expanded Content: Label + Switch Pill */}
            <div
              className={`ml-2 flex-1 flex items-center justify-between min-w-0 overflow-hidden whitespace-nowrap transition-all duration-100 ease-out ${
                isExpanded
                  ? "opacity-100 max-w-[170px] translate-x-0"
                  : "opacity-0 max-w-0 -translate-x-4 pointer-events-none"
              }`}
            >
              <div className="min-w-0 pr-2">
                <span className="font-semibold text-white text-xs block leading-tight truncate">
                  Keep Expanded
                </span>
                <span className="text-[10px] text-white/60 block leading-tight truncate">
                  {isPinned ? "Always open" : "Expand on hover"}
                </span>
              </div>

              {/* Visual Switch Indicator */}
              <span
                className={`relative inline-flex h-4 w-8 shrink-0 rounded-full border border-white/20 transition-colors duration-200 ease-out ${
                  isPinned ? "bg-white/40" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-out ${
                    isPinned ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </div>
          </div>


        </div>

        <LogoutModal
          open={showLogout}
          onClose={() => setShowLogout(false)}
          onConfirm={handleConfirmLogout}
        />
      </aside>
    </>
  );
};

export default Sidebar;


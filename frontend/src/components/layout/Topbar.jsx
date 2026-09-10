import { useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  ChevronDown,
  LogOut,
  Sparkles,
  Command,
  Plus,
  ExternalLink,
  Truck,
  Users,
  Fuel,
  CalendarDays,
  Wrench,
  BarChart3,
  HelpCircle,
  Radio,
  Palette,
} from "lucide-react";
import AuthContext from "../../lib/AuthContext";
import ThemeContext from "../../lib/ThemeContext";
import NotificationBell from "../notifications/NotificationBell";
import LogoutModal from "./LogoutModal";

const routeTitles = {
  "/dashboard": { title: "Dashboard Overview", category: "Operations", crumb: "Fleet Central" },
  "/users": { title: "User Management", category: "Administration", crumb: "Access Control" },
  "/drivers": { title: "Driver Management", category: "Fleet Personnel", crumb: "Drivers" },
  "/units": { title: "Unit Management", category: "Fleet Vehicles", crumb: "Modern Jeepneys" },
  "/schedules": { title: "Dispatch & Scheduling", category: "Operations", crumb: "Route Timetable" },
  "/fuel": { title: "Fuel Monitoring & Logs", category: "Finance & Audit", crumb: "Fuel Receipts" },
  "/remittances": { title: "Daily Remittances", category: "Finance & Audit", crumb: "Collections" },
  "/maintenance": { title: "Maintenance & Repairs", category: "Fleet Health", crumb: "Work Orders" },
  "/analytics": { title: "Analytics & Reports", category: "Intelligence", crumb: "Performance Metrics" },
};

const quickActions = [
  { label: "Dispatch / Schedules", path: "/schedules", icon: CalendarDays, desc: "Assign drivers & modern jeepneys" },
  { label: "Record Fuel", path: "/fuel", icon: Fuel, desc: "Log fuel purchases or gas station receipts" },
  { label: "Fleet Units", path: "/units", icon: Truck, desc: "View vehicle roster and status" },
  { label: "Driver Roster", path: "/drivers", icon: Users, desc: "Personnel records and licenses" },
  { label: "Maintenance Work", path: "/maintenance", icon: Wrench, desc: "Log vehicle repairs or inspection" },
  { label: "Analytics & Audits", path: "/analytics", icon: BarChart3, desc: "Daily revenue and operation logs" },
];

export default function Topbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, setTheme, themes, currentThemeConfig } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const searchInputRef = useRef(null);

  const routeMeta = routeTitles[location.pathname] || {
    title: "San Pedro Transport Cooperative",
    category: "Portal",
    crumb: "Overview",
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K opens quick-search command bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  const filteredQuickActions = quickActions.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeStyle = (role) => {
    const r = String(role || "").toLowerCase();
    if (r.includes("super admin")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (r.includes("admin")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (r.includes("cashier")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (r.includes("mechanic")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (r.includes("driver")) return "bg-slate-100 text-slate-800 border-slate-200";
    return "bg-blue-50 text-blue-700 border-blue-100";
  };

  return (
    <>
      <header
        id="app-topbar"
        className={`sticky top-0 z-30 h-16 backdrop-blur-md border-b px-4 md:px-6 flex items-center justify-between transition-all select-none ${currentThemeConfig.topbar || "bg-white/95 border-slate-200/80 text-slate-900"}`}
      >
        {/* Left Side: Page Title */}
        <div className={`flex items-center gap-3 min-w-0 ${['/units', '/dashboard', '/drivers', '/users'].includes(location.pathname) ? 'invisible' : ''}`}>
          <div className="min-w-0">
            {/* Page Heading */}
            <h1 className="text-base sm:text-lg font-bold tracking-tight leading-none truncate">
              {routeMeta.title}
            </h1>
          </div>
        </div>

        {/* Center: Market-Standard Universal Search / Command Palette Bar */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
          <button
            id="topbar-global-search-btn"
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 opacity-100 hover:opacity-100 transition-all text-xs font-normal group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0 truncate">
              <Search size={14} className="opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
              <span className="truncate">Search modules, units, drivers, routes...</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold opacity-70 bg-transparent border border-current/20 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Side: Status Badge, Clock, Notification Bell, User Account Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* Theme Switcher */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs font-semibold text-current opacity-90 tracking-tight shadow-2xs hover:bg-slate-500/20 hover:opacity-100 transition-colors">
              <Palette size={14} className="opacity-70" />
              <span className="hidden sm:inline">Theme</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
              {Object.values(themes).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${
                    theme === t.id ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.name}
                  {theme === t.id && <ShieldCheck size={14} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Notification Bell */}
          <div className="flex items-center justify-center">
            <NotificationBell userId={user?._id || user?.id} />
          </div>
          <div className="h-6 w-px bg-current opacity-20 hidden sm:block" />
          {/* User Account Pill Dropdown */}
          <div className="relative">
            <button
              id="topbar-user-profile-menu-trigger"
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-1.5 sm:pr-2.5 rounded-xl border border-current/20 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                SA
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
                <span className="text-xs font-bold truncate max-w-[120px]">
                  {user?.fullName || "Super Administrator"}
                </span>
                <span
                  className="text-[9px] font-semibold px-1 py-[1px] rounded border mt-0.5 inline-block w-fit bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                >
                  Super Admin
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`opacity-70 transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div
                  id="topbar-profile-dropdown-menu"
                  className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.fullName || "Super Administrator"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      admin@saptrac.com
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded border inline-block bg-red-100 text-red-700 border-red-200"
                      >
                        Super Admin
                      </span>
                      <span className="text-[10px] text-slate-400">ID: ADMIN-01</span>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/dashboard");
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-left"
                    >
                      <ShieldCheck size={15} className="text-slate-400" />
                      Fleet Dashboard
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate("/");
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors text-left"
                    >
                      <LogOut size={15} className="text-red-500" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-current opacity-20 hidden sm:block" />


        </div>
      </header>

      {/* Global Quick Command Palette (Market Standard: Linear / GitHub / Stripe Command Palette) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to a portal module, vehicle unit, or schedule..."
                className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 bg-white"
              >
                ESC
              </button>
            </div>

            {/* Quick Navigation Results */}
            <div className="p-2 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Navigation & Modules
              </div>
              {filteredQuickActions.length > 0 ? (
                <div className="space-y-1">
                  {filteredQuickActions.map((item) => {
                    const ActionIcon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(item.path);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ActionIcon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <ExternalLink size={13} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No matching modules found for "{searchQuery}"
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>San Pedro Transport Cooperative Quick Access</span>
              <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Esc</kbd> to exit</span>
            </div>
          </div>
        </div>
      )}

      <LogoutModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />
    </>
  );
}


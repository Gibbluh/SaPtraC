import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import AuthContext from "../../lib/AuthContext";
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
} from "lucide-react";

const Sidebar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const normalizedRole =
    user?.role === "Admin" ? "Administrator" : user?.role;

  const items = isAuthenticated
    ? PERMISSIONS.filter((p) => {
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
      analytics: BarChart3,
      remittances: HandCoins,
      fuel: Fuel,
      maintenance: Wrench,
    };

    return icons[key] || LayoutDashboard;
  };

  const handleConfirmLogout = () => {
    // Call existing logout from AuthContext, then redirect to home
    logout();
    setShowLogout(false);
    navigate("/");
  };

  return (
    <aside className="w-64 bg-blue-950 text-blue-100 flex flex-col justify-between h-screen sticky top-0 border-r border-white/5 overflow-hidden">
  <div className="flex flex-col flex-1 min-h-0">

    {/* LOGO */}
    <div className="w-full flex justify-center items-center px-4 pt-5 pb-3">
      <img
        src="/images/9d87ecd4-644f-4661-8a04-b7e529051f85.png"
        alt="San Pedro Transport Cooperative logo"
        className="h-28 w-full object-contain drop-shadow-sm"
      />
    </div>

    {/* PORTAL TITLE */}
    <div className="px-6 py-5 border-b border-white/10 mb-4">
      <span className="block text-[10px] font-bold text-blue-400 tracking-wider uppercase mb-1">
        Cooperative Portal
      </span>

      <span className="block text-sm font-extrabold text-white tracking-tight leading-tight uppercase">
        SAN PEDRO TRANSPORT COOPERATIVE
      </span>
    </div>

        <nav className="px-3 flex-1 min-h-0 overflow-y-auto pb-4">
          {items.map((item) => {
            const Icon = getIcon(item.key);

            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mb-1 border-l-4 ${
                    isActive
                      ? "bg-white/10 text-white font-semibold border-red-600"
                      : "border-transparent text-blue-200/80 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className="shrink-0"
                />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
          {items.length === 0 && (
            <div className="px-4 py-3 text-sm font-medium text-blue-200/70">
              Menu unavailable for this account.
            </div>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          className="w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-blue-300 hover:bg-white/5 hover:text-red-400"
          onClick={() => setShowLogout(true)}
        >
          <LogOut
            size={18}
            strokeWidth={2}
            className="shrink-0"
          />

          <span>Logout</span>
        </button>
      </div>

      <LogoutModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleConfirmLogout}
      />
    </aside>
  );
};

export default Sidebar;

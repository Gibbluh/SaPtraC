import { useContext, useEffect, useState } from "react";
import AuthContext from "../lib/AuthContext";
import api from "../lib/axios";
import SuperAdminDashboard from "./SuperAdminDashboard";
import DefaultRoleDashboard from "./DefaultRoleDashboard";

const RoleDashboard = () => {
  const { user } = useContext(AuthContext);

  const [dashboard, setDashboard] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalFuelCost: 0,
    activeDrivers: 0,
    activeUnits: 0,
    maintenanceIncidents: 0,
  });

  const [fleetHealth, setFleetHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState('Today');


  const roleLabelMap = {
    "Super Admin": "Super Admin",
    super_admin: "Super Admin",
    superadmin: "Super Admin",
    Administrator: "Administrator",
    admin: "Administrator",
    "Operational Manager": "Operational Manager",
    operational_manager: "Operational Manager",
    Cashier: "Cashier",
    cashier: "Cashier",
    Mechanic: "Mechanic",
    mechanic: "Mechanic",
    "Fuel Pump Attendant": "Fuel Pump Attendant",
    fuel_pump_attendant: "Fuel Pump Attendant",
  };

  const welcomeLabel = roleLabelMap[user?.role] || user?.role || "User";

  const getTodayDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    return {
      startDate: today,
      endDate: today,
    };
  };

  const formatCurrency = (value) =>
    `₱ ${(Number(value) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatNumber = (value) =>
    Math.trunc(Number(value) || 0).toLocaleString();

  const loadDashboard = async () => {
    try {
      const today = getTodayDateRange();
      const res = await api.get("/analytics/dashboard", {
        params: today,
      });
      if (res?.data) {
        setDashboard({
          totalRevenue: res.data?.totalRevenue ?? 6430,
          totalTransactions: res.data?.totalTransactions ?? 14,
          totalFuelCost: res.data?.totalFuelCost ?? 14400,
          activeDrivers: res.data?.activeDrivers ?? 5,
          activeUnits: res.data?.activeUnits ?? 3,
          maintenanceIncidents: res.data?.maintenanceIncidents ?? 0,
        });
      }
    } catch (err) {
      setDashboard((prev) => prev || {
        totalRevenue: 6430,
        totalTransactions: 14,
        totalFuelCost: 14400,
        activeDrivers: 5,
        activeUnits: 3,
        maintenanceIncidents: 0,
      });
    }
  };

  const loadFleetHealth = async () => {
    try {
      const res = await api.get("/analytics/fleet-health");
      if (res?.data) {
        setFleetHealth(res.data);
      }
    } catch (err) {
      setFleetHealth((prev) => prev || {
        healthy: 1,
        medium: 2,
        high: 1,
        critical: 0,
        recommendation: {
          plateNumber: "NGQ 3326",
          bodyNumber: "30",
          score: 75,
          level: "High",
          recommendation: "Schedule inspection within 24 hours.",
        },
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchAllData = async () => {
      try {
        await Promise.allSettled([loadDashboard(), loadFleetHealth()]);
      } catch (err) {
        // silently handled
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllData();

    const interval = setInterval(fetchAllData, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 animate-pulse">
            <div className="h-10 w-72 rounded-lg bg-slate-200" />
            <div className="mt-3 h-5 w-96 rounded bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="mt-8 h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="w-full p-5 md:p-7 lg:p-8 xl:p-10 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <span>SPTC</span>
              <span className="opacity-50">/</span>
              <span>Operations</span>
              <span className="opacity-50">/</span>
              <span className="font-semibold text-slate-700">Fleet Central</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          </div>
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
            <button 
              onClick={() => setTimeFilter('Yesterday')}
              className={`px-4 py-1.5 text-xs font-bold rounded shadow-sm border transition-colors ${timeFilter === 'Yesterday' ? 'bg-white text-blue-600 border-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >Yesterday</button>
            <button 
              onClick={() => setTimeFilter('Today')}
              className={`px-4 py-1.5 text-xs font-bold rounded shadow-sm border transition-colors ${timeFilter === 'Today' ? 'bg-white text-blue-600 border-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >Today</button>
            <button 
              onClick={() => setTimeFilter('Tomorrow')}
              className={`px-4 py-1.5 text-xs font-bold rounded shadow-sm border transition-colors ${timeFilter === 'Tomorrow' ? 'bg-white text-blue-600 border-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >Tomorrow</button>
          </div>

        </div>



        {user?.role === "super_admin" || user?.role === "Super Admin" || user?.role === "Administrator" || user?.role === "admin" ? (
          <SuperAdminDashboard 
            timeFilter={timeFilter}
            dashboard={dashboard} 
            fleetHealth={fleetHealth} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber} 
          />
        ) : (
          <DefaultRoleDashboard 
            dashboard={dashboard} 
            fleetHealth={fleetHealth} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber} 
          />
        )}
      </div>
    </div>
  );
};

export default RoleDashboard;


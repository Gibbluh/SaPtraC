import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useContext } from "react";

import AuthContext from "./lib/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Sidebar from "./components/layout/Sidebar";

import LoginPage from "./pages/LoginPage";
import RoleDashboard from "./pages/RoleDashboard";

import DriverDashboard from "./pages/Public/DriverDashboard";
import UnitDashboard from "./pages/Public/UnitDashboard";
import FuelReceiptPage from "./pages/Public/FuelReceiptPage";

import UserManagementPage from "./pages/admin/UserManagementPage";
import DriverManagementPage from "./pages/admin/DriverManagementPage";
import UnitManagementPage from "./pages/admin/UnitManagementPage";
import SchedulingPage from "./pages/admin/SchedulingPage";
import FuelMonitoringPage from "./pages/admin/FuelMonitoringPage";
import RemittanceMonitoringPage from "./pages/admin/RemittanceMonitoringPage";
import MaintenanceDashboard from "./pages/admin/MaintenanceDashboard";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import DailyFuelReceiptPage from "./pages/public/DailyFuelReceiptPage";

const protectedRoutes = [
  { path: "/dashboard", element: <RoleDashboard /> },
  { path: "/users", element: <UserManagementPage /> },
  { path: "/drivers", element: <DriverManagementPage /> },
  { path: "/units", element: <UnitManagementPage /> },
  { path: "/schedules", element: <SchedulingPage /> },
  { path: "/fuel", element: <FuelMonitoringPage /> },
  { path: "/remittances", element: <RemittanceMonitoringPage /> },
  { path: "/maintenance", element: <MaintenanceDashboard /> },
  { path: "/analytics", element: <AnalyticsDashboard /> },
];

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  const isPublicDashboard =
  location.pathname.startsWith("/driver/") ||
  location.pathname.startsWith("/unit/") ||
  location.pathname.startsWith("/fuel/");

  return (
    <div data-theme="light" className="min-h-screen bg-white flex">

      {isAuthenticated && !isPublicDashboard && <Sidebar />}

      <div className="flex-1">

        <Routes>

          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route path="/driver/:id" element={<DriverDashboard />} />

          <Route path="/unit/:id" element={<UnitDashboard />} />

          <Route path="/fuel/:id" element={<FuelReceiptPage />} />
          
          <Route path="/fuel/daily-receipt/:dateKey" element={<DailyFuelReceiptPage />}/>

          <Route element={<ProtectedRoute />}>
            {protectedRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </div>

    </div>
  );
}

export default App;

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../lib/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // redirect to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    // authenticated but unauthorized
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;

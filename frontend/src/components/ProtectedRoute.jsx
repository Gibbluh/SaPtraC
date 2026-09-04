import { useAuth } from "../lib/useAuth";
import { Navigate } from "react-router";

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <div className="p-8 text-center">Access Denied: Insufficient Permissions</div>;
  }
  return children;
};

export default ProtectedRoute;

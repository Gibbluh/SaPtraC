import { createContext, useState, useEffect } from "react";
import api from "./axios";
import { getStoredUser } from "./useAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );
  const [loading, setLoading] = useState(false);

  // Keep axios default Authorization header in sync with token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      setUser(res.data.user);
      setToken(res.data.token);

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // cleanup axios header
    delete api.defaults.headers.common["Authorization"];
  };

  const hasRole = (required) => {
    if (!user || !required) return false;
    if (Array.isArray(required)) return required.includes(user.role);
    return user.role === required;
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: Boolean(user && token),
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
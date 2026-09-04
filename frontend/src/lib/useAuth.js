import { useContext } from "react";
import AuthContext from "./AuthContext";

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const useAuth = () => useContext(AuthContext);

export default useAuth;
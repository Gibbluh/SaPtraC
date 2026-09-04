import api from "./axios";
import useAuth from "./useAuth";

export const useDriverApi = () => {
  useAuth();

  const getDrivers = async (params = {}) => {
    const res = await api.get("/drivers", {
      params,
    });

    return res.data;
  };

  const getDriversDropdown = async () => {
    const res = await api.get("/drivers/dropdown");
    return res.data;
  };

  return {
    getDrivers,
    getDriversDropdown,
  };
};

export default useDriverApi;
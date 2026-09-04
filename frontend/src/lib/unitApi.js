import api from "./axios";
import useAuth from "./useAuth";

export const useUnitApi = () => {
  useAuth();

  const getUnits = async (params = {}) => {
    const res = await api.get("/units", { params });
    return res.data;
  };

  return {
    getUnits,
  };
};

export default useUnitApi;
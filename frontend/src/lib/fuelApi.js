import api from "./axios";
import useAuth from "./useAuth";


// Fuel API integration layer
export const useFuelApi = () => {
  useAuth(); // Ensures auth context is available

const getPublicFuelTransaction = async (id) => {
  const res = await api.get(`/fuel/public/${id}`);
  return res.data;
};

  // Get all fuel transactions (with optional query params: pagination, search, filter)
  const getFuelTransactions = async (params = {}) => {
    const res = await api.get("/fuel", { params });
    return res.data;
  };

  // Get a single fuel transaction by ID
  const getSingleFuelTransaction = async (fuelId) => {
    const res = await api.get(`/fuel/${fuelId}`);
    return res.data;
  };

  // Create a new fuel transaction
  const createFuelTransaction = async (fuelData) => {
    const res = await api.post("/fuel", fuelData);
    return res.data;
  };

  // Update an existing fuel transaction
  const updateFuelTransaction = async (fuelId, fuelData) => {
    const res = await api.put(`/fuel/${fuelId}`, fuelData);
    return res.data;
  };

  // Delete a fuel transaction (soft delete)
  const deleteFuelTransaction = async (fuelId) => {
    const res = await api.delete(`/fuel/${fuelId}`);
    return res.data;
  };

  // Get fuel analytics (custom endpoint, e.g., /fuel/analytics)
  const getFuelAnalytics = async (params = {}) => {
    const res = await api.get("/fuel/analytics", { params });
    return res.data;
  };

  // DAILY FUEL & REMITTANCE RECEIPT HISTORY
const getDailyFuelReceiptHistory = async () => {
    const res = await api.get("/fuel/public/daily-history");
    return res.data;
};

return {
  getFuelTransactions,
  getSingleFuelTransaction,
  getPublicFuelTransaction,
  createFuelTransaction,
  updateFuelTransaction,
  deleteFuelTransaction,
  getFuelAnalytics,
  getDailyFuelReceiptHistory,
};
};

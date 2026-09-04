import api from "./axios";
import useAuth from "./useAuth";

// Remittance API integration layer
export const useRemittanceApi = () => {
  useAuth(); // Ensures context is available for future extensibility

  // Get all remittances (with optional query params)
  const getRemittances = async (params = {}) => {
    const res = await api.get("/remittances", { params });
    return res.data;
  };

  // Get a single remittance by ID
  const getSingleRemittance = async (remittanceId) => {
    const res = await api.get(`/remittances/${remittanceId}`);
    return res.data;
  };

  // Update an existing remittance
  const updateRemittance = async (remittanceId, remittanceData) => {
    const res = await api.put(`/remittances/${remittanceId}`, remittanceData);
    return res.data;
  };

  // Delete a remittance (soft delete)
  const deleteRemittance = async (remittanceId) => {
    const res = await api.delete(`/remittances/${remittanceId}`);
    return res.data;
  };

  // Verify a remittance
  const verifyRemittance = async (remittanceId) => {
    const res = await api.patch(`/remittances/${remittanceId}/verify`);
    return res.data;
  };

  // Reject a remittance
  const rejectRemittance = async (remittanceId) => {
    const res = await api.patch(`/remittances/${remittanceId}/reject`);
    return res.data;
  };

  // Get remittance analytics (custom endpoint, adjust as needed)
  const getRemittanceAnalytics = async (params = {}) => {
    const res = await api.get("/remittances/analytics", { params });
    return res.data;
  };

  return {
    getRemittances,
    getSingleRemittance,
    updateRemittance,
    deleteRemittance,
    verifyRemittance,
    rejectRemittance,
    getRemittanceAnalytics,
  };
};

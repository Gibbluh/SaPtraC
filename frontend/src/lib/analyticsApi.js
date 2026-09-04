import api from "./axios";
import useAuth from "./useAuth";
import { useMemo } from "react";

// Analytics API integration layer
export const useAnalyticsApi = () => {
  useAuth(); // Ensures auth context is available

  // Memoize functions so their references are stable across renders
  return useMemo(() => {
    // helper to perform GET with optional signal
    const get = async (url, params = {}, options = {}) => {
      const { signal } = options;
      const res = await api.get(url, { params, signal });
      return res.data;
    };

    // Get dashboard summary (high-level KPIs)
    const getDashboardSummary = async (params = {}, options = {}) => {
    return get("/analytics/dashboard", params, options);
   };
    // Get revenue analytics (charts, trends, breakdowns)
    const getRevenueAnalytics = async (params = {}, options = {}) => {
      return get("/analytics/revenue", params, options);
    };

    // Get fuel analytics (usage, anomalies, trends)
    const getFuelAnalytics = async (params = {}, options = {}) => {
      return get("/analytics/fuel", params, options);
    };

    // Get maintenance analytics (costs, frequency, status)
    const getMaintenanceAnalytics = async (params = {}, options = {}) => {
      return get("/analytics/maintenance", params, options);
    };

    // Get driver performance analytics (scores, incidents, trends)
    const getDriverPerformanceAnalytics = async (params = {}, options = {}) => {
  return get("/analytics/drivers", params, options);
  };

    // Get remittance analytics (totals, trends, breakdowns)
    const getRemittanceAnalytics = async (params = {}, options = {}) => {
  return get("/analytics/remittances", params, options);
  };
    
    // Get unit availability analytics (status, utilization)
    const getUnitAvailabilityAnalytics = async (params = {}, options = {}) => {
  return get("/analytics/units", params, options);
  };

    return {
      getDashboardSummary,
      getRevenueAnalytics,
      getFuelAnalytics,
      getMaintenanceAnalytics,
      getDriverPerformanceAnalytics,
      getRemittanceAnalytics,
      getUnitAvailabilityAnalytics,
    };
  }, []);
};

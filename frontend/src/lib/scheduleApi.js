import api from "./axios";
import useAuth from "./useAuth";

// Schedule API integration layer
export const useScheduleApi = () => {
  useAuth();

  // Get all schedules (with optional query params)
  const getSchedules = async (params = {}) => {
    const res = await api.get("/schedules", { params });
    return res.data;
  };

  // Get a single schedule by ID
  const getSingleSchedule = async (scheduleId) => {
    const res = await api.get(`/schedules/${scheduleId}`);
    return res.data;
  };

  // Create a new schedule
  const createSchedule = async (scheduleData) => {
    const res = await api.post("/schedules", scheduleData);
    return res.data;
  };

  // Update an existing schedule
  const updateSchedule = async (scheduleId, scheduleData) => {
    const res = await api.put(`/schedules/${scheduleId}`, scheduleData);
    return res.data;
  };

  // Delete a schedule (soft delete)
  const deleteSchedule = async (scheduleId) => {
    const res = await api.delete(`/schedules/${scheduleId}`);
    return res.data;
  };

  // Validate schedule conflict (for drag-and-drop)
  const validateScheduleConflict = async ({ scheduleId, shiftDate, shiftStart, shiftEnd }) => {
    // Backend should expose an endpoint for conflict validation
    const res = await api.post(`/schedules/${scheduleId}/validate-conflict`, {
      shiftDate,
      shiftStart,
      shiftEnd,
    });
    return res.data; // { valid: true } or { valid: false, message: "..." }
  };

  return {
    getSchedules,
    getSingleSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    validateScheduleConflict,
  };
};
export default useScheduleApi;
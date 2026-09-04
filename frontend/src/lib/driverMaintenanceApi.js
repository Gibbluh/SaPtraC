import api from "./axios";

export const useDriverMaintenanceApi = () => {

  const reportIssue = async (issueData) => {
    const res = await api.post(
      "/maintenance/driver-report",
      issueData
    );

    return res.data;
  };

  const getMyReports = async () => {
    const res = await api.get("/maintenance/my-reports");
    return res.data;
  };

  return {
    reportIssue,
    getMyReports,
  };
};
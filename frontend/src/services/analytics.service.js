import api from "../lib/axios";

export const getDashboardSummary = async () => {
    const res = await api.get("/analytics/dashboard");
    return res.data;
};

export const getRevenueAnalytics = async () => {
    const res = await api.get("/analytics/revenue");
    return res.data;
};

export const getExecutiveSummary = async () => {
    const res =
        await api.get("/analytics/executive");
    return res.data;
};
import { useEffect, useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PropTypes from "prop-types";
import { useAnalyticsApi } from "../../lib/analyticsApi";
import { getSocket } from "../../lib/socket";

const COLORS = ["#2563eb", "#10b981", "#f59e42", "#a21caf", "#fbbf24", "#6366f1", "#14b8a6"];

// Loader
const Loader = () => (
  <div className="flex justify-center items-center h-40">
    <span className="loading loading-spinner loading-lg text-blue-600"></span>
  </div>
);

// Card Wrapper
const Card = ({ title, children }) => (
  <div className="bg-white rounded shadow p-4 mb-6 w-full">
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    {children}
  </div>
);

Card.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

// Reusable Line Chart
const TrendLineChart = ({ data, xKey, yKey, label, color }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey={yKey} stroke={color || COLORS[0]} name={label} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

TrendLineChart.propTypes = {
  data: PropTypes.array.isRequired,
  xKey: PropTypes.string.isRequired,
  yKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  color: PropTypes.string,
};

/**
 * RevenueChart
 * @param {Object} props
 * @param {Object} props.filters - { startDate, endDate, month, year }
 */
const RevenueChart = ({ filters }) => {
  const { getRevenueAnalytics } = useAnalyticsApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const controllerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // cancel previous
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const controller = new AbortController();
    controllerRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
      const data = await getRevenueAnalytics(
      filters,
      { signal: controller.signal }
      );
      console.log("Revenue Analytics:", data);
      if (!controller.signal.aborted)
      setAnalytics(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err?.response?.data?.message || err?.message || "Failed to load revenue analytics");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [filters, getRevenueAnalytics]);

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();
    function handleRealtimeUpdate(data) {
      setAnalytics((prev) => ({ ...(prev || {}), ...data }));
    }
    socket.on("revenueAnalyticsUpdate", handleRealtimeUpdate);
    return () => {
      socket.off("revenueAnalyticsUpdate", handleRealtimeUpdate);
    };
  }, []);

  // Memoize chart data
  const daily = useMemo(() => analytics?.dailyRevenue || [], [analytics]);
  const weekly = useMemo(() => analytics?.weeklyRevenue || [], [analytics]);
  const monthly = useMemo(() => analytics?.monthlyRevenue || [], [analytics]);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!analytics) return <div className="text-gray-500 text-center py-8">No revenue data available.</div>;

  return (
    <div className="flex flex-col gap-8">
      <Card title="Daily Revenue Trend">
        <TrendLineChart
          data={daily}
          xKey="date"
          yKey="revenue"
          label="Revenue"
          color={COLORS[0]}
        />
      </Card>
      <Card title="Weekly Revenue Trend">
        <TrendLineChart
          data={weekly}
          xKey="week"
          yKey="revenue"
          label="Revenue"
          color={COLORS[1]}
        />
      </Card>
      <Card title="Monthly Revenue Trend">
        <TrendLineChart
          data={monthly}
          xKey="month"
          yKey="revenue"
          label="Revenue"
          color={COLORS[2]}
        />
      </Card>
    </div>
  );
};

RevenueChart.propTypes = {
  filters: PropTypes.object,
};

export default RevenueChart;

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import PropTypes from "prop-types";
import { useFuelApi } from "../../lib/fuelApi";
import { getSocket } from "../../lib/socket";

const COLORS = ["#2563eb", "#10b981", "#f59e42", "#a21caf", "#fbbf24", "#6366f1", "#14b8a6", "#ef4444"];

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

// Reusable Bar Chart
const SimpleBarChart = ({ data, xKey, yKey, label, color }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey={yKey} fill={color || COLORS[1]} name={label} />
    </BarChart>
  </ResponsiveContainer>
);

SimpleBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  xKey: PropTypes.string.isRequired,
  yKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  color: PropTypes.string,
};

// Reusable Pie Chart
const SimplePieChart = ({ data, dataKey, nameKey }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        dataKey={dataKey}
        nameKey={nameKey}
        cx="50%"
        cy="50%"
        outerRadius={100}
        fill={COLORS[2]}
        label
      >
        {data.map((entry, idx) => (
          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

SimplePieChart.propTypes = {
  data: PropTypes.array.isRequired,
  dataKey: PropTypes.string.isRequired,
  nameKey: PropTypes.string.isRequired,
};

/**
 * FuelAnalyticsChart
 * @param {Object} props
 * @param {Object} props.filters - { startDate, endDate, month, year }
 */
const FuelAnalyticsChart = ({ filters }) => {
  const { getFuelAnalytics } = useFuelApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) setLoading(true);
      if (mounted) setError("");
      try {
        const data = await getFuelAnalytics(filters);
        if (mounted) setAnalytics(data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "Failed to load fuel analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filters, getFuelAnalytics]);

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();
    function handleRealtimeUpdate(data) {
      setAnalytics((prev) => ({ ...prev, ...data }));
    }
    socket.on("fuelAnalyticsUpdate", handleRealtimeUpdate);
    return () => {
      socket.off("fuelAnalyticsUpdate", handleRealtimeUpdate);
    };
  }, []);

  // Memoize chart data
  const daily = useMemo(() => analytics?.dailyUsage || [], [analytics]);
  const costTrends = useMemo(() => analytics?.dailyUsage?.map(d => ({ date: d.date, totalCost: d.totalCost })) || [], [analytics]);
  const anomalies = useMemo(() => analytics?.anomalies || [], [analytics]);
  const topUnits = useMemo(() => analytics?.unitConsumption || [], [analytics]);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!analytics) return <div className="text-gray-500 text-center py-8">No fuel analytics data available.</div>;

  return (
    <div className="flex flex-col gap-8">
      <Card title="Fuel Consumption Trends">
        <TrendLineChart
          data={daily}
          xKey="date"
          yKey="totalLiters"
          label="Liters Consumed"
          color={COLORS[0]}
        />
      </Card>
      <Card title="Fuel Cost Trends">
        <TrendLineChart
          data={costTrends}
          xKey="date"
          yKey="totalCost"
          label="Total Cost"
          color={COLORS[1]}
        />
      </Card>
      <Card title="Fuel Anomalies">
        <SimpleBarChart
          data={anomalies}
          xKey="reason"
          yKey="count"
          label="Anomaly Count"
          color={COLORS[3]}
        />
      </Card>
      <Card title="Top Fuel-Consuming Units">
        <SimplePieChart
          data={topUnits}
          dataKey="totalLiters"
          nameKey="unit"
        />
      </Card>
    </div>
  );
};

FuelAnalyticsChart.propTypes = {
  filters: PropTypes.object,
};

export default FuelAnalyticsChart;

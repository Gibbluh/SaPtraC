import { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
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
import { useAnalyticsApi } from "../../lib/analyticsApi";
import { getSocket } from "../../lib/socket";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e42",
  "#a21caf",
  "#fbbf24",
  "#6366f1",
  "#14b8a6",
  "#ef4444"
];

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
 * MaintenanceChart
 * @param {Object} props
 * @param {Object} props.filters - { startDate, endDate, month, year }
 */
const MaintenanceChart = ({ filters }) => {
  const { getMaintenanceAnalytics } = useAnalyticsApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) setLoading(true);
      if (mounted) setError("");
      try {
        const data = await getMaintenanceAnalytics(filters);
        if (mounted) setAnalytics(data);
      } catch {
        if (mounted) setError("Failed to load maintenance analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [filters, getMaintenanceAnalytics]);

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();
    function handleRealtimeUpdate(data) {
      setAnalytics((prev) => ({ ...prev, ...data }));
    }
    socket.on("maintenanceAnalyticsUpdate", handleRealtimeUpdate);
    return () => {
      socket.off("maintenanceAnalyticsUpdate", handleRealtimeUpdate);
    };
  }, []);

  // Memoize chart data
  const frequencyData = useMemo(() => analytics?.frequency || [], [analytics]);
  const recurringData = useMemo(() => analytics?.recurringIssues || [], [analytics]);
  const completionTrends = useMemo(() => analytics?.completionTrends || [], [analytics]);
  const statusDistribution = useMemo(() => analytics?.statusDistribution || [], [analytics]);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Maintenance Frequency (by Month)">
        <SimpleBarChart
          data={frequencyData}
          xKey="month"
          yKey="count"
          label="Incidents"
        />
      </Card>
      <Card title="Recurring Issues">
        <SimplePieChart
          data={recurringData}
          dataKey="count"
          nameKey="issueCategory"
        />
      </Card>
      <Card title="Repair Completion Trends">
        <TrendLineChart
          data={completionTrends}
          xKey="date"
          yKey="completed"
          label="Completed Repairs"
        />
      </Card>
      <Card title="Maintenance Status Distribution">
        <SimplePieChart
          data={statusDistribution}
          dataKey="count"
          nameKey="status"
        />
      </Card>
    </div>
  );
};

MaintenanceChart.propTypes = {
  filters: PropTypes.object,
};

export default MaintenanceChart;

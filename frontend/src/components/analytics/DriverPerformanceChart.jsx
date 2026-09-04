import { useEffect, useState } from "react";
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
      <Bar dataKey={yKey} fill={color || COLORS[0]} name={label} />
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

const DriverPerformanceChart = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const { getDriverPerformanceAnalytics } = useAnalyticsApi();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDriverPerformanceAnalytics();
        setAnalytics(data);
      } catch {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getDriverPerformanceAnalytics]);

  if (loading) return <Loader />;
  if (!analytics) return <div className="text-red-500">Failed to load analytics.</div>;

  // Example data structure assumptions (adjust as needed):
  // analytics.topDrivers = [{ name, totalTrips, remittance, fuelEfficiency }]
  // analytics.remittanceTrends = [{ date, remittance }]
  // analytics.fuelEfficiencyTrends = [{ date, efficiency }]
  // analytics.attendance = [{ name, attendanceRate }]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Top Drivers (by Trips)">
        <SimpleBarChart
          data={analytics.topDrivers || []}
          xKey="name"
          yKey="totalTrips"
          label="Trips"
        />
      </Card>
      <Card title="Remittance Performance (Trend)">
        <TrendLineChart
          data={analytics.remittanceTrends || []}
          xKey="date"
          yKey="remittance"
          label="Remittance"
          color={COLORS[1]}
        />
      </Card>
      <Card title="Fuel Efficiency (Trend)">
        <TrendLineChart
          data={analytics.fuelEfficiencyTrends || []}
          xKey="date"
          yKey="efficiency"
          label="Fuel Efficiency"
          color={COLORS[2]}
        />
      </Card>
      <Card title="Attendance / Schedule Performance">
        <SimpleBarChart
          data={analytics.attendance || []}
          xKey="name"
          yKey="attendanceRate"
          label="Attendance Rate"
          color={COLORS[3]}
        />
      </Card>
    </div>
  );
};

export default DriverPerformanceChart;

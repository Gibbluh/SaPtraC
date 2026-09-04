import { useEffect, useState } from "react";
import { useFuelApi } from "../../lib/fuelApi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import FuelAlertNotification from "../../components/fuel/FuelAlertNotification";
import useAuth from "../../lib/useAuth";

const COLORS = ["#2563eb", "#f59e42", "#10b981", "#ef4444", "#a21caf", "#fbbf24", "#6366f1", "#14b8a6"];

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

// Line Chart Component
const TrendLineChart = ({ data, xKey, yKey, label, color }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey={yKey} stroke={color || COLORS[0]} name={label} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

// Bar Chart Component
const SimpleBarChart = ({ data, xKey, yKey, label, color }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Bar dataKey={yKey} fill={color || COLORS[1]} name={label} />
    </BarChart>
  </ResponsiveContainer>
);

// Pie Chart Component
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

const FuelAnalyticsPage = () => {
  const { getFuelAnalytics } = useFuelApi();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getFuelAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [getFuelAnalytics]);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!analytics) return <div className="text-gray-500 text-center py-8">No analytics data available.</div>;

  // Example data shape expectations:
  // analytics.dailyUsage = [{ date: '2024-06-01', totalLiters: 100, totalCost: 5000 }, ...]
  // analytics.unitConsumption = [{ unit: 'ABC123', totalLiters: 200 }, ...]
  // analytics.driverConsumption = [{ driver: 'John Doe', totalLiters: 150 }, ...]
  // analytics.anomalies = [{ reason: 'Excessive Fuel', count: 3 }, ...]

  return (
    <div className="container mx-auto px-4 py-8">
      <FuelAlertNotification user={user} role={user?.role} />
      <h1 className="text-2xl font-bold mb-6">Fuel Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Fuel Usage Trends">
          <TrendLineChart
            data={analytics.dailyUsage || []}
            xKey="date"
            yKey="totalLiters"
            label="Liters"
            color={COLORS[0]}
          />
        </Card>
        <Card title="Fuel Cost Trends">
          <TrendLineChart
            data={analytics.dailyUsage || []}
            xKey="date"
            yKey="totalCost"
            label="Cost"
            color={COLORS[1]}
          />
        </Card>
        <Card title="Unit Fuel Consumption (Top 5)">
          <SimpleBarChart
            data={analytics.unitConsumption || []}
            xKey="unit"
            yKey="totalLiters"
            label="Liters"
            color={COLORS[2]}
          />
        </Card>
        <Card title="Driver Fuel Consumption (Top 5)">
          <SimpleBarChart
            data={analytics.driverConsumption || []}
            xKey="driver"
            yKey="totalLiters"
            label="Liters"
            color={COLORS[3]}
          />
        </Card>
        <Card title="Anomaly Breakdown">
          <SimplePieChart
            data={analytics.anomalies || []}
            dataKey="count"
            nameKey="reason"
          />
        </Card>
      </div>
    </div>
  );
};

export default FuelAnalyticsPage;

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import { useRemittanceApi } from "../../lib/remittanceApi";

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
const BarChartComponent = ({ data, xKey, yKey, label, color }) => (
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

// Pie Chart Component
const PieChartComponent = ({ data, dataKey, nameKey }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Tooltip />
      <Legend />
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
    </PieChart>
  </ResponsiveContainer>
);

const RemittanceAnalyticsPage = () => {
  const { getRemittanceAnalytics } = useRemittanceApi();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getRemittanceAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [getRemittanceAnalytics]);

  if (loading) return <Loader />;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!analytics) return null;

  // Destructure analytics data (adjust keys as per backend response)
  const {
    dailyRemittanceTotals = [],
    cooperativeIncomeTrends = [],
    topEarningDrivers = [],
    topEarningUnits = [],
    negativeBalanceStats = [],
  } = analytics;

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Remittance Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Remittance Trends (Last 30 Days)">
          <TrendLineChart
            data={dailyRemittanceTotals}
            xKey="date"
            yKey="totalRemittance"
            label="Total Remittance"
            color={COLORS[0]}
          />
        </Card>
        <Card title="Cooperative Income Trends (Last 30 Days)">
          <TrendLineChart
            data={cooperativeIncomeTrends}
            xKey="date"
            yKey="cooperativeIncome"
            label="Cooperative Income"
            color={COLORS[1]}
          />
        </Card>
        <Card title="Top Earning Drivers (Last 30 Days)">
          <BarChartComponent
            data={topEarningDrivers}
            xKey="driverName"
            yKey="cooperativeIncome"
            label="Cooperative Income"
            color={COLORS[2]}
          />
        </Card>
        <Card title="Top Earning Units (Last 30 Days)">
          <BarChartComponent
            data={topEarningUnits}
            xKey="unitPlate"
            yKey="cooperativeIncome"
            label="Cooperative Income"
            color={COLORS[3]}
          />
        </Card>
        <Card title="Negative Balance Distribution (Last 30 Days)">
          <PieChartComponent
            data={negativeBalanceStats}
            dataKey="count"
            nameKey="category"
          />
        </Card>
      </div>
    </div>
  );
};

export default RemittanceAnalyticsPage;

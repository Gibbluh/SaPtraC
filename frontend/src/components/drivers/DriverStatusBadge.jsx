const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-yellow-100 text-yellow-800",
};

const DriverStatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${
      statusColors[status] || "bg-slate-200 text-black"
    }`}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

export default DriverStatusBadge;

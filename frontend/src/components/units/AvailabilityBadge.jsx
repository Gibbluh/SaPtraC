

const statusColors = {
  "Available": "bg-green-100 text-green-800 border-green-400",
  "On Route": "bg-blue-100 text-blue-800 border-blue-400",
  "Under Maintenance": "bg-yellow-100 text-yellow-800 border-yellow-400",
  "Inactive": "bg-gray-100 text-gray-800 border-gray-400",
};

const AvailabilityBadge = ({ status }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[status] || "bg-gray-100 text-gray-800 border-gray-400"}`}>
      {status}
    </span>
  );
};

export default AvailabilityBadge;

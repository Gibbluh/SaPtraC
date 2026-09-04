

const statusColors = {
  "Good": "bg-green-100 text-green-800 border-green-400",
  "Needs Maintenance": "bg-yellow-100 text-yellow-800 border-yellow-400",
  "Under Repair": "bg-red-100 text-red-800 border-red-400",
};

const MaintenanceBadge = ({ status }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[status] || "bg-gray-100 text-gray-800 border-gray-400"}`}>
      {status}
    </span>
  );
};

export default MaintenanceBadge;

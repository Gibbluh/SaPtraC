import AvailabilityBadge from "./AvailabilityBadge";
import MaintenanceBadge from "./MaintenanceBadge";
import useAuth from "../../lib/useAuth";

const UnitTable = ({ units, loading, error, query, setQuery, totalPages, onEdit, onShowDetails }) => {
  const { user } = useAuth();
  const handleSearchChange = (e) => {
    setQuery(q => ({ ...q, search: e.target.value, page: 1 }));
  };
  const handleAvailabilityChange = (e) => {
    setQuery(q => ({ ...q, availabilityStatus: e.target.value, page: 1 }));
  };
  const handleMaintenanceChange = (e) => {
    setQuery(q => ({ ...q, maintenanceStatus: e.target.value, page: 1 }));
  };
  const handlePageChange = (page) => {
    setQuery(q => ({ ...q, page }));
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by plate/body number or route..."
          className="border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 flex-1"
          value={query.search}
          onChange={handleSearchChange}
        />
        <select 
          className="border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 min-w-[150px]" 
          value={query.availabilityStatus} 
          onChange={handleAvailabilityChange}
        >
          <option value="">All Availability</option>
          <option value="Available">Available</option>
          <option value="On Route">On Route</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select 
          className="border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 min-w-[150px]" 
          value={query.maintenanceStatus} 
          onChange={handleMaintenanceChange}
        >
          <option value="">All Maintenance</option>
          <option value="Good">Good</option>
          <option value="Needs Maintenance">Needs Maintenance</option>
          <option value="Under Repair">Under Repair</option>
        </select>
      </div>
      {loading ? (
        <div className="animate-pulse space-y-3.5 p-1">
          <div className="h-9 bg-slate-100 rounded"></div>
          <div className="h-9 bg-slate-100 rounded"></div>
          <div className="h-9 bg-slate-100 rounded"></div>
          <div className="h-9 bg-slate-100 rounded"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl p-5 text-center text-xs font-semibold shadow-sm">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="min-w-full table-auto border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/60">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plate #</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Body #</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Route</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Capacity</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Availability</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maintenance</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">QR Code</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Units Found</h3>
                      <p className="text-[11px] text-slate-400 mt-1">There are no transport units registered matching the criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : units.map(unit => (
                <tr 
                  key={unit._id} 
                  className="border-b border-slate-100 hover:bg-slate-50/55 transition-colors duration-150 odd:bg-white even:bg-slate-50/20"
                >
                  <td className="px-5 py-3 text-xs font-semibold text-slate-800">{unit.plateNumber}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-800">{unit.bodyNumber}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{unit.route}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{unit.unitType}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{unit.capacity}</td>
                  <td className="px-5 py-3 text-xs"><AvailabilityBadge status={unit.availabilityStatus} /></td>
                  <td className="px-5 py-3 text-xs"><MaintenanceBadge status={unit.maintenanceStatus} /></td>
                  <td className="px-5 py-3 text-xs">
                    {unit.qrCode ? (
                      <img src={unit.qrCode} alt="QR" className="w-8 h-8 rounded border border-slate-200/60 shadow-xs" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium italic">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-right whitespace-nowrap">
                    <button 
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-md border border-slate-200/60 shadow-xs transition-all duration-150 mr-2 active:scale-95" 
                      onClick={() => onShowDetails(unit)}
                    >
                      Details
                    </button>
                    {user?.role !== "Operational Manager" && (
                      <button 
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 text-xs font-semibold rounded-md border border-blue-200/60 shadow-xs transition-all duration-150 active:scale-95" 
                        onClick={() => onEdit(unit)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination */}
      <div className="flex justify-center items-center gap-1 mt-6">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`px-3 py-1 text-xs font-semibold border rounded-lg transition-all duration-150 shadow-xs active:scale-95 ${
              query.page === i + 1
                ? "bg-blue-600 border-blue-600 text-white font-bold"
                : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
            onClick={() => handlePageChange(i + 1)}
            disabled={query.page === i + 1}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UnitTable;

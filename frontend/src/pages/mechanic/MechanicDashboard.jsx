import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useMaintenanceApi } from "../../lib/maintenanceApi";
import { useAuth } from "../../lib/useAuth";
import axios from "axios";
import MaintenanceTimeline from "../../components/maintenance/MaintenanceTimeline";
import MaintenanceDetailsModal from "../../components/maintenance/MaintenanceDetailsModal";
import React from "react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const STATUS_COLORS = {
  "Pending": "bg-yellow-100 text-yellow-800 border-yellow-400",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-400",
  "Completed": "bg-green-100 text-green-800 border-green-400",
  "Critical": "bg-red-100 text-red-800 border-red-400",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded text-xs font-semibold border ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-400"}`}>
    {status}
  </span>
);

const MechanicDashboard = () => {
  const { user } = useAuth();
  const { getMaintenance, updateMaintenance } = useMaintenanceApi();
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({}); // { [id]: percent }
  const [timelineData, setTimelineData] = useState({}); // { [id]: { loading, error, history } }
  const socketRef = useRef(null);

  // Fetch assigned maintenance
  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    getMaintenance({
  assignedMechanic: user._id,
})
  .then((res) => {
    setMaintenanceList(
      res.maintenances || []
    );
  })
      .catch(() => setError("Failed to load maintenance records."))
      .finally(() => setLoading(false));
  }, [user, getMaintenance]);

  // Real-time updates
  useEffect(() => {
    if (!user?._id) return;
    const socket = io(SOCKET_URL, {
      query: { userId: user._id, role: user.role },
      transports: ["websocket"],
    });
    socket.on("maintenanceUpdated", (updated) => {
      setMaintenanceList((prev) =>
        prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m))
      );
    });
    socket.on("maintenanceAssigned", (assigned) => {
      setMaintenanceList((prev) => [assigned, ...prev]);
    });
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [user]);

  // Status update handler
  const handleStatusChange = async (id, status) => {
    setProgress((p) => ({ ...p, [id]: "Saving..." }));
    try {
      await updateMaintenance(id, {maintenanceStatus: status});
      setMaintenanceList((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status } : m))
      );
    } catch {
      setError("Failed to update status.");
    } finally {
      setProgress((p) => ({ ...p, [id]: undefined }));
    }
  };

  // File upload handler
  const handleFileUpload = async (id, file) => {
    setUploading(true);
    setProgress((p) => ({ ...p, [id]: 0 }));
    const formData = new FormData();
    formData.append("repairFile", file);
    try {
      await fetch(`/api/maintenance/${id}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      setProgress((p) => ({ ...p, [id]: "Uploaded" }));
    } catch {
      setError("Failed to upload file.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress((p) => ({ ...p, [id]: undefined })), 2000);
    }
  };

  // Fetch repair history for a maintenance record
  const fetchTimeline = async (id) => {
    setTimelineData((d) => ({ ...d, [id]: { loading: true, error: "", history: [] } }));
    try {
      const res = await axios.get(`/api/repair-history/${id}`);
      setTimelineData((d) => ({ ...d, [id]: { loading: false, error: "", history: res.data || [] } }));
    } catch (err) {
      setTimelineData((d) => ({ ...d, [id]: { loading: false, error: err?.response?.data?.message || "Failed to load timeline.", history: [] } }));
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Mechanic Dashboard</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Loading assigned maintenance...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Unit</th>
                <th className="p-2">Issue</th>
                <th className="p-2">Reported</th>
                <th className="p-2">Status</th>
                <th className="p-2">Progress</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceList.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">No assigned maintenance.</td></tr>
              ) : (
                maintenanceList.map((m) => (
                  <React.Fragment key={m._id}>
<tr className="border-b hover:bg-gray-50">
  <td className="p-2">{m.unit || m.unitNumber || `Unit ${m._id?.slice(0, 6) || ""}`}</td>
  <td className="p-2">{m.issue || m.title || m.description || "—"}</td>
  <td className="p-2">{m.createdAt ? new Date(m.createdAt).toLocaleString() : "—"}</td>
  <td className="p-2">
    <StatusBadge status={m.maintenanceStatus || m.status || "Pending"} />
  </td>
  <td className="p-2">{progress[m._id] ?? ""}</td>
  <td className="p-2 flex flex-wrap gap-1">
    <button
      className="btn btn-xs btn-info"
      onClick={() => setSelectedMaintenance(m)}
    >
      Details
    </button>

    {m.maintenanceStatus !== "Completed" && (
      <button
        className="btn btn-xs btn-success"
        onClick={() => handleStatusChange(m._id, "Completed")}
      >
        Done
      </button>
    )}

    <button
      className="btn btn-xs btn-outline"
      onClick={() => fetchTimeline(m._id)}
    >
      Timeline
    </button>

    <input
      type="file"
      className="file-input file-input-xs"
      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      onChange={(e) => {
        if (e.target.files[0]) {
          handleFileUpload(m._id, e.target.files[0]);
        }
      }}
      disabled={uploading}
    />
  </td>
</tr>
                    {/* Timeline row (expandable, simple for now) */}
                    {timelineData[m._id] && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 p-2">
                          <MaintenanceTimeline
                            history={timelineData[m._id].history}
                            loading={timelineData[m._id].loading}
                            error={timelineData[m._id].error}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <MaintenanceDetailsModal
        open={!!selectedMaintenance}
        maintenance={selectedMaintenance}
        onClose={() => setSelectedMaintenance(null)}
      />
    </div>
  );
};

export default MechanicDashboard;

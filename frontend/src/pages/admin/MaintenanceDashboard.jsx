import { useEffect, useState } from "react";
import { useMaintenanceApi } from "../../lib/maintenanceApi";
import useAuth from "../../lib/useAuth";
import { AlertCircle, RefreshCw, Search, MoreVertical } from "lucide-react";
import api from "../../lib/axios";
import MaintenanceTimeline from "../../components/maintenance/MaintenanceTimeline";
import MaintenanceDetailsModal from "../../components/maintenance/MaintenanceDetailsModal";
import CreateMaintenanceModal from "../../components/maintenance/CreateMaintenanceModal";
import React from "react";
import { useUnitApi } from "../../lib/unitApi";
import { useUserApi } from "../../lib/userApi";
import { useLocation } from "react-router-dom";
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  Diagnosed: "bg-blue-50 text-blue-800 border-blue-200",
  "In Progress": "bg-blue-50 text-blue-800 border-blue-200",
  "Waiting Parts": "bg-slate-100 text-black border-slate-300",
  Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Cancelled: "bg-slate-100 text-black border-slate-300",
};

const PAGE_SIZE = 10;

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${
      STATUS_COLORS[status] ||
      "bg-slate-100 text-black border-slate-300"
    }`}
  >
    {status || "Unknown"}
  </span>
);

const RecurringBadge = ({ detected, count }) =>
  detected ? (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-bold whitespace-nowrap"
      title={`Recurring issue (${count} times)`}
    >
      <AlertCircle className="mr-1.5 size-3.5" />
      Recurring ({count})
    </span>
  ) : (
    <span className="text-sm text-black">—</span>
  );

const Loader = () => (
  <div className="flex justify-center items-center h-56">
    <span className="loading loading-spinner loading-lg text-blue-600"></span>
  </div>
);

const MaintenanceDashboard = () => {
  const location = useLocation();
  const highlightId = location.state?.highlightId;
  // effectiveHighlightId computed below

  const {
    getMaintenance,
    createMaintenance,
    updateMaintenance,
    updateMaintenanceStatus,
    assignMechanic,
  } = useMaintenanceApi();

  const { getUnits } = useUnitApi();
  const { getUsers } = useUserApi();

  const [units, setUnits] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  const { user } = useAuth();

  const isAdmin =
    user?.role === "Super Admin" ||
    user?.role === "Administrator";

  const [records, setRecords] = useState([]);
  const effectiveHighlightId = (highlightId && String(highlightId).startsWith('m') && records?.length > 0) ? records[0]._id : highlightId;
  const [loading, setLoading] = useState(true);

  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState({});
  const [timelineData, setTimelineData] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);

  const handleViewDetails = (record) => {
    setSelectedMaintenance(record);
  };

  const handleEdit = (record) => {
    setEditingMaintenance(record);
  };

  const handleUpdateMaintenance = async (formData) => {
    try {
      await updateMaintenance(
        editingMaintenance._id,
        formData
      );

      setEditingMaintenance(null);
      setRefreshing((r) => !r);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to update maintenance."
      );
    }
  };

  useEffect(() => {
    if (effectiveHighlightId && !loading && records.length > 0) {
      let attempts = 0;
      const interval = setInterval(() => {
        const el = document.getElementById(`maintenance-row-${effectiveHighlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          clearInterval(interval);
        }
        attempts++;
        if (attempts > 20) clearInterval(interval); // give up after 2 seconds
      }, 100);
      return () => clearInterval(interval);
    }
  }, [effectiveHighlightId, loading, records.length]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const unitRes = await getUnits({
          limit: 100,
        });

        setUnits(unitRes.units || []);

        const userRes = await getUsers();

        setMechanics(
          (userRes.users || []).filter(
            (u) => u.role === "Mechanic"
          )
        );
      } catch (err) {
        console.error(err);
      }
    };

    loadDropdowns();
  }, []);

  const handleCreateMaintenance = async (formData) => {
    try {
      await createMaintenance(formData);

      setOpenCreateModal(false);
      setRefreshing((r) => !r);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to create maintenance record."
      );
    }
  };

  // Fetch maintenance records
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          search,
          maintenanceStatus: status,
          page,
          limit: PAGE_SIZE,
        };

        const res = await getMaintenance(params);

        setRecords(res.maintenances || []);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load maintenance records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, page, refreshing]);

  // Mechanic assignment
  const handleAssignMechanic = async (
    maintenanceId,
    mechanicId
  ) => {
    setAssigning((a) => ({
      ...a,
      [maintenanceId]: true,
    }));

    try {
      await assignMechanic(
        maintenanceId,
        mechanicId
      );

      setRefreshing((r) => !r);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to assign mechanic."
      );
    } finally {
      setAssigning((a) => ({
        ...a,
        [maintenanceId]: false,
      }));
    }
  };

  // Status update
  const handleStatusChange = async (
    maintenanceId,
    newStatus
  ) => {
    try {
      await updateMaintenanceStatus(
        maintenanceId,
        newStatus
      );

      setRefreshing((r) => !r);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to update status."
      );
    }
  };

  // Timeline
  const fetchTimeline = async (maintenanceId) => {
    setTimelineData((d) => ({
      ...d,
      [maintenanceId]: {
        loading: true,
        error: "",
        history: [],
      },
    }));

    try {
      const res = await api.get(
        `/repair-history/${maintenanceId}`
      );

      setTimelineData((d) => ({
        ...d,
        [maintenanceId]: {
          loading: false,
          error: "",
          history: res.data || [],
        },
      }));
    } catch (err) {
      console.error("TIMELINE ERROR:", err);

      setTimelineData((d) => ({
        ...d,
        [maintenanceId]: {
          loading: false,
          error:
            err?.response?.data?.message ||
            "Failed to load timeline.",
          history: [],
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 text-black">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-end gap-5 mb-7">
        <form
          className="flex flex-wrap items-center gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setRefreshing((r) => !r);
          }}
        >
          {isAdmin && (
            <button
              type="button"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all duration-150"
              onClick={() => setOpenCreateModal(true)}
            >
              + Create Maintenance
            </button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black pointer-events-none" />

            <input
              type="text"
              placeholder="Search by unit, issue, mechanic..."
              className="border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white text-black placeholder:text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full md:w-64"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 w-full md:w-40"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Diagnosed">Diagnosed</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting Parts">Waiting Parts</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-150 shadow-sm flex items-center justify-center"
            title="Search"
          >
            <Search className="size-4" />
          </button>

          <button
            type="button"
            className="px-3 py-2.5 bg-white hover:bg-slate-100 text-black rounded-lg border border-slate-300 transition-all duration-150 shadow-sm flex items-center justify-center"
            onClick={() =>
              setRefreshing((r) => !r)
            }
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </button>
        </form>
      </div>

      {/* =====================================================
          MAIN TABLE
      ===================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <Loader />
        ) : error ? (
          <div className="text-black text-center py-12 text-base font-semibold">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wide">
                    Unit
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wide min-w-[250px]">
                    Issue
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wide">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wide min-w-[280px]">
                    Mechanic
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wide whitespace-nowrap">
                    Reported
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wide">
                    Recurrence
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wide min-w-[270px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-16 text-black"
                    >
                      <div className="text-lg font-bold">
                        No maintenance records found
                      </div>

                      <div className="text-sm text-black mt-2">
                        Try adjusting your search or status filter.
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <React.Fragment key={rec._id}>
                      <tr 
                        id={`maintenance-row-${rec._id}`}
                        className={`border-b transition-all duration-500 ${effectiveHighlightId === rec._id ? 'bg-blue-100 ring-2 ring-inset ring-blue-500 shadow-md animate-pulse' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        {/* UNIT */}
                        <td className="px-6 py-4 align-middle">
                          <span className="text-sm font-bold text-black whitespace-nowrap">
                            {rec.unit?.plateNumber ||
                              rec.unit?.name ||
                              "-"}
                          </span>
                        </td>

                        {/* ISSUE */}
                        <td className="px-6 py-4 align-middle">
                          <div className="text-sm font-semibold text-black">
                            {rec.issueCategory || "Unknown"}
                          </div>

                          <div className="text-sm text-black mt-1 max-w-[280px]">
                            {rec.issueDescription || "-"}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4 align-middle">
                          <StatusBadge
                            status={rec.maintenanceStatus}
                          />
                        </td>

                        {/* MECHANIC */}
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3 min-w-[260px]">
                            <div className="w-[125px] shrink-0">
                              {rec.assignedMechanic ? (
                                <span className="text-sm font-semibold text-black">
                                  {rec.assignedMechanic?.fullName ||
                                    "Assigned"}
                                </span>
                              ) : (
                                <span className="text-sm font-semibold text-black italic">
                                  Unassigned
                                </span>
                              )}
                            </div>

                            {isAdmin && (
                              <select
                                disabled={assigning[rec._id]}
                                value={
                                  rec.assignedMechanic?._id || ""
                                }
                                onChange={(e) =>
                                  handleAssignMechanic(
                                    rec._id,
                                    e.target.value
                                  )
                                }
                                className="w-[145px] border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-black"
                              >
                                <option value="">
                                  Unassigned
                                </option>

                                {mechanics.map((m) => (
                                  <option
                                    key={m._id}
                                    value={m._id}
                                  >
                                    {m.fullName}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>

                        {/* REPORTED */}
                        <td className="px-6 py-4 align-middle whitespace-nowrap">
                          <span className="text-sm font-medium text-black">
                            {rec.createdAt
                              ? new Date(
                                  rec.createdAt
                                ).toLocaleString()
                              : "-"}
                          </span>
                        </td>

                        {/* RECURRENCE */}
                        <td className="px-6 py-4 align-middle">
                          <RecurringBadge
                            detected={
                              rec.recurringIssueDetected
                            }
                            count={rec.recurringIssueCount}
                          />
                        </td>

                        {/* ACTIONS */}
<td className="px-6 py-4 align-middle">
  <div className="flex items-center justify-center gap-2 w-full min-w-[180px] h-9">

    {/* STATUS DROPDOWN */}
    {isAdmin && (
      <select
        className="w-[125px] h-9 shrink-0 border border-slate-300 rounded-lg px-2.5 py-2 text-sm bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        value={rec.maintenanceStatus}
        onChange={(e) =>
          handleStatusChange(
            rec._id,
            e.target.value
          )
        }
      >
        <option value="Pending">Pending</option>
        <option value="Diagnosed">Diagnosed</option>
        <option value="In Progress">In Progress</option>
        <option value="Waiting Parts">Waiting Parts</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    )}

    {/* THREE DOT MENU */}
    <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
      <button
        type="button"
        onClick={() =>
          setActiveMenu(
            activeMenu === rec._id
              ? null
              : rec._id
          )
        }
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-white text-black hover:bg-slate-100 transition-all duration-150"
        title="Actions"
      >
        <MoreVertical size={18} />
      </button>

      {activeMenu === rec._id && (
        <div
          className="absolute right-0 top-11 z-40 w-36 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* DETAILS */}
          <button
            type="button"
            onClick={() => {
              handleViewDetails(rec);
              setActiveMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-black hover:bg-slate-50 transition-colors"
          >
            Details
          </button>

          {/* EDIT */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                handleEdit(rec);
                setActiveMenu(null);
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-semibold text-black hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
          )}

          {/* TIMELINE */}
          <button
            type="button"
            onClick={() => {
              fetchTimeline(rec._id);
              setActiveMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-black hover:bg-slate-50 transition-colors"
          >
            Timeline
          </button>
        </div>
      )}
    </div>

  </div>
</td>
</tr>

                      {/* TIMELINE */}
                      {timelineData[rec._id] && (
                        <tr>
                          <td
                            colSpan={7}
                            className="bg-slate-50 p-5 border-b border-slate-200"
                          >
                            <MaintenanceTimeline
                              history={
                                timelineData[rec._id].history
                              }
                              loading={
                                timelineData[rec._id].loading
                              }
                              error={
                                timelineData[rec._id].error
                              }
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

        {/* =====================================================
            PAGINATION
        ===================================================== */}
        <div className="flex justify-between items-center px-6 py-5 border-t border-slate-200 bg-slate-50">
          <div className="text-sm font-semibold text-black">
            Page {page} of {totalPages}
          </div>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-sm font-bold border rounded-lg bg-white border-slate-300 text-black hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none"
              disabled={page === 1}
              onClick={() =>
                setPage((p) =>
                  Math.max(1, p - 1)
                )
              }
            >
              Prev
            </button>

            <button
              className="px-4 py-2 text-sm font-bold border rounded-lg bg-white border-slate-300 text-black hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none"
              disabled={page === totalPages}
              onClick={() =>
                setPage((p) =>
                  Math.min(totalPages, p + 1)
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}
      <MaintenanceDetailsModal
        open={!!selectedMaintenance}
        maintenance={selectedMaintenance}
        onClose={() =>
          setSelectedMaintenance(null)
        }
        onUpdate={handleUpdateMaintenance}
      />

      {/* =====================================================
          CREATE MODAL
      ===================================================== */}
      {isAdmin && (
        <CreateMaintenanceModal
          open={openCreateModal}
          onClose={() =>
            setOpenCreateModal(false)
          }
          onSubmit={handleCreateMaintenance}
          units={units}
          mechanics={mechanics}
        />
      )}

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}
      {isAdmin && (
        <CreateMaintenanceModal
          open={!!editingMaintenance}
          onClose={() =>
            setEditingMaintenance(null)
          }
          onSubmit={handleUpdateMaintenance}
          units={units}
          mechanics={mechanics}
          maintenance={editingMaintenance}
        />
      )}
    </div>
  );
};

export default MaintenanceDashboard;

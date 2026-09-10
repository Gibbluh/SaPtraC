import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  Search, Plus, X, Filter, ChevronDown, ChevronRight, ChevronLeft, 
  MoreVertical, Eye, Edit, Trash2, Check, 
  Users, Mail, Key, 
  AlertTriangle, AlertCircle, RefreshCw, 
  Lock, ArrowUpDown, Download, CheckCircle, ShieldCheck,
  User, Clock
} from "lucide-react";
import { useUserApi } from "../../lib/userApi";
import useAuth from "../../lib/useAuth";
import toast from 'react-hot-toast';

const ROLES = [
  'Super Admin',
  'Administrator',
  'Cashier',
  'Operational Manager',
  'Mechanic',
  'Fuel Pump Attendant'
];

const INITIAL_FORM_DATA = {
  fullName: "",
  email: "",
  password: "",
  role: "Cashier",
};

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const getRoleBadgeStyles = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'super admin':
      return {
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
        avatarBg: 'bg-purple-100 text-purple-700 border-purple-300'
      };
    case 'administrator':
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        avatarBg: 'bg-blue-100 text-blue-700 border-blue-300'
      };
    case 'cashier':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        avatarBg: 'bg-emerald-100 text-emerald-700 border-emerald-300'
      };
    case 'operational manager':
      return {
        badge: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        avatarBg: 'bg-sky-100 text-sky-700 border-sky-300'
      };
    case 'mechanic':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        avatarBg: 'bg-amber-100 text-amber-700 border-amber-300'
      };
    case 'fuel pump attendant':
      return {
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
        avatarBg: 'bg-orange-100 text-orange-700 border-orange-300'
      };
    default:
      return {
        badge: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        avatarBg: 'bg-slate-100 text-slate-700 border-slate-300'
      };
  }
};

const getStatusConfig = (status, isActive) => {
  const isArchived = String(status || '').toLowerCase() === 'archived' || isActive === false;
  if (isArchived) {
    return {
      label: 'Archived',
      bg: 'bg-slate-400',
      badge: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    };
  }
  return {
    label: 'Active',
    bg: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  };
};

const ROLE_DETAILS = {
  'Super Admin': {
    scope: 'Full System Administrative Authority',
    description: 'Master administrative access across all fleet entities, system security, and user accounts.',
    permissions: [
      'Create, edit, and deactivate system user accounts',
      'Manage global fleet configurations, franchises, and routes',
      'Access all financial, dispatch, and maintenance modules',
      'System security policies and audit logs'
    ]
  },
  'Administrator': {
    scope: 'Fleet & Personnel Management Scope',
    description: 'Manages units, driver assignments, route scheduling, and fleet compliance.',
    permissions: [
      'Fleet unit tracking and status updates',
      'Driver profile management and shift coordination',
      'Timetable adjustments and route assignment',
      'Operational and revenue monitoring summaries'
    ]
  },
  'Cashier': {
    scope: 'Role-Constrained Operational Access',
    description: 'Handles driver remittances, passenger fare collections, and daily financial receipts.',
    permissions: [
      'Record daily fare remittances by unit and driver',
      'Validate trip counts and ticket collections',
      'Generate and print daily remittance receipts',
      'Shift reconciliation and cash-on-hand reports'
    ]
  },
  'Operational Manager': {
    scope: 'Operational Dispatch & Headway Scope',
    description: 'Oversees daily dispatch operations, route analytics, and service efficiency.',
    permissions: [
      'Live route headway tracking and vehicle distribution',
      'Review dispatch histories and on-time performance',
      'Coordinate emergency reroutes and service changes',
      'Access route productivity analytics'
    ]
  },
  'Mechanic': {
    scope: 'Maintenance & Vehicle Safety Scope',
    description: 'Conducts vehicle inspections, records repairs, and manages maintenance tickets.',
    permissions: [
      'Create and update vehicle maintenance tickets',
      'Log replacement parts and labor hours',
      'Update unit health scores and availability status',
      'Conduct pre-trip and periodic safety checks'
    ]
  },
  'Fuel Pump Attendant': {
    scope: 'Fuel Dispensing & Metering Scope',
    description: 'Logs fuel dispensing transactions, pump meter readings, and fuel receipts.',
    permissions: [
      'Dispense fuel to authorized fleet units',
      'Log odometer readings, liters pumped, and pump numbers',
      'Issue and print digital fuel receipts',
      'Reconcile daily fuel dispenser meter logs'
    ]
  }
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || "US").toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const UserManagementPage = () => {
  const {
    getUsers,
    createUser,
    updateUser,
    deactivateUser,
  } = useUserApi();

  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [error, setError] = useState("");

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Users");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Sorting state (spreadsheet feature)
  const [sortField, setSortField] = useState("fullName");
  const [sortDirection, setSortDirection] = useState("asc");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [drawerTab, setDrawerTab] = useState('Overview');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [confirmArchiveData, setConfirmArchiveData] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isSuperAdmin = normalizeRole(currentUser?.role) === "super admin";
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;

  // Data fetching
  const fetchUsers = useCallback(async () => {
    setError("");

    try {
      const data = await getUsers({
        page: 1,
        limit: 1000,
      });

      const receivedUsers = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      setUsers(receivedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch users."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const normalizedSelectedRole = roleFilter === 'All Roles' ? '' : normalizeRole(roleFilter);

    const filtered = users.filter((userItem) => {
      // Status filter
      const isArchived = String(userItem?.status || '').toLowerCase() === 'archived' || userItem?.isActive === false;
      if (statusFilter === 'Active' && isArchived) return false;
      if (statusFilter === 'Archived' && !isArchived) return false;

      // Role filter
      if (normalizedSelectedRole) {
        const userRole = normalizeRole(userItem?.role);
        if (userRole !== normalizedSelectedRole) return false;
      }

      // Search query
      if (normalizedSearch) {
        const fullName = String(userItem?.fullName || "").toLowerCase();
        const email = String(userItem?.email || "").toLowerCase();
        const role = String(userItem?.role || "").toLowerCase();
        const id = String(userItem?._id || "").toLowerCase();
        if (!fullName.includes(normalizedSearch) && !email.includes(normalizedSearch) && !role.includes(normalizedSearch) && !id.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === 'status') {
        valA = a.isActive === false || String(a.status).toLowerCase() === 'archived' ? 'Archived' : 'Active';
        valB = b.isActive === false || String(b.status).toLowerCase() === 'archived' ? 'Archived' : 'Active';
      } else if (sortField === 'createdAt') {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  // Selection handlers
  const toggleSelection = (id, e) => {
    if (e) e.stopPropagation();
    const nextSet = new Set(selectedUsers);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    setSelectedUsers(nextSet);
  };

  const toggleAll = () => {
    if (selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u._id)));
    }
  };

  // CSV Spreadsheet Export Handler
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error("No users to export.");
      return;
    }

    const headers = ["User ID", "Full Name", "Email", "Role", "Status", "Date Registered"];
    const rows = filteredUsers.map(u => [
      `"${u._id || ''}"`,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.role || '').replace(/"/g, '""')}"`,
      `"${u.isActive !== false && String(u.status || '').toLowerCase() !== 'archived' ? 'Active' : 'Archived'}"`,
      `"${u.createdAt ? formatDate(u.createdAt) : '—'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sptc_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredUsers.length} users to CSV`);
  };

  // Drawer handlers
  const openUserDrawer = (user) => {
    setSelectedUserData(user);
    setDrawerTab('Overview');
    setDrawerOpen(true);
  };

  // Create / Edit modal handlers
  const openCreateModal = () => {
    if (!isSuperAdmin) {
      toast.error("Only the Super Admin can create user accounts.");
      return;
    }
    setSelectedUser(null);
    setFormData(INITIAL_FORM_DATA);
    setModalOpen(true);
  };

  const openEditModal = (userItem) => {
    if (!isSuperAdmin) {
      toast.error("Only the Super Admin can edit user accounts.");
      return;
    }
    setSelectedUser(userItem);
    setFormData({
      fullName: userItem?.fullName || "",
      email: userItem?.email || "",
      password: "",
      role: userItem?.role || "Cashier",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setSelectedUser(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const cleanName = formData.fullName.trim();
    const cleanEmail = formData.email.trim();

    if (!cleanName) {
      toast.error("Full name is required.");
      return false;
    }

    if (!cleanEmail) {
      toast.error("Email is required.");
      return false;
    }

    if (!selectedUser && !formData.password.trim()) {
      toast.error("Password is required when creating a new user.");
      return false;
    }

    if (!formData.role) {
      toast.error("Role is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSuperAdmin) {
      toast.error("Only the Super Admin can perform this action.");
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (selectedUser) {
        await updateUser(selectedUser._id, payload);
        toast.success("User updated successfully.");
        if (selectedUserData?._id === selectedUser._id) {
          setSelectedUserData(prev => ({ ...prev, ...payload }));
        }
      } else {
        await createUser(payload);
        toast.success("User created successfully.");
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error("User operation failed:", err);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Operation failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Archive flow with in-app confirmation modal
  const promptArchiveUser = (userItem) => {
    if (!isSuperAdmin) {
      toast.error("Only the Super Admin can archive users.");
      return;
    }

    if (!userItem?._id) {
      toast.error("Invalid user ID.");
      return;
    }

    if (currentUserId && String(userItem._id) === String(currentUserId)) {
      toast.error("You cannot archive your own account.");
      return;
    }

    setConfirmArchiveData(userItem);
  };

  const executeArchive = async () => {
    if (!confirmArchiveData) return;
    const userToArchive = confirmArchiveData;
    setArchivingId(userToArchive._id);

    try {
      await deactivateUser(userToArchive._id);

      setUsers(prev =>
        prev.map(u =>
          u._id === userToArchive._id
            ? { ...u, status: "Archived", isActive: false }
            : u
        )
      );

      if (selectedUserData?._id === userToArchive._id) {
        setSelectedUserData(prev => ({ ...prev, status: "Archived", isActive: false }));
      }

      toast.success(`${userToArchive.fullName || 'User'} archived successfully.`);
      setConfirmArchiveData(null);
    } catch (err) {
      console.error("Failed to archive user:", err);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to archive user."
      );
    } finally {
      setArchivingId(null);
    }
  };

  // Bulk Archive
  const handleBulkArchive = async () => {
    if (!isSuperAdmin) {
      toast.error("Only the Super Admin can archive users.");
      return;
    }

    const idsToArchive = Array.from(selectedUsers).filter(id => String(id) !== String(currentUserId));
    if (idsToArchive.length === 0) {
      toast.error("No valid users selected to archive.");
      return;
    }

    try {
      for (const id of idsToArchive) {
        await deactivateUser(id);
      }
      setUsers(prev =>
        prev.map(u =>
          idsToArchive.includes(u._id)
            ? { ...u, status: "Archived", isActive: false }
            : u
        )
      );
      toast.success(`${idsToArchive.length} users archived successfully.`);
      setSelectedUsers(new Set());
    } catch (err) {
      console.error("Bulk archive failed:", err);
      toast.error("An error occurred during bulk archive.");
      fetchUsers();
    }
  };

  // Counts
  const totalCount = users.length;
  const activeCount = users.filter(u => u.isActive !== false && String(u.status || '').toLowerCase() !== 'archived').length;
  const archivedCount = users.filter(u => u.isActive === false || String(u.status || '').toLowerCase() === 'archived').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-6 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export to CSV (Spreadsheet action) */}
          <button 
            id="export-users-csv-btn"
            onClick={handleExportCSV}
            title="Export to Spreadsheet (CSV)"
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Add User Button */}
          {isSuperAdmin ? (
            <button 
              id="add-user-btn"
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          ) : (
            <div title="Super Admin privilege required to add users" className="cursor-not-allowed">
              <button
                disabled
                className="px-4 py-2 bg-slate-200 text-slate-400 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap opacity-75 cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-6 pb-6 flex flex-col relative">
        
        {/* Filters Toolbar Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
          
          {/* Left side counter */}
          <div className="flex items-center gap-3 shrink-0 px-2 py-0.5">
            <div className="text-sm text-slate-500 font-medium">
              {filteredUsers.length > 0 ? (
                <>Showing <span className="font-semibold text-slate-700">{(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, filteredUsers.length)}</span> of <span className="font-semibold text-slate-700">{filteredUsers.length}</span> personnel</>
              ) : (
                <>0 personnel found</>
              )}
            </div>
          </div>

          {/* Right side search and filter controls (moved to the right) */}
          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 flex-wrap justify-end lg:ml-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                id="search-users-input"
                type="text" 
                placeholder="Search name, email, role, or ID..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-white text-gray-900 placeholder-gray-400 pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown Filter */}
            <div className="relative">
              <button
                id="status-dropdown-users-btn"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setRoleDropdownOpen(false);
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs"
              >
                <Filter className="w-4 h-4 text-gray-400" />
                Status: {statusFilter}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </button>
              
              {statusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)}></div>
                  <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 flex flex-col">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Filter by Status
                    </div>
                    {[
                      { label: 'All Users', count: totalCount, dot: 'bg-gray-400' },
                      { label: 'Active', count: activeCount, dot: 'bg-emerald-500' },
                      { label: 'Archived', count: archivedCount, dot: 'bg-slate-400' }
                    ].map(item => {
                      const isActive = statusFilter === item.label;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            setStatusFilter(item.label);
                            setStatusDropdownOpen(false);
                            setPage(1);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {item.label !== 'All Users' && <div className={`w-2 h-2 rounded-full ${item.dot}`}></div>}
                            <span>{item.label}</span>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{item.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Role Dropdown Filter */}
            <div className="relative">
              <button
                id="role-dropdown-users-btn"
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                Role: {roleFilter}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </button>
              
              {roleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)}></div>
                  <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 flex flex-col max-h-80 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Filter by Role
                    </div>
                    <button
                      onClick={() => {
                        setRoleFilter('All Roles');
                        setRoleDropdownOpen(false);
                        setPage(1);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${
                        roleFilter === 'All Roles' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>All Roles</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{users.length}</span>
                    </button>
                    {ROLES.map(roleName => {
                      const count = users.filter(u => normalizeRole(u.role) === normalizeRole(roleName)).length;
                      const isActive = roleFilter === roleName;
                      const badgeStyle = getRoleBadgeStyles(roleName);
                      return (
                        <button
                          key={roleName}
                          onClick={() => {
                            setRoleFilter(roleName);
                            setRoleDropdownOpen(false);
                            setPage(1);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${badgeStyle.dot}`}></div>
                            <span className="truncate">{roleName}</span>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchUsers}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* SPREADSHEET / TABLE CONTAINER (matching Drivers section) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <h3 className="text-base font-semibold text-slate-900">Loading user spreadsheet...</h3>
              <p className="text-xs text-slate-500 mt-1">Retrieving system accounts and role permissions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    {/* Checkbox Column */}
                    <th className="px-4 py-3 w-10 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <div 
                          role="checkbox"
                          aria-checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                          onClick={toggleAll}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-gray-300 hover:border-gray-400 shadow-xs'
                          }`}
                        >
                          {selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0 && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                      </div>
                    </th>

                    {/* User Column (Sortable) */}
                    <th 
                      onClick={() => handleSort('fullName')}
                      className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>User</span> 
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'fullName' ? 'text-blue-600' : 'text-slate-400'}`}/>
                      </div>
                    </th>

                    {/* Email / Contact Info */}
                    <th 
                      onClick={() => handleSort('email')}
                      className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Contact Info</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'email' ? 'text-blue-600' : 'text-slate-400'}`}/>
                      </div>
                    </th>

                    {/* System Role (Sortable) */}
                    <th 
                      onClick={() => handleSort('role')}
                      className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>System Role</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'role' ? 'text-blue-600' : 'text-slate-400'}`}/>
                      </div>
                    </th>

                    {/* Status (Sortable) */}
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'status' ? 'text-blue-600' : 'text-slate-400'}`}/>
                      </div>
                    </th>

                    {/* Date Registered (Sortable) */}
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date Joined</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'createdAt' ? 'text-blue-600' : 'text-slate-400'}`}/>
                      </div>
                    </th>

                    {/* Action Column */}
                    <th className="px-4 py-3 w-12 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((userItem) => {
                    const statusCfg = getStatusConfig(userItem.status, userItem.isActive);
                    const roleStyle = getRoleBadgeStyles(userItem.role);
                    const isSelected = selectedUsers.has(userItem._id);
                    const isCurrentAccount = currentUserId && String(userItem._id) === String(currentUserId);
                    const initials = getInitials(userItem.fullName || userItem.email);

                    return (
                      <tr 
                        key={userItem._id}
                        className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                        onClick={(e) => {
                          if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                            openUserDrawer(userItem);
                          }
                        }}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3.5 text-center align-middle" onClick={(e) => toggleSelection(userItem._id, e)}>
                          <div className="flex items-center justify-center">
                            <div 
                              role="checkbox"
                              aria-checked={isSelected}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-gray-300 hover:border-gray-400 shadow-xs'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </td>

                        {/* User Profile info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border border-slate-200 shadow-xs ${roleStyle.avatarBg}`}>
                                {initials}
                              </div>
                              {/* Online indicator */}
                              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusCfg.dot}`}></span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900">{userItem.fullName || "Unnamed User"}</span>
                                {isCurrentAccount && (
                                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {userItem._id ? userItem._id.slice(-8).toUpperCase() : ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email / Contact */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-700 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{userItem.email || "—"}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${roleStyle.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${roleStyle.dot}`}></span>
                            {userItem.role || "Cashier"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusCfg.dot}`}></span>
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Date Joined */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-700">{formatDate(userItem.createdAt)}</div>
                        </td>

                        {/* Row Actions Menu */}
                        <td className="px-4 py-3 text-right relative">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === userItem._id ? null : userItem._id);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === userItem._id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}></div>
                              <div className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1 text-left" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => { setActiveDropdown(null); openUserDrawer(userItem); }} 
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4 text-slate-400" /> View Profile
                                </button>
                                
                                {isSuperAdmin && (
                                  <button 
                                    onClick={() => { setActiveDropdown(null); openEditModal(userItem); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4 text-slate-400" /> Edit Details
                                  </button>
                                )}

                                {isSuperAdmin && !isCurrentAccount && userItem.isActive !== false && String(userItem.status || '').toLowerCase() !== 'archived' && (
                                  <>
                                    <div className="h-px bg-slate-200 my-1"></div>
                                    <button 
                                      onClick={() => { setActiveDropdown(null); promptArchiveUser(userItem); }} 
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" /> Archive Account
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-500">
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 text-slate-300 mb-3" />
                          <p className="text-lg font-medium text-slate-900">No users found</p>
                          <p className="text-sm text-slate-500 max-w-sm mt-1">
                            {searchQuery || statusFilter !== 'All Users' || roleFilter !== 'All Roles'
                              ? "Try adjusting your filters or search query."
                              : "No staff accounts are registered in the system yet."}
                          </p>
                          {isSuperAdmin && (!searchQuery && statusFilter === 'All Users' && roleFilter === 'All Roles') && (
                            <button
                              onClick={openCreateModal}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> Add User
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SPREADSHEET PAGINATION (matching Drivers section) */}
          <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page:</span>
              <select 
                value={rowsPerPage} 
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-slate-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-slate-400 ml-2">
                Total: {filteredUsers.length} personnel
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-medium text-slate-700">Page {safePage} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* BULK ACTION BAR (when rows are selected) */}
        {selectedUsers.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            <span className="text-sm font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </span>
            <div className="h-4 w-px bg-slate-700"></div>
            {isSuperAdmin && (
              <button
                onClick={handleBulkArchive}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" /> Archive Selected
              </button>
            )}
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </main>

      {/* USER DETAIL DRAWER (matching design with dark teal header and 3-card overview) */}
      {drawerOpen && selectedUserData && (() => {
        const isArchived = selectedUserData?.isActive === false || String(selectedUserData?.status || '').toLowerCase() === 'archived';
        const roleKey = Object.keys(ROLE_DETAILS).find(
          r => r.toLowerCase() === (selectedUserData?.role || '').toLowerCase()
        ) || selectedUserData?.role || 'Cashier';
        const roleInfo = ROLE_DETAILS[roleKey] || ROLE_DETAILS['Cashier'];

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setDrawerOpen(false)}></div>
            <div className="relative w-full max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 text-left">
              {/* Drawer Header Banner (Dark teal gradient matching design) */}
              <div className="bg-gradient-to-b from-[#183a34] via-[#16322e] to-[#0f2224] p-6 sm:p-7 text-white relative shrink-0">
                {/* Top row: Badges + Circular Close Button */}
                <div className="flex items-center justify-between gap-3 mb-8 sm:mb-10">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      isArchived 
                        ? 'bg-white/20 text-white border border-white/10' 
                        : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                    }`}>
                      {isArchived ? 'ARCHIVED' : 'ACTIVE'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-black/40 text-white/90 border border-white/10">
                      {selectedUserData.role ? selectedUserData.role.toUpperCase() : 'CASHIER'}
                    </span>
                  </div>

                  <button 
                    id="close-drawer-top-btn"
                    onClick={() => setDrawerOpen(false)} 
                    className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white/80 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                    title="Close panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Identity info & Edit button */}
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5 leading-tight">
                      {selectedUserData.fullName || "Unnamed User"}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-white/80">
                      <Mail className="w-3.5 h-3.5 text-white/70 shrink-0" />
                      <span>{selectedUserData.email || "—"}</span>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <button
                      id="drawer-header-edit-btn"
                      onClick={() => {
                        setDrawerOpen(false);
                        openEditModal(selectedUserData);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs shrink-0 mb-0.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs Bar */}
              <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-8 text-sm shrink-0">
                {['Overview', 'Permissions & Access', 'Account Security'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`py-3.5 px-0.5 text-sm font-semibold tracking-tight transition-colors border-b-2 whitespace-nowrap ${
                      drawerTab === tab 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Drawer Body Content */}
              <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6 space-y-4">
                {drawerTab === 'Overview' && (
                  <>
                    {/* Top Row: Personnel Info & Account Timeline cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* PERSONNEL INFORMATION */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>PERSONNEL INFORMATION</span>
                        </div>
                        <div className="space-y-3.5">
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">Full Name</span>
                            <span className="block text-sm font-bold text-slate-900">{selectedUserData.fullName || "—"}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">Email Address</span>
                            <span className="block text-sm text-slate-800 break-all">{selectedUserData.email || "—"}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">System Role</span>
                            <span className="block text-sm font-semibold text-slate-900">{selectedUserData.role || "Cashier"}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">Account ID</span>
                            <span className="block text-xs font-mono text-slate-600 break-all">{selectedUserData._id || "—"}</span>
                          </div>
                        </div>
                      </div>

                      {/* ACCOUNT TIMELINE */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>ACCOUNT TIMELINE</span>
                        </div>
                        <div className="space-y-3.5">
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">Account Status</span>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                              <span className={`w-2 h-2 rounded-full ${isArchived ? 'bg-slate-500' : 'bg-emerald-500'}`}></span>
                              <span>{isArchived ? 'Archived' : 'Active'}</span>
                            </div>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">Registration Date</span>
                            <span className="block text-sm font-medium text-slate-900">{formatDate(selectedUserData.createdAt)}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">Last Profile Update</span>
                            <span className="block text-sm font-medium text-slate-900">{formatDate(selectedUserData.updatedAt || selectedUserData.createdAt)}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-0.5">Access Scope</span>
                            <span className="block text-xs sm:text-sm font-medium text-blue-600">
                              {roleInfo.scope || 'Role-Constrained Operational Access'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ROLE RESPONSIBILITIES */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        ROLE RESPONSIBILITIES
                      </div>
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                        {roleInfo.description || 'Handles daily operational support, fleet communications, and role assignments.'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(roleInfo.permissions || []).map((perm, idx) => (
                          <div key={idx} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-700 leading-relaxed font-normal">{perm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {drawerTab === 'Permissions & Access' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>SYSTEM AUTHORIZATION SCOPE</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">{roleInfo.scope || 'Operational Access'}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{roleInfo.description}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        MODULE PRIVILEGES & PERMISSIONS
                      </div>
                      <div className="space-y-2.5">
                        {(roleInfo.permissions || []).map((perm, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-medium text-slate-800">{perm}</span>
                              <span className="block text-[11px] text-slate-400 mt-0.5">Authorized for {selectedUserData.role || 'Staff'} account tier</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'Account Security' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span>SECURITY & AUTHENTICATION</span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Password Encryption</span>
                          <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Bcrypt Salted Hash</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Session Type</span>
                          <span className="font-semibold text-slate-700">JSON Web Token (JWT Bearer)</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Session Timeout</span>
                          <span className="font-semibold text-slate-700">8 Hours Inactivity</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-slate-500">Account Access Tier</span>
                          <span className="font-semibold text-blue-600">{selectedUserData.role || 'User'}</span>
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          ADMINISTRATIVE CONTROLS
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setDrawerOpen(false);
                              openEditModal(selectedUserData);
                            }}
                            className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <Key className="w-3.5 h-3.5" /> Reset Password / Update Credentials
                          </button>

                          {currentUserId && String(selectedUserData._id) !== String(currentUserId) && selectedUserData.isActive !== false && String(selectedUserData.status).toLowerCase() !== 'archived' && (
                            <button
                              onClick={() => {
                                setDrawerOpen(false);
                                promptArchiveUser(selectedUserData);
                              }}
                              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Deactivate / Archive Account
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions (matching screenshot) */}
              <div className="p-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
                <button
                  id="close-user-drawer-footer-btn"
                  onClick={() => setDrawerOpen(false)}
                  className="px-5 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                {isSuperAdmin && (
                  <button
                    id="edit-user-drawer-footer-btn"
                    onClick={() => {
                      setDrawerOpen(false);
                      openEditModal(selectedUserData);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CREATE / EDIT USER MODAL */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedUser ? "Edit User Account" : "Add New User Account"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedUser ? "Update profile details or role permissions." : "Create personnel credentials for system access."}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  placeholder="e.g., Juan Dela Cruz"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g., juan.delacruz@sptc.com"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {selectedUser ? "New Password (leave blank to keep current)" : "Password *"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder={selectedUser ? "••••••••" : "Minimum 6 characters"}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!selectedUser}
                />
              </div>

              {/* System Role */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Assigned System Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ROLES.map(roleName => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  {ROLE_DETAILS[formData.role]?.description || "Configures permissions for this account."}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{selectedUser ? "Save Changes" : "Create User"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE IN-APP DIALOG */}
      {confirmArchiveData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Archive User Account</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to archive <strong className="text-gray-900">{confirmArchiveData.fullName || confirmArchiveData.email}</strong>? This user will be deactivated and unable to access the system.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmArchiveData(null)}
                disabled={archivingId === confirmArchiveData._id}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeArchive}
                disabled={archivingId === confirmArchiveData._id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {archivingId === confirmArchiveData._id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Archiving...</span>
                  </>
                ) : (
                  <span>Archive Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementPage;


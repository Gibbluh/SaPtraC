import React, { useState, useMemo, useEffect } from 'react';
import api from '../../lib/axios';
import { 
  Search, Filter, Plus, Download, Eye, LayoutGrid, 
  MoreVertical, CheckCircle, AlertTriangle, XCircle, 
  User, Phone, Mail, Calendar, MapPin, Clock, Star, 
  FileText, Edit, Trash2, Archive, Printer, MessageSquare, 
  ChevronLeft, ChevronRight, ChevronDown, Upload, X, Map,
  Check, ArrowUpDown
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_DRIVERS = Array.from({ length: 45 }).map((_, i) => ({
  id: `DRV-${1000 + i}`,
  firstName: ['Juan', 'Pedro', 'Jose', 'Maria', 'Antonio', 'Luis', 'Carlos', 'Miguel'][i % 8],
  lastName: ['Dela Cruz', 'Santos', 'Reyes', 'Bautista', 'Garcia', 'Mendoza', 'Torres'][i % 7],
  phone: `+63 9${Math.floor(100000000 + Math.random() * 900000000)}`,
  email: `driver${i}@example.com`,
  licenseNumber: `N${Math.floor(Math.random() * 99)}-${Math.floor(Math.random() * 99)}-${Math.floor(100000 + Math.random() * 899999)}`,
  licenseExpiry: new Date(Date.now() + (Math.random() * 365 * 2 - 30) * 24 * 60 * 60 * 1000).toISOString(),
  route: ['Langgam', 'Villarosa', 'Bayan-Bayanan', 'Estrella', 'Calamba', 'Unassigned'][Math.floor(Math.random() * 6)],
  shift: ['First Shift', 'Second Shift', 'Flexible'][Math.floor(Math.random() * 3)],
  status: ['Active', 'Active', 'Active', 'Suspended', 'On Leave', 'Inactive'][Math.floor(Math.random() * 6)],
  rating: (3 + Math.random() * 2).toFixed(1),
  remittances: Math.floor(50000 + Math.random() * 150000),
  avatar: `https://i.pravatar.cc/150?u=${i}`,
  isOnRoute: Math.random() > 0.7,
  joinDate: new Date(Date.now() - Math.random() * 1000 * 24 * 60 * 60 * 1000).toISOString(),
}));

const toDriverViewModel = (driver) => {
  const id = String(driver.driverCode || driver._id || driver.id);

  return {
    ...driver,
    id,
    mongoId: String(driver._id || driver.mongoId || id),
    avatar: driver.profileImage || `https://i.pravatar.cc/150?u=${id}`,
    licenseExpiry: driver.licenseExpiry || new Date().toISOString(),
    route: driver.route || driver.assignedUnit?.route || 'Unassigned',
    shift: driver.shift || 'Flexible',
    rating: driver.rating || 'N/A',
    remittances: driver.totalLifetimeRemit || 0,
    joinDate: driver.createdAt || new Date().toISOString(),
  };
};

const DriverManagementPage = () => {
  // State
  const [activeTab, setActiveTab] = useState('All Drivers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState(null);
      
  // Modals/Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedDriverData, setSelectedDriverData] = useState(null);
  const [drawerTab, setDrawerTab] = useState('Overview');
  
  const [formOpen, setFormOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [driversList, setDriversList] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadDrivers = async () => {
      try {
        const response = await api.get('/drivers', {
          params: { page: 1, limit: 1000 },
        });
        const records = Array.isArray(response.data)
          ? response.data
          : response.data?.drivers || response.data?.data || [];

        if (mounted) {
          setDriversList(records.map(toDriverViewModel));
        }
      } catch (error) {
        console.error('Failed to load drivers:', error);
        if (mounted) setDriversList([]);
      }
    };

    loadDrivers();
    return () => {
      mounted = false;
    };
  }, []);

  const handleExportCSV = () => {
    if (filteredDrivers.length === 0) return;
    const headers = ["Driver ID", "First Name", "Last Name", "Phone", "Email", "License Number", "License Expiry", "Status", "Route", "Shift", "Rating", "Date Joined"];
    const rows = filteredDrivers.map(d => [
      `"${d.id}"`,
      `"${d.firstName}"`,
      `"${d.lastName}"`,
      `"${d.phone}"`,
      `"${d.email || ''}"`,
      `"${d.licenseNumber}"`,
      `"${d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : ''}"`,
      `"${d.status}"`,
      `"${d.route || 'Unassigned'}"`,
      `"${d.shift || 'Flexible'}"`,
      `"${d.rating || 'N/A'}"`,
      `"${d.joinDate ? new Date(d.joinDate).toLocaleDateString() : ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sptc_drivers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setImportStatusMessage(`Imported ${file.name} successfully. Drivers list updated.`);
        setTimeout(() => setImportStatusMessage(null), 4000);
      }
    };
    input.click();
  };

  // Derived state
  const filteredDrivers = useMemo(() => {
    return driversList.filter(d => {
      // Tab filter
      if (activeTab === 'Active' && d.status !== 'Active') return false;
      if (activeTab === 'Suspended' && d.status !== 'Suspended') return false;
      if (activeTab === 'Inactive' && d.status !== 'Inactive') return false;
      
      const daysToExpiry = (new Date(d.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24);
      if (activeTab === 'Documents Expiring' && daysToExpiry > 30) return false;
      
      // Search
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && !(
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchLower) ||
        d.id.toLowerCase().includes(searchLower) ||
        d.phone.includes(searchQuery)
      )) return false;

      return true;
    });
  }, [driversList, activeTab, searchQuery]);

  const paginatedDrivers = filteredDrivers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredDrivers.length / rowsPerPage);

  // Handlers
  const openDriverDrawer = (driver) => {
    setSelectedDriverData(driver);
    setDrawerTab('Overview');
    setDrawerOpen(true);
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const styles = {
      'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Suspended': 'bg-red-50 text-red-700 border-red-200',
      'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
      'Inactive': 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles['Inactive']}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-emerald-500' : status === 'Suspended' ? 'bg-red-500' : status === 'On Leave' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
        {status}
      </span>
    );
  };

  // License Status Badge Component
  const LicenseBadge = ({ expiry }) => {
    const days = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24);
    if (days < 0) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">Expired</span>;
    }
    if (days <= 30) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Expiring Soon</span>;
    }
    return <span className="inline-flex items-center text-emerald-600"><CheckCircle className="w-3.5 h-3.5 mr-1" />{new Date(expiry).toLocaleDateString()}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* HEADER */}
      
        {/* Page Header (Notion-style clean title with breadcrumbs) */}
        <div className="mb-6 px-6 pt-6">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
            <span>SPTC</span>
            <span className="opacity-50">/</span>
            <span>Fleet Personnel</span>
            <span className="opacity-50">/</span>
            <span className="font-semibold text-slate-700">Drivers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Driver Management</h1>
        </div>

        {importStatusMessage && (
          <div className="mx-6 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center justify-between">
            <span>{importStatusMessage}</span>
            <button onClick={() => setImportStatusMessage(null)} className="text-blue-500 hover:text-blue-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      {/* MAIN CONTENT */}
      <main className="flex-1 px-6 pb-6 flex flex-col relative">
        
        {/* Filters & Actions Toolbar Card (Notion-style lower toolbar) */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
          
          {/* Left side counter */}
          <div className="flex items-center gap-3 shrink-0 px-2 py-0.5">
            <div className="text-sm text-slate-500 font-medium">
              {filteredDrivers.length > 0 ? (
                <>Showing <span className="font-semibold text-slate-700">{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredDrivers.length)}</span> of <span className="font-semibold text-slate-700">{filteredDrivers.length}</span> drivers</>
              ) : (
                <>0 drivers found</>
              )}
            </div>
          </div>

          {/* Right side controls: Search, Status Filter, Import, Export, Add Driver */}
          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 flex-wrap justify-end lg:ml-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                id="search-drivers-input"
                type="text" 
                placeholder="Search drivers..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-white text-gray-900 placeholder-gray-400 pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown Filter */}
            <div className="relative">
              <button
                id="status-dropdown-drivers-btn"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs"
              >
                <Filter className="w-4 h-4 text-gray-400" />
                <span>Status: {activeTab}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-0.5" />
              </button>
              
              {statusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)}></div>
                  <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 flex flex-col">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Filter by Status
                    </div>
                    {['All Drivers', 'Active', 'Suspended', 'Inactive', 'Documents Expiring'].map(tab => {
                      const isActive = activeTab === tab;
                      let dotColor = 'bg-gray-400';
                      if (tab === 'Active') dotColor = 'bg-emerald-500';
                      if (tab === 'Suspended') dotColor = 'bg-red-500';
                      if (tab === 'Documents Expiring') dotColor = 'bg-amber-500';
                      return (
                        <button
                          key={tab}
                          onClick={() => { 
                            setActiveTab(tab); 
                            setPage(1); 
                            setStatusDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            {tab !== 'All Drivers' && <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>}
                            <span>{tab}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

            {/* Import Button */}
            <button 
              id="import-drivers-btn"
              onClick={handleImportClick}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-xs"
              title="Import Driver Data"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Export Button */}
            <button 
              id="export-drivers-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-xs"
              title="Export Drivers to CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Add Driver Button */}
            <button 
              id="add-driver-btn"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
          {/* TABLE */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
                    <div className="flex items-center gap-1">Driver <ArrowUpDown className="w-3 h-3 text-slate-400"/></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Info</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">License</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date Joined</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDrivers.map((driver) => (
                  <tr 
                    key={driver.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={(e) => {
                      if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                        openDriverDrawer(driver);
                      }
                    }}
                  >
                    
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={driver.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          {driver.isOnRoute && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{driver.firstName} {driver.lastName}</div>
                          <div className="text-xs text-slate-500">{driver.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4">
                      <div className="text-sm text-slate-700">{driver.phone}</div>
                      <div className="text-xs text-slate-500">{driver.email}</div>
                    </td>
                    <td className="px-4">
                      <div className="text-sm font-medium text-slate-700 mb-0.5">{driver.licenseNumber}</div>
                      <LicenseBadge expiry={driver.licenseExpiry} />
                    </td>
                    <td className="px-4">
                      <StatusBadge status={driver.status} />
                    </td>
                    <td className="px-4">
                      <div className="text-sm text-slate-700">{new Date(driver.joinDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 text-right relative">
                      <button 
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === driver.id ? null : driver.id);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeDropdown === driver.id && (
                        <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}></div>
                        <div className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setActiveDropdown(null); openDriverDrawer(driver); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">View Profile</button>
                          <button onClick={() => { setActiveDropdown(null); setFormOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit Details</button>
                          <button onClick={() => setActiveDropdown(null)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Print QR Code</button>
                          <button onClick={() => {
                            setActiveDropdown(null);
                            const newStatus = driver.status === 'Active' ? 'Suspended' : 'Active';
                            setDriversList(prev => prev.map(d => d.id === driver.id ? { ...d, status: newStatus } : d));
                          }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{driver.status === 'Active' ? 'Suspend' : 'Activate'}</button>
                          <button onClick={() => {
                            setActiveDropdown(null);
                            setDriversList(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'Inactive' } : d));
                          }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Archive</button>
                          <div className="h-px bg-slate-200 my-1"></div>
                          <button onClick={() => {
                            setActiveDropdown(null);
                            setDriversList(prev => prev.filter(d => d.id !== driver.id));
                          }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Delete</button>
                        </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedDrivers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <User className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-900">No drivers found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              Rows per page:
              <select 
                value={rowsPerPage} 
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-slate-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-medium">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* DRIVER DETAIL DRAWER */}
      {drawerOpen && selectedDriverData && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-6 border-b border-slate-200 flex flex-col relative bg-slate-50/50">
              <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm hover:shadow">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-start justify-between gap-5 w-full pr-8">
                <div className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <img src={selectedDriverData.avatar} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover" />
                    <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${selectedDriverData.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedDriverData.firstName} {selectedDriverData.lastName}</h2>
                      <select 
                        value={selectedDriverData.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setDriversList(prev => prev.map(d => d.id === selectedDriverData.id ? { ...d, status: newStatus } : d));
                          setSelectedDriverData(prev => ({ ...prev, status: newStatus }));
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer outline-none appearance-none ${
                          selectedDriverData.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          selectedDriverData.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                          selectedDriverData.status === 'On Leave' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                        style={{ paddingRight: '1rem', backgroundPosition: 'right 0.25rem center', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <p className="text-sm text-slate-500 font-medium mb-1">ID: {selectedDriverData.id} • Joined {new Date(selectedDriverData.joinDate).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600 font-medium mb-4 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500"/> {new Date().toLocaleDateString()} • {selectedDriverData.shift === 'First Shift' ? '06:00 AM - 02:00 PM' : selectedDriverData.shift === 'Second Shift' ? '02:00 PM - 10:00 PM' : '08:00 AM - 05:00 PM'} • {selectedDriverData.route}</p>
                    
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                        <Edit className="w-4 h-4" /> Edit Profile
                      </button>
                      <button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5">
                        <Printer className="w-4 h-4" /> QR Code
                      </button>
                    </div>
                  </div>
                </div>

                <div 
                  className="w-24 h-24 bg-white rounded-xl shadow-sm border border-slate-200 p-2 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative shrink-0 hidden sm:block mr-12"
                  onClick={() => setQrModalOpen(true)}
                >
                  <img src={selectedDriverData.qrCode} alt="QR Code" className="w-full h-full object-contain group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-xl">
                    <span className="bg-white text-blue-600 px-2 py-1 rounded text-[10px] font-bold shadow-sm">View</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 px-6 mt-2">
              {['Overview', 'Documents', 'Schedule', 'Transactions', 'Activity Log'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${drawerTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {drawerTab === 'Overview' && (
                <div className="space-y-6">
                  {/* Contact Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-blue-600"/> Contact Information</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                        <p className="text-sm font-medium text-slate-900">{selectedDriverData.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Email Address</p>
                        <p className="text-sm font-medium text-slate-900">{selectedDriverData.email}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 mb-1">Address</p>
                        <p className="text-sm font-medium text-slate-900">123 Bonifacio St, Brgy. San Jose, Calamba City, Laguna</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Assignment Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Map className="w-4 h-4 text-blue-600"/> Current Assignment</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Route</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <p className="text-sm font-semibold text-slate-900">{selectedDriverData.route}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Shift</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <p className="text-sm font-medium text-slate-900">{selectedDriverData.shift}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Assigned Unit</p>
                        <p className="text-sm font-medium text-slate-900">Jeepney J-42 (ABC-1234)</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Boundary Rate</p>
                        <p className="text-sm font-medium text-slate-900">₱800 / day</p>
                      </div>
                    </div>
                  </div>

                  {/* License Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-blue-500">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600"/> License Details</h3>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">License Number</p>
                        <p className="text-base font-mono font-bold text-slate-900">{selectedDriverData.licenseNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <LicenseBadge expiry={selectedDriverData.licenseExpiry} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Validity Progress</span>
                        <span className="font-medium">{new Date(selectedDriverData.licenseExpiry).toLocaleDateString()}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                            {drawerTab === 'Documents' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600"/> Uploaded Documents</h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload Document
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Professional Driver\'s License', status: 'Valid', expiry: selectedDriverData.licenseExpiry, color: 'emerald' },
                      { name: 'Medical Certificate', status: 'Valid', expiry: '2027-05-15', color: 'emerald' },
                      { name: 'NBI Clearance', status: 'Expiring Soon', expiry: '2026-10-01', color: 'amber' }
                    ].map((doc, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <FileText className={`w-8 h-8 text-${doc.color}-500 bg-${doc.color}-50 p-1.5 rounded-lg`} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${doc.color}-100 text-${doc.color}-700`}>{doc.status}</span>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm mb-1">{doc.name}</p>
                        <p className="text-xs text-slate-500">Expires: {new Date(doc.expiry).toLocaleDateString()}</p>
                        <button className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 text-left">View Document</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {drawerTab === 'Schedule' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600"/> Upcoming Shifts</h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Shift</th><th className="px-4 py-2">Route</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        <tr><td className="px-4 py-3 font-medium">Tomorrow</td><td className="px-4 py-3 text-slate-600">{selectedDriverData.shift}</td><td className="px-4 py-3">{selectedDriverData.route}</td></tr>
                        <tr><td className="px-4 py-3 font-medium">Oct 12, 2026</td><td className="px-4 py-3 text-slate-600">{selectedDriverData.shift}</td><td className="px-4 py-3">{selectedDriverData.route}</td></tr>
                        <tr><td className="px-4 py-3 font-medium">Oct 13, 2026</td><td className="px-4 py-3 text-slate-600">Day Off</td><td className="px-4 py-3 text-slate-400">-</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {drawerTab === 'Transactions' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600"/> Transaction History</h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Description</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        <tr><td className="px-4 py-3">Today, 10:00 AM</td><td className="px-4 py-3 text-slate-700">Fuel Advance</td><td className="px-4 py-3 font-bold text-red-600">-₱500.00</td><td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Deducted</span></td></tr>
                        <tr><td className="px-4 py-3">Yesterday, 3:15 PM</td><td className="px-4 py-3 text-slate-700">Daily Remittance</td><td className="px-4 py-3 font-bold text-emerald-600">+₱800.00</td><td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Cleared</span></td></tr>
                        <tr><td className="px-4 py-3">Oct 09, 2026</td><td className="px-4 py-3 text-slate-700">Maintenance Fee</td><td className="px-4 py-3 font-bold text-red-600">-₱150.00</td><td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Deducted</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {drawerTab === 'Activity Log' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600"/> Recent Activity</h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-blue-100 p-1 rounded-full border-2 border-white"><CheckCircle className="w-4 h-4 text-blue-600" /></div>
                        <div className="pl-6">
                          <p className="text-sm font-medium text-slate-900">Profile Updated</p>
                          <p className="text-xs text-slate-500">Address information was updated by Super Admin</p>
                          <p className="text-[10px] text-slate-400 mt-1">Today, 10:30 AM</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-emerald-100 p-1 rounded-full border-2 border-white"><FileText className="w-4 h-4 text-emerald-600" /></div>
                        <div className="pl-6">
                          <p className="text-sm font-medium text-slate-900">Document Uploaded</p>
                          <p className="text-xs text-slate-500">New Medical Certificate was uploaded</p>
                          <p className="text-[10px] text-slate-400 mt-1">Oct 12, 2026, 2:15 PM</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] bg-amber-100 p-1 rounded-full border-2 border-white"><Star className="w-4 h-4 text-amber-600" /></div>
                        <div className="pl-6">
                          <p className="text-sm font-medium text-slate-900">Status Changed</p>
                          <p className="text-xs text-slate-500">Status changed from On Leave to Active</p>
                          <p className="text-[10px] text-slate-400 mt-1">Oct 01, 2026, 9:00 AM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrModalOpen && selectedDriverData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setQrModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
            <button onClick={() => setQrModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Driver QR Code</h2>
            <p className="text-sm text-slate-500 mb-6 text-center">Scan this code to view the driver profile or assign a vehicle.</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 w-full flex justify-center">
              <img src={selectedDriverData.qrCode} alt="QR Code Large" className="w-48 h-48 mix-blend-multiply" />
            </div>
            
            <div className="text-center w-full">
              <p className="font-bold text-slate-900 text-lg">{selectedDriverData.firstName} {selectedDriverData.lastName}</p>
              <p className="text-sm text-slate-500 font-mono mt-1">{selectedDriverData.id}</p>
            </div>
            
            <button 
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              onClick={() => {
                alert("Downloading QR Code...");
              }}
            >
              <Download className="w-4 h-4" /> Download PNG
            </button>
          </div>
        </div>
      )}

      {/* ADD DRIVER FORM MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setFormOpen(false)}></div>
          <form onSubmit={(e) => { e.preventDefault(); setFormOpen(false); }} className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Add New Driver</h2>
              <button onClick={() => setFormOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Profile Photo Col */}
                <div className="lg:col-span-3 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors group mb-3 relative overflow-hidden">
                    <Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Upload Photo</span>
                  </div>
                  <p className="text-[10px] text-center text-slate-500">JPG or PNG, max 5MB</p>
                </div>

                {/* Form Fields Col */}
                <div className="lg:col-span-9 space-y-8">
                  {/* Section 1 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider pb-2 border-b border-slate-200">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="e.g. Juan" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="e.g. Dela Cruz" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 text-slate-500 text-sm font-medium">+63</span>
                          <input required type="tel" pattern="[0-9]{10}" title="10 digit phone number after +63" className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="912 345 6789" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="juan@example.com" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Complete Address *</label>
                        <textarea required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white text-slate-900" rows="2" placeholder="House/Block No., Street, Barangay, City, Province"></textarea>
                      </div>
                    </div>
                  </section>

                  {/* Section 2 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider pb-2 border-b border-slate-200">License Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">License Number *</label>
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase bg-white text-slate-900" placeholder="N00-00-000000" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">License Type *</label>
                        <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900">
                          <option value="">Select Type</option>
                          <option value="Professional">Professional</option>
                          <option value="Non-Professional">Non-Professional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                        <input required type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" />
                      </div>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider pb-2 border-b border-slate-200">Cooperative Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Member ID</label>
                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="e.g. COOP-1001" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date Joined</label>
                        <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900">
                          <option>Active</option>
                          <option>On Leave</option>
                          <option>Suspended</option>
                          <option>Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Boundary Rate (₱)</label>
                        <input type="number" min="0" step="10" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="e.g. 800" />
                      </div>
                    </div>
                  </section>
                  {/* Section 4 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider pb-2 border-b border-slate-200">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
                        <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="Full Name" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900">
                          <option>Spouse</option>
                          <option>Parent</option>
                          <option>Sibling</option>
                          <option>Child</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number *</label>
                        <input required type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900" placeholder="09XX XXX XXXX" />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <div className="flex gap-3">
                <button type="button" className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Save as Draft</button>
                <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Save Driver
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DriverManagementPage;

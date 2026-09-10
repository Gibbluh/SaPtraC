import { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, X, Map, Settings2, ChevronDown, Filter,
  Truck, AlertTriangle, FileText, 
  Clock, Upload, Edit, ChevronRight,
  ChevronLeft, Settings, LayoutGrid, List,
  QrCode, Activity, ShieldCheck, DownloadCloud,
  MoreVertical, Eye, Printer, Trash2, Check
} from 'lucide-react';
import AddUnitModal from './components/AddUnitModal';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

const MOCK_UNITS = [
  {
    id: "UNT-2024-001",
    plateNumber: "ABC-1234",
    unitNumber: "101",
    make: "Toyota",
    model: "Hiace Commuter",
    year: "2022",
    type: "Van",
    capacity: 15,
    engineNo: "ENG123456789",
    chassisNo: "CHS987654321",
    color: "White",
    franchiseNo: "FR-2022-0001",
    ltfrbCaseNo: "2022-0001-A",
    regIssueDate: "2022-05-10",
    regExpiryDate: "2025-05-10",
    insuranceProvider: "Standard Insurance",
    insurancePolicyNo: "POL-998877",
    insuranceExpiryDate: "2024-10-15",
    dateAcquired: "2022-04-15",
    acquisitionCost: 1500000,
    route: "LANGGAM",
    status: "Available",
    healthScore: 92,
    documents: [
      { id: 1, type: "Registration", name: "OR_CR_ABC1234.pdf", date: "2022-05-10", size: "1.2MB" },
      { id: 2, type: "Insurance", name: "Insurance_Policy.pdf", date: "2023-10-10", size: "2.4MB" }
    ],
    avatar: "https://images.unsplash.com/photo-1621217346399-440263690d5f?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "UNT-2024-002",
    plateNumber: "XYZ-9876",
    unitNumber: "102",
    make: "Mitsubishi",
    model: "L300",
    year: "2023",
    type: "Van",
    capacity: 17,
    engineNo: "ENG987654",
    chassisNo: "CHS123456",
    color: "Silver",
    franchiseNo: "FR-2023-0002",
    ltfrbCaseNo: "2023-0002-B",
    regIssueDate: "2023-01-20",
    regExpiryDate: "2026-01-20",
    insuranceProvider: "Pioneer Insurance",
    insurancePolicyNo: "POL-112233",
    insuranceExpiryDate: "2024-01-20", 
    dateAcquired: "2023-01-05",
    acquisitionCost: 1100000,
    route: "BAYAN-BAYANAN",
    status: "In Maintenance",
    healthScore: 55,
    documents: [],
    avatar: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "UNT-2024-003",
    plateNumber: "DEF-4567",
    unitNumber: "103",
    make: "Toyota",
    model: "Coaster",
    year: "2020",
    type: "Mini Bus",
    capacity: 29,
    engineNo: "ENG456789",
    chassisNo: "CHS654321",
    color: "White/Blue",
    franchiseNo: "FR-2020-0003",
    ltfrbCaseNo: "2020-0003-C",
    regIssueDate: "2020-08-15",
    regExpiryDate: "2025-08-15",
    insuranceProvider: "Charter Ping An",
    insurancePolicyNo: "POL-445566",
    insuranceExpiryDate: "2024-12-01",
    dateAcquired: "2020-07-30",
    acquisitionCost: 2800000,
    route: "VILLAROSA",
    status: "Out of Service",
    healthScore: 25,
    documents: [],
    avatar: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=300"
  }
];

const toUnitViewModel = (unit) => ({
  ...unit,
  id: String(unit._id || unit.id),
  unitNumber: unit.bodyNumber || unit.unitNumber || 'Unassigned',
  plateNumber: unit.plateNumber || 'No plate number',
  make: unit.make || unit.unitType || 'Unknown',
  model: unit.model || unit.fuelType || 'Unknown',
  type: unit.unitType || unit.type || 'Vehicle',
  year: unit.year || new Date(unit.createdAt || Date.now()).getFullYear(),
  engineNo: unit.engineNo || 'Not recorded',
  chassisNo: unit.chassisNo || 'Not recorded',
  franchiseNo: unit.franchiseNo || 'Not recorded',
  ltfrbCaseNo: unit.ltfrbCaseNo || 'Not recorded',
  insuranceProvider: unit.insuranceProvider || 'Not recorded',
  insurancePolicyNo: unit.insurancePolicyNo || 'Not recorded',
  acquisitionCost: Number(unit.acquisitionCost || 0),
  status: unit.availabilityStatus || unit.status || 'Available',
  route: unit.route || 'UNASSIGNED',
  healthScore: unit.healthPercentage ?? unit.healthScore ?? 100,
  documents: unit.documents || [],
  dateAcquired: unit.createdAt || new Date().toISOString(),
  regExpiryDate: unit.registrationExpiry || new Date().toISOString(),
  insuranceExpiryDate: unit.insuranceExpiry || new Date().toISOString(),
});

for(let i=4; i<=25; i++) {
  MOCK_UNITS.push({
    id: `UNT-2024-00${i}`,
    plateNumber: `RND-${1000+i}`,
    unitNumber: `${100+i}`,
    make: ["Toyota", "Isuzu", "Mitsubishi", "Hyundai"][i%4],
    model: ["Hiace", "QKR77", "L300", "H100"][i%4],
    year: "202" + (i%5),
    type: ["Van", "Modern PUV", "Jeepney", "Van"][i%4],
    capacity: 15 + (i%10),
    engineNo: `ENG${i}000`,
    chassisNo: `CHS${i}000`,
    color: ["White", "Silver", "Red", "Blue"][i%4],
    franchiseNo: `FR-2020-00${i}`,
    ltfrbCaseNo: `2020-00${i}-X`,
    regIssueDate: `2023-0${(i%9)+1}-10`,
    regExpiryDate: `2026-0${(i%9)+1}-10`,
    insuranceProvider: "Standard Insurance",
    insurancePolicyNo: `POL-00${i}`,
    insuranceExpiryDate: `2025-01-10`,
    dateAcquired: `2021-01-15`,
    acquisitionCost: 1500000 + (i*10000),
    route: ["LANGGAM", "VILLAROSA", "BAYAN-BAYANAN", "ESTRELLA", "CALAMBA", "UNASSIGNED"][i%6],
    status: ["Available", "In Maintenance", "Available", "Available"][i%4],
    healthScore: 40 + (i * 7) % 60,
    documents: [],
    avatar: i%3 === 0 ? "https://images.unsplash.com/photo-1554744512-d6c603f27c54?auto=format&fit=crop&q=80&w=300" : null
  });
}


const MOCK_ROUTES = [
  { id: 'RT-01', name: 'Langgam', color: 'blue', units: 12, description: 'Langgam to Complex', status: 'Active' },
  { id: 'RT-02', name: 'Villarosa', color: 'emerald', units: 8, description: 'Villarosa to Complex', status: 'Active' },
  { id: 'RT-03', name: 'Bayan-Bayanan', color: 'purple', units: 10, description: 'Bayan-Bayanan to Complex', status: 'Active' },
  { id: 'RT-04', name: 'Estrella', color: 'orange', units: 7, description: 'Estrella to Complex', status: 'Active' },
  { id: 'RT-05', name: 'Calamba', color: 'red', units: 5, description: 'Calamba to Complex', status: 'Active' },
];

const UnitManagementPage = () => {
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState(new Set());
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUnitData, setSelectedUnitData] = useState(null);
  const [drawerTab, setDrawerTab] = useState('Overview');
  
  const [formOpen, setFormOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;
  const [unitsList, setUnitsList] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadUnits = async () => {
      try {
        const response = await api.get('/units', {
          params: { page: 1, limit: 1000 },
        });
        const records = Array.isArray(response.data)
          ? response.data
          : response.data?.units || response.data?.data || [];

        if (mounted) {
          setUnitsList(records.map(toUnitViewModel));
        }
      } catch (error) {
        console.error('Failed to load units:', error);
        if (mounted) setUnitsList([]);
      }
    };

    loadUnits();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Design System Helpers ---
  const getRouteBadgeStyles = (route) => {
    switch (route) {
      case 'LANGGAM': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'VILLAROSA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'BAYAN-BAYANAN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ESTRELLA': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CALAMBA': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Available': return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-50' };
      case 'In Maintenance': return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50' };
      case 'Out of Service': return { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', light: 'bg-red-50' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-700', border: 'border-gray-200', light: 'bg-gray-50' };
    }
  };

  const getHealthConfig = (score) => {
    if (score >= 80) return { color: 'bg-emerald-500', label: 'Good' };
    if (score >= 60) return { color: 'bg-amber-400', label: 'Fair' };
    if (score >= 40) return { color: 'bg-orange-500', label: 'Needs Attention' };
    return { color: 'bg-red-600', label: 'Critical' };
  };

  const getRegExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', warning: true, icon: <AlertTriangle className="w-3 h-3 text-red-500" /> };
    if (diffDays <= 30) return { label: 'Expiring Soon', warning: true, icon: <Clock className="w-3 h-3 text-amber-500" /> };
    return { label: new Date(expiryDate).toLocaleDateString(), warning: false, icon: null };
  };

  // --- Derived Data ---
  const filteredUnits = useMemo(() => {
    return unitsList.filter(u => {
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && !(
        u.plateNumber.toLowerCase().includes(searchLower) ||
        u.unitNumber.toLowerCase().includes(searchLower) ||
        `${u.make} ${u.model}`.toLowerCase().includes(searchLower)
      )) return false;
      return true;
    });
  }, [unitsList, statusFilter, searchQuery]);

  const paginatedUnits = filteredUnits.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredUnits.length / rowsPerPage) || 1;

  // --- Actions ---
  const toggleSelection = (id, e) => {
    e.stopPropagation();
    const newSet = new Set(selectedUnits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUnits(newSet);
  };
  
  const toggleAll = () => {
    if (selectedUnits.size === paginatedUnits.length) {
      setSelectedUnits(new Set());
    } else {
      setSelectedUnits(new Set(paginatedUnits.map(u => u.id)));
    }
  };

  const openUnitDrawer = (unit) => {
    setSelectedUnitData(unit);
    setDrawerTab('Overview');
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative overflow-hidden">
      
      <main className="flex-1 p-6 overflow-auto">
        {/* Page Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <span>SPTC</span>
              <span className="opacity-50">/</span>
              <span>Fleet Vehicles</span>
              <span className="opacity-50">/</span>
              <span className="font-semibold text-slate-700">Modern Jeepneys</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Unit Management</h1>
          </div>

          {/* Filters & Actions Bar directly in header */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Status Dropdown Filter */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-normal text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-xs"
              >
                Status: {statusFilter}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </button>
              
              {statusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)}></div>
                  <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 flex flex-col">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Filter by Status
                    </div>
                    {['All', 'Available', 'In Maintenance', 'Out of Service'].map(status => {
                      const count = status === 'All' ? unitsList.length : unitsList.filter(u => u.status === status).length;
                      const isActive = statusFilter === status;
                      
                      let dotColor = 'bg-gray-400';
                      if (status === 'Available') dotColor = 'bg-emerald-500';
                      if (status === 'In Maintenance') dotColor = 'bg-amber-500';
                      if (status === 'Out of Service') dotColor = 'bg-red-500';

                      return (
                        <button
                          key={status}
                          onClick={() => { setStatusFilter(status); setStatusDropdownOpen(false); }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            {status !== 'All' && <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>}
                            {status === 'All' ? 'All Statuses' : status}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Route Dropdown Filter */}
            <div className="relative">
              <button
                onClick={() => setRouteDropdownOpen(!routeDropdownOpen)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-normal text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-xs"
              >
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                Route: {routeFilter}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </button>
              
              {routeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRouteDropdownOpen(false)}></div>
                  <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 flex flex-col">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Filter by Route
                    </div>
                    <button
                      onClick={() => { setRouteFilter('All'); setRouteDropdownOpen(false); }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${routeFilter === 'All' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span>All Units</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{unitsList.length}</span>
                    </button>
                    {MOCK_ROUTES.map(route => {
                      const count = unitsList.filter(u => u.route.toLowerCase() === route.name.toLowerCase()).length;
                      const isActive = routeFilter === route.name;
                      return (
                        <button
                          key={route.id}
                          onClick={() => { setRouteFilter(route.name); setRouteDropdownOpen(false); }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              route.color === 'blue' ? 'bg-blue-500' : 
                              route.color === 'emerald' ? 'bg-emerald-500' :
                              route.color === 'purple' ? 'bg-purple-500' :
                              route.color === 'orange' ? 'bg-orange-500' :
                              route.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                            {route.name}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
                        </button>
                      )
                    })}
                    <div className="my-1 border-t border-gray-100"></div>
                    <button
                      onClick={() => { setRouteFilter('Unassigned'); setRouteDropdownOpen(false); }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${routeFilter === 'Unassigned' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Unassigned
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        {unitsList.filter(u => u.route === 'UNASSIGNED').length}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search plate, unit..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white text-gray-900 placeholder-gray-400 pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                title="Grid View"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                title="Table View"
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* + Add Unit Button */}
            <button
              onClick={() => setFormOpen(true)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Unit
            </button>
          </div>
        </div>

        {/* Route Summary Card */}
        {routeFilter !== 'All' && routeFilter !== 'Unassigned' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{routeFilter} Route</h2>
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-gray-400" /> <span className="font-semibold text-gray-900">{filteredUnits.length}</span> Total Units</div>
                <div className="w-1 h-1 rounded-full bg-gray-300 hidden md:block"></div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {filteredUnits.filter(u=>u.status==='Available').length} Available</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> {filteredUnits.filter(u=>u.status==='In Maintenance').length} Maintenance</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                 <Settings2 className="w-4 h-4" /> Manage Route
               </button>
               <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2">
                 <Map className="w-4 h-4" /> View Schedule
               </button>
            </div>
          </div>
        )}
        
        {routeFilter === 'Unassigned' && (
          <div className="bg-gray-100 rounded-xl border border-gray-200 border-dashed p-6 mb-6 flex items-center justify-between">
             <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Unassigned Units</h2>
                <p className="text-sm text-gray-500">These units are not currently assigned to any active route.</p>
             </div>
             <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                 Assign Units
             </button>
          </div>
        )}

                {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
              <Truck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No units found</h3>
            <p className="text-gray-500 max-w-sm mb-6 text-sm">
              {searchQuery || statusFilter !== 'All' || routeFilter !== 'All' 
                ? "We couldn't find any units matching your current filters. Try adjusting your search."
                : "Your fleet is currently empty. Add your first unit to start managing them."}
            </p>
            {(!searchQuery && statusFilter === 'All' && routeFilter === 'All') && (
              <button 
                onClick={() => setFormOpen(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add your first unit
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {paginatedUnits.map(unit => {
              const statusCfg = getStatusConfig(unit.status);
              const healthCfg = getHealthConfig(unit.healthScore);
              const isSelected = selectedUnits.has(unit.id);

              return (
                <div 
                  key={unit.id}
                  onClick={() => openUnitDrawer(unit)}
                  className={`group relative flex flex-col bg-white rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer overflow-hidden
                    ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}
                  `}
                >
                  {/* Selection Checkbox Layer */}
                  <div 
                    onClick={(e) => toggleSelection(unit.id, e)}
                    className={`absolute top-3 left-3 z-10 p-1 rounded-md transition-opacity 
                      ${isSelected ? 'opacity-100 bg-white/95 shadow-xs' : 'opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white'}
                    `}
                  >
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

                  {/* Photo Header */}
                  <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {unit.avatar ? (
                      <img src={unit.avatar} alt={unit.plateNumber} className="w-full h-full object-cover" />
                    ) : (
                      <Truck className="w-12 h-12 text-gray-300" />
                    )}
                    {/* Status Overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-white/20">
                      <div className={`w-2 h-2 rounded-full ${statusCfg.bg}`}></div>
                      <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wide">{unit.status}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 font-mono tracking-tight">{unit.plateNumber}</h3>
                        <p className="text-xs text-gray-500 font-medium">Unit: <span className="text-gray-900">{unit.unitNumber}</span></p>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRouteBadgeStyles(unit.route)}`}>
                        {unit.route}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-4">{unit.make} {unit.model} {unit.year}</p>

                    <div className="mt-auto pt-4 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-gray-500 mb-1">
                        <span>Health Score</span>
                        <span>{unit.healthScore}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${healthCfg.color}`} style={{ width: `${unit.healthScore}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions (Hover) */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveDropdown(activeDropdown === unit.id ? null : unit.id);
                      }} 
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-white/20 text-gray-600 hover:text-blue-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === unit.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}></div>
                        <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setActiveDropdown(null); openUnitDrawer(unit); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400" /> View Details</button>
                          <button onClick={() => { setActiveDropdown(null); setFormOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit className="w-4 h-4 text-slate-400" /> Edit Unit</button>
                          <button onClick={() => setActiveDropdown(null)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Printer className="w-4 h-4 text-slate-400" /> Print QR</button>
                          <div className="h-px bg-slate-200 my-1"></div>
                          <button onClick={() => setActiveDropdown(null)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-400" /> Remove</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT TABLE VIEW */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden pb-20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="pl-4 pr-2 py-3 w-10 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <div 
                          role="checkbox"
                          aria-checked={selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0}
                          onClick={toggleAll}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-gray-300 hover:border-gray-400 shadow-xs'
                          }`}
                        >
                          {selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0 && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                      </div>
                    </th>
                    <th className="pl-2 pr-4 py-3">Unit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Vehicle Details</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Reg. Expiry</th>
                    <th className="px-4 py-3">Health Score</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUnits.map(unit => {
                    const statusCfg = getStatusConfig(unit.status);
                    const healthCfg = getHealthConfig(unit.healthScore);
                    const regStatus = getRegExpiryStatus(unit.regExpiryDate);
                    const isSelected = selectedUnits.has(unit.id);

                    return (
                      <tr 
                        key={unit.id}
                        onClick={() => openUnitDrawer(unit)}
                        className={`group hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="pl-4 pr-2 py-3.5 align-middle text-center" onClick={(e) => toggleSelection(unit.id, e)}>
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
                        <td className="pl-2 pr-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                              {unit.avatar ? (
                                <img src={unit.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <Truck className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-mono font-bold text-gray-900 tracking-tight">{unit.plateNumber}</div>
                              <div className="text-xs text-gray-500">Unit: {unit.unitNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${statusCfg.light} ${statusCfg.text} border ${statusCfg.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.bg}`}></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{unit.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{unit.make} {unit.model}</div>
                          <div className="text-xs text-gray-500">{unit.year} • {unit.type}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRouteBadgeStyles(unit.route)}`}>
                            {unit.route}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${regStatus.warning ? 'text-amber-600' : 'text-gray-700'}`}>
                              {regStatus.label}
                            </span>
                            {regStatus.icon}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] font-medium text-gray-500 mb-1">
                              <span>{unit.healthScore}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${healthCfg.color}`} style={{ width: `${unit.healthScore}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right relative">
                          <button 
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === unit.id ? null : unit.id);
                            }} 
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeDropdown === unit.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}></div>
                              <div className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setActiveDropdown(null); openUnitDrawer(unit); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400" /> View Details</button>
                                <button onClick={() => { setActiveDropdown(null); setFormOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit className="w-4 h-4 text-slate-400" /> Edit Unit</button>
                                <button onClick={() => setActiveDropdown(null)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Printer className="w-4 h-4 text-slate-400" /> Print QR</button>
                                <div className="h-px bg-slate-200 my-1"></div>
                                <button onClick={() => setActiveDropdown(null)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-400" /> Remove</button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredUnits.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}</span> to <span className="font-medium">{Math.min(page * rowsPerPage, filteredUnits.length)}</span> of <span className="font-medium">{filteredUnits.length}</span> results
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* BULK ACTION BAR */}
      {selectedUnits.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8">
          <span className="font-semibold text-sm whitespace-nowrap">{selectedUnits.size} selected</span>
          <div className="h-5 w-px bg-gray-700"></div>
          <button className="text-sm font-medium hover:text-blue-400 transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4" /> Change Status
          </button>
          <button className="text-sm font-medium hover:text-blue-400 transition-colors flex items-center gap-2">
            <DownloadCloud className="w-4 h-4" /> Download QRs
          </button>
          <div className="h-5 w-px bg-gray-700"></div>
          <button onClick={() => setSelectedUnits(new Set())} className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {drawerOpen && selectedUnitData && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
          <div className="w-full max-w-2xl bg-gray-50 h-full flex flex-col relative animate-in slide-in-from-right overflow-hidden shadow-2xl">
            
            {/* Drawer Hero Header */}
            <div className="relative h-48 bg-gray-800 shrink-0">
              {selectedUnitData.avatar ? (
                <img src={selectedUnitData.avatar} alt="Unit" className="w-full h-full object-cover opacity-70" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-70">
                  <Truck className="w-20 h-20 text-gray-500" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
              
              <button 
                onClick={() => setDrawerOpen(false)} 
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusConfig(selectedUnitData.status).bg} text-white`}>
                      {selectedUnitData.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-black/40 border-white/20 text-white backdrop-blur-md`}>
                      {selectedUnitData.route}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold font-mono text-white tracking-tight">{selectedUnitData.plateNumber}</h2>
                  <p className="text-gray-300 text-sm">Unit No: {selectedUnitData.unitNumber} • {selectedUnitData.make} {selectedUnitData.model}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors border border-white/10" title="Print QR">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex px-6 bg-white border-b border-gray-200 shrink-0">
              {['Overview', 'Documents', 'Health & Status', 'Activity Log'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    drawerTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {drawerTab === 'Overview' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Vehicle Details</h3>
                      <div className="space-y-3">
                        <div><p className="text-xs text-gray-500">Make & Model</p><p className="font-medium text-gray-900">{selectedUnitData.make} {selectedUnitData.model}</p></div>
                        <div><p className="text-xs text-gray-500">Year</p><p className="font-medium text-gray-900">{selectedUnitData.year}</p></div>
                        <div><p className="text-xs text-gray-500">Type / Capacity</p><p className="font-medium text-gray-900">{selectedUnitData.type} • {selectedUnitData.capacity} pax</p></div>
                        <div><p className="text-xs text-gray-500">Engine / Chassis</p><p className="font-mono text-xs text-gray-900 mt-0.5">{selectedUnitData.engineNo} <br/> {selectedUnitData.chassisNo}</p></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Registration & Legal</h3>
                      <div className="space-y-3">
                        <div><p className="text-xs text-gray-500">Franchise No.</p><p className="font-medium text-gray-900">{selectedUnitData.franchiseNo}</p></div>
                        <div><p className="text-xs text-gray-500">LTFRB Case No.</p><p className="font-medium text-gray-900">{selectedUnitData.ltfrbCaseNo}</p></div>
                        <div>
                          <p className="text-xs text-gray-500">Registration Expiry</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-medium text-gray-900">{new Date(selectedUnitData.regExpiryDate).toLocaleDateString()}</p>
                            {getRegExpiryStatus(selectedUnitData.regExpiryDate).warning && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                        </div>
                        <div><p className="text-xs text-gray-500">Acquisition</p><p className="font-medium text-gray-900">{new Date(selectedUnitData.dateAcquired).toLocaleDateString()} • ₱{selectedUnitData.acquisitionCost.toLocaleString()}</p></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Insurance Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div><p className="text-xs text-gray-500">Provider</p><p className="font-medium text-gray-900">{selectedUnitData.insuranceProvider}</p></div>
                      <div><p className="text-xs text-gray-500">Policy No.</p><p className="font-medium text-gray-900">{selectedUnitData.insurancePolicyNo}</p></div>
                      <div><p className="text-xs text-gray-500">Expiry Date</p><p className="font-medium text-gray-900">{new Date(selectedUnitData.insuranceExpiryDate).toLocaleDateString()}</p></div>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'Documents' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900">Digital Files</h3>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Upload
                    </button>
                  </div>
                  
                  {selectedUnitData.documents.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedUnitData.documents.map(doc => (
                        <div key={doc.id} className="border border-gray-200 rounded-xl p-4 flex gap-3 bg-white hover:border-blue-300 transition-colors cursor-pointer group">
                          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 rounded">{doc.type}</span>
                              <span className="text-xs text-gray-400">{doc.size}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                        <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900">No documents found</p>
                      <p className="text-xs text-gray-500 mt-1">Drag and drop files here, or click to browse.</p>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'Health & Status' && (
                <div className="space-y-6">
                  {/* Health Score Summary */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={getHealthConfig(selectedUnitData.healthScore).color.replace('bg-', 'text-')} strokeDasharray={`${selectedUnitData.healthScore}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{selectedUnitData.healthScore}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Fleet Health Score</h3>
                      <p className="text-sm text-gray-500 mb-3">Based on recent maintenance, mileage, and active alerts.</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getHealthConfig(selectedUnitData.healthScore).color} text-white`}>
                        <ShieldCheck className="w-3.5 h-3.5" /> {getHealthConfig(selectedUnitData.healthScore).label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Settings className="w-4 h-4 text-blue-600"/> Recent Maintenance</h3>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-gray-100 text-sm">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">Oct 12, 2024</td>
                          <td className="px-4 py-3 font-medium text-gray-900">Preventive</td>
                          <td className="px-4 py-3 text-gray-600">Oil change and brake pad replacement</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">Sep 05, 2024</td>
                          <td className="px-4 py-3 font-medium text-gray-900">Repair</td>
                          <td className="px-4 py-3 text-gray-600">Aircon cleaning and freon refill</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drawerTab === 'Activity Log' && (
                <div className="space-y-4">
                  <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                    <div className="relative shrink-0">
                      <div className="absolute -left-[21px] bg-blue-100 rounded-full p-1.5 border border-white">
                        <Activity className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="pl-6">
                        <p className="text-sm font-medium text-gray-900">Status changed to <span className="font-bold">Available</span></p>
                        <p className="text-xs text-gray-500 mt-0.5">By Super Admin • Today, 10:45 AM</p>
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <div className="absolute -left-[21px] bg-gray-100 rounded-full p-1.5 border border-white">
                        <Edit className="w-3 h-3 text-gray-600" />
                      </div>
                      <div className="pl-6">
                        <p className="text-sm font-medium text-gray-900">Route reassigned to <span className="font-bold">{selectedUnitData.route}</span></p>
                        <p className="text-xs text-gray-500 mt-0.5">By Dispatcher • Yesterday, 2:30 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Basic Form Modal placeholder */}
                  <AddUnitModal 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        onSave={(newUnit) => {
          setUnitsList([newUnit, ...unitsList]);
          toast.success(`Unit ${newUnit.plateNumber} added successfully`);
        }} 
      />

    </div>
  );
};

export default UnitManagementPage;

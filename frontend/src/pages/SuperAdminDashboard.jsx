import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  TrendingUp,
  Truck,
  ClipboardList,
  Users,
  ShieldAlert,
  Fuel,
  Activity,
  ArrowUpRight,
  Info,
  Calendar,
  Clock,
  Search,
  X,
  ExternalLink,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend,
  ReferenceLine,
} from "recharts";

const WIDGET_CLASSES = {
  'chart-revenue': 'sm:col-span-10 lg:col-span-4 lg:row-span-2 flex h-full min-h-[350px]',
  'chart-weekly-earnings': 'sm:col-span-10 lg:col-span-4 lg:row-span-2 flex h-full min-h-[350px]',
  'chart-dispatches': 'sm:col-span-5 lg:col-span-2 flex h-full',
  'chart-fleet': 'sm:col-span-5 lg:col-span-2 flex h-full',
  'metric-revenue': 'sm:col-span-10 lg:col-span-4 flex h-full',
  'metric-fuel': 'sm:col-span-5 lg:col-span-3 flex h-full',
  'metric-active-units': 'sm:col-span-5 lg:col-span-3 flex h-full',
  'chart-fuel-efficiency': 'sm:col-span-10 lg:col-span-6 lg:row-span-2 flex h-full min-h-[350px]',
};

const SortableItem = ({ id, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Hide the original item so the gap is visible
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className || ''}`} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const SuperAdminDashboard = ({ dashboard, fleetHealth, formatCurrency, timeFilter }) => {
  
  const [activeId, setActiveId] = useState(null);
  const [revenueTab, setRevenueTab] = useState('1d');
  const [earningsTab, setEarningsTab] = useState('Week');
  const [fuelViewMode, setFuelViewMode] = useState('chart'); // 'chart' | 'units'
  const [selectedFuelTime, setSelectedFuelTime] = useState('17:00');
  const [fuelMetric, setFuelMetric] = useState('fillUps'); // 'fillUps' | 'liters' | 'cost'
  const [fuelSearchQuery, setFuelSearchQuery] = useState('');
  const [inspectedSlot, setInspectedSlot] = useState(null); // slot for drill-down modal
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [widgetOrder, setWidgetOrder] = useState([
    'chart-revenue', 'chart-weekly-earnings', 'chart-dispatches', 'chart-fleet', 'metric-revenue', 'metric-fuel', 'metric-active-units', 'chart-fuel-efficiency'
  ]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };


  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Safe mock multiplication factor based on time filter
  const tfMult = timeFilter === 'Tomorrow' ? 1.25 : timeFilter === 'Yesterday' ? 0.8 : 1;

  const revenue = dashboard?.revenue || { total: 124567, trend: '+12.5%' };
  const totalRevenue = (revenue.total || 124567) * tfMult;
  
  const fleetData = fleetHealth?.status || { good: 15, warning: 5, critical: 3, idle: 2 };
  const good = fleetData.good || 0;
  const warn = fleetData.warning || 0;
  const crit = fleetData.critical || 0;
  const idle = fleetData.idle || 0;
  const totalActive = good + warn + crit;
  
  const weeklyEarningsData = [
    { label: 'Mon', earnings: 145000 },
    { label: 'Tue', earnings: 132000 },
    { label: 'Wed', earnings: 164000 },
    { label: 'Thu', earnings: 158000 },
    { label: 'Fri', earnings: 195000 },
    { label: 'Sat', earnings: 210000 },
    { label: 'Sun', earnings: 185000 },
  ];

  const monthlyEarningsData = [
    { label: 'Week 1', earnings: 1105000 },
    { label: 'Week 2', earnings: 1050000 },
    { label: 'Week 3', earnings: 1250000 },
    { label: 'Week 4', earnings: 1189000 },
  ];
  const fuelEfficiencyData = [
    { 
      time: '05:00', 
      fillUps: 2, 
      avgVolume: 15,
      units: [
        { unitNumber: '101', plate: 'ABC-1234', liters: 16.5, cost: 1072, station: 'Petron Complex', driver: 'Ramon Santos' },
        { unitNumber: '104', plate: 'RND-1004', liters: 13.5, cost: 877, station: 'Shell Balibago', driver: 'Carlos Vega' },
      ]
    },
    { 
      time: '08:00', 
      fillUps: 8, 
      avgVolume: 45,
      units: [
        { unitNumber: '102', plate: 'XYZ-9876', liters: 44.0, cost: 2860, station: 'Phoenix Hwy', driver: 'Danilo Cruz' },
        { unitNumber: '105', plate: 'RND-1005', liters: 46.5, cost: 3020, station: 'Caltex Langgam', driver: 'Mario Diaz' },
        { unitNumber: '106', plate: 'RND-1006', liters: 43.8, cost: 2847, station: 'Petron Complex', driver: 'Jose Reyes' },
        { unitNumber: '107', plate: 'RND-1007', liters: 45.0, cost: 2925, station: 'Cleanfuel Hiway', driver: 'Eduardo Ramos' },
        { unitNumber: '108', plate: 'RND-1008', liters: 47.2, cost: 3068, station: 'Seaoil Express', driver: 'Antonio Luna' },
        { unitNumber: '110', plate: 'RND-1010', liters: 42.5, cost: 2762, station: 'Shell Balibago', driver: 'Gabriel Silang' },
        { unitNumber: '111', plate: 'RND-1011', liters: 45.8, cost: 2977, station: 'Petron Complex', driver: 'Benigno Aquino' },
        { unitNumber: '112', plate: 'RND-1012', liters: 45.2, cost: 2938, station: 'Phoenix Hwy', driver: 'Emilio Jacinto' },
      ]
    },
    { 
      time: '11:00', 
      fillUps: 12, 
      avgVolume: 60,
      units: [
        { unitNumber: '101', plate: 'ABC-1234', liters: 58.0, cost: 3770, station: 'Petron Complex', driver: 'Ramon Santos' },
        { unitNumber: '103', plate: 'DEF-4567', liters: 62.5, cost: 4062, station: 'Caltex Langgam', driver: 'Pedro Penduko' },
        { unitNumber: '109', plate: 'RND-1009', liters: 59.4, cost: 3861, station: 'Cleanfuel Hiway', driver: 'Fernando Poe' },
        { unitNumber: '113', plate: 'RND-1013', liters: 61.0, cost: 3965, station: 'Shell Balibago', driver: 'Manuel Quezon' },
        { unitNumber: '114', plate: 'RND-1014', liters: 60.5, cost: 3932, station: 'Seaoil Express', driver: 'Andres Bonifacio' },
        { unitNumber: '115', plate: 'RND-1015', liters: 58.8, cost: 3822, station: 'Petron Complex', driver: 'Apolinario Mabini' },
        { unitNumber: '116', plate: 'RND-1016', liters: 63.0, cost: 4095, station: 'Phoenix Hwy', driver: 'Marcelo Del Pilar' },
        { unitNumber: '117', plate: 'RND-1017', liters: 57.5, cost: 3737, station: 'Shell Balibago', driver: 'Jose Rizal' },
        { unitNumber: '118', plate: 'RND-1018', liters: 60.2, cost: 3913, station: 'Petron Complex', driver: 'Graciano Lopez' },
        { unitNumber: '119', plate: 'RND-1019', liters: 61.8, cost: 4017, station: 'Caltex Langgam', driver: 'Tandang Sora' },
        { unitNumber: '120', plate: 'RND-1020', liters: 59.0, cost: 3835, station: 'Cleanfuel Hiway', driver: 'Jose Basa' },
        { unitNumber: '121', plate: 'RND-1021', liters: 58.3, cost: 3789, station: 'Seaoil Express', driver: 'Manuel Tinio' },
      ]
    },
    { 
      time: '14:00', 
      fillUps: 15, 
      avgVolume: 80,
      units: [
        { unitNumber: '102', plate: 'XYZ-9876', liters: 82.0, cost: 5330, station: 'Phoenix Hwy', driver: 'Danilo Cruz' },
        { unitNumber: '104', plate: 'RND-1004', liters: 78.5, cost: 5102, station: 'Shell Balibago', driver: 'Carlos Vega' },
        { unitNumber: '105', plate: 'RND-1005', liters: 81.0, cost: 5265, station: 'Caltex Langgam', driver: 'Mario Diaz' },
        { unitNumber: '107', plate: 'RND-1007', liters: 79.5, cost: 5167, station: 'Cleanfuel Hiway', driver: 'Eduardo Ramos' },
        { unitNumber: '108', plate: 'RND-1008', liters: 84.0, cost: 5460, station: 'Seaoil Express', driver: 'Antonio Luna' },
        { unitNumber: '110', plate: 'RND-1010', liters: 80.2, cost: 5213, station: 'Shell Balibago', driver: 'Gabriel Silang' },
        { unitNumber: '111', plate: 'RND-1011', liters: 77.8, cost: 5057, station: 'Petron Complex', driver: 'Benigno Aquino' },
        { unitNumber: '112', plate: 'RND-1012', liters: 83.1, cost: 5401, station: 'Phoenix Hwy', driver: 'Emilio Jacinto' },
        { unitNumber: '113', plate: 'RND-1013', liters: 79.0, cost: 5135, station: 'Shell Balibago', driver: 'Manuel Quezon' },
        { unitNumber: '115', plate: 'RND-1015', liters: 80.5, cost: 5232, station: 'Petron Complex', driver: 'Apolinario Mabini' },
        { unitNumber: '118', plate: 'RND-1018', liters: 82.3, cost: 5349, station: 'Petron Complex', driver: 'Graciano Lopez' },
        { unitNumber: '122', plate: 'RND-1022', liters: 78.0, cost: 5070, station: 'Caltex Langgam', driver: 'Vicente Lukban' },
        { unitNumber: '123', plate: 'RND-1023', liters: 81.5, cost: 5297, station: 'Cleanfuel Hiway', driver: 'Felipe Calderon' },
        { unitNumber: '124', plate: 'RND-1024', liters: 79.2, cost: 5148, station: 'Seaoil Express', driver: 'Antonio Regidor' },
        { unitNumber: '125', plate: 'RND-1025', liters: 82.4, cost: 5356, station: 'Petron Complex', driver: 'Pedro Paterno' },
      ]
    },
    { 
      time: '17:00', 
      fillUps: 20, 
      avgVolume: 110,
      units: [
        { unitNumber: '101', plate: 'ABC-1234', liters: 112.0, cost: 7280, station: 'Petron Complex', driver: 'Ramon Santos' },
        { unitNumber: '102', plate: 'XYZ-9876', liters: 108.5, cost: 7052, station: 'Phoenix Hwy', driver: 'Danilo Cruz' },
        { unitNumber: '104', plate: 'RND-1004', liters: 115.0, cost: 7475, station: 'Shell Balibago', driver: 'Carlos Vega' },
        { unitNumber: '105', plate: 'RND-1005', liters: 110.0, cost: 7150, station: 'Caltex Langgam', driver: 'Mario Diaz' },
        { unitNumber: '106', plate: 'RND-1006', liters: 109.5, cost: 7117, station: 'Petron Complex', driver: 'Jose Reyes' },
        { unitNumber: '107', plate: 'RND-1007', liters: 111.0, cost: 7215, station: 'Cleanfuel Hiway', driver: 'Eduardo Ramos' },
        { unitNumber: '108', plate: 'RND-1008', liters: 107.5, cost: 6987, station: 'Seaoil Express', driver: 'Antonio Luna' },
        { unitNumber: '109', plate: 'RND-1009', liters: 114.0, cost: 7410, station: 'Cleanfuel Hiway', driver: 'Fernando Poe' },
        { unitNumber: '110', plate: 'RND-1010', liters: 108.0, cost: 7020, station: 'Shell Balibago', driver: 'Gabriel Silang' },
        { unitNumber: '111', plate: 'RND-1011', liters: 113.2, cost: 7358, station: 'Petron Complex', driver: 'Benigno Aquino' },
        { unitNumber: '112', plate: 'RND-1012', liters: 110.5, cost: 7182, station: 'Phoenix Hwy', driver: 'Emilio Jacinto' },
        { unitNumber: '114', plate: 'RND-1014', liters: 106.8, cost: 6942, station: 'Seaoil Express', driver: 'Andres Bonifacio' },
        { unitNumber: '115', plate: 'RND-1015', liters: 112.5, cost: 7312, station: 'Petron Complex', driver: 'Apolinario Mabini' },
        { unitNumber: '117', plate: 'RND-1017', liters: 109.0, cost: 7085, station: 'Shell Balibago', driver: 'Jose Rizal' },
        { unitNumber: '119', plate: 'RND-1019', liters: 111.5, cost: 7247, station: 'Caltex Langgam', driver: 'Tandang Sora' },
        { unitNumber: '120', plate: 'RND-1020', liters: 108.4, cost: 7046, station: 'Cleanfuel Hiway', driver: 'Jose Basa' },
        { unitNumber: '121', plate: 'RND-1021', liters: 110.2, cost: 7163, station: 'Seaoil Express', driver: 'Manuel Tinio' },
        { unitNumber: '122', plate: 'RND-1022', liters: 107.0, cost: 6955, station: 'Caltex Langgam', driver: 'Vicente Lukban' },
        { unitNumber: '123', plate: 'RND-1023', liters: 114.5, cost: 7442, station: 'Cleanfuel Hiway', driver: 'Felipe Calderon' },
        { unitNumber: '125', plate: 'RND-1025', liters: 111.0, cost: 7215, station: 'Petron Complex', driver: 'Pedro Paterno' },
      ]
    },
    { 
      time: '20:00', 
      fillUps: 5, 
      avgVolume: 25,
      units: [
        { unitNumber: '103', plate: 'DEF-4567', liters: 26.0, cost: 1690, station: 'Caltex Langgam', driver: 'Pedro Penduko' },
        { unitNumber: '106', plate: 'RND-1006', liters: 24.5, cost: 1592, station: 'Petron Complex', driver: 'Jose Reyes' },
        { unitNumber: '116', plate: 'RND-1016', liters: 25.8, cost: 1677, station: 'Phoenix Hwy', driver: 'Marcelo Del Pilar' },
        { unitNumber: '118', plate: 'RND-1018', liters: 23.5, cost: 1527, station: 'Petron Complex', driver: 'Graciano Lopez' },
        { unitNumber: '124', plate: 'RND-1024', liters: 25.2, cost: 1638, station: 'Seaoil Express', driver: 'Antonio Regidor' },
      ]
    },
    { 
      time: '23:00', 
      fillUps: 1, 
      avgVolume: 10,
      units: [
        { unitNumber: '101', plate: 'ABC-1234', liters: 10.5, cost: 682, station: 'Petron Complex', driver: 'Ramon Santos' },
      ]
    },
  ];

  // Unique units refueled on current date (aggregated)
  const todayRefueledUnitsList = useMemo(() => {
    const map = new Map();
    fuelEfficiencyData.forEach(slot => {
      slot.units.forEach(u => {
        if (!map.has(u.unitNumber)) {
          map.set(u.unitNumber, {
            ...u,
            times: [slot.time],
            totalLiters: u.liters,
            totalCost: u.cost,
            fillUpsCount: 1
          });
        } else {
          const existing = map.get(u.unitNumber);
          existing.times.push(slot.time);
          existing.totalLiters = Number((existing.totalLiters + u.liters).toFixed(1));
          existing.totalCost += u.cost;
          existing.fillUpsCount += 1;
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));
  }, []);

  // Enriched fuel data with operational shift names, total liters and cost per slot
  const enrichedFuelData = useMemo(() => {
    return fuelEfficiencyData.map(slot => {
      const slotLiters = Number(slot.units.reduce((sum, u) => sum + u.liters, 0).toFixed(1));
      const slotCost = slot.units.reduce((sum, u) => sum + u.cost, 0);
      return {
        ...slot,
        totalLiters: slotLiters,
        totalCost: slotCost,
        label: slot.time === '05:00' ? '5 AM' :
               slot.time === '08:00' ? '8 AM' :
               slot.time === '11:00' ? '11 AM' :
               slot.time === '14:00' ? '2 PM' :
               slot.time === '17:00' ? '5 PM' :
               slot.time === '20:00' ? '8 PM' : '11 PM',
        shiftName: slot.time === '05:00' ? 'Dawn Patrol' :
                   slot.time === '08:00' ? 'Morning Shift' :
                   slot.time === '11:00' ? 'Midday Run' :
                   slot.time === '14:00' ? 'Afternoon Run' :
                   slot.time === '17:00' ? 'Shift Handover' :
                   slot.time === '20:00' ? 'Evening Return' : 'Depot Night',
      };
    });
  }, []);

  const totalFuelLiters = useMemo(() => {
    return Number(enrichedFuelData.reduce((sum, d) => sum + d.totalLiters, 0).toFixed(1));
  }, [enrichedFuelData]);

  const totalFuelCost = useMemo(() => {
    return enrichedFuelData.reduce((sum, d) => sum + d.totalCost, 0);
  }, [enrichedFuelData]);

  const totalFillUps = useMemo(() => {
    return enrichedFuelData.reduce((sum, d) => sum + d.fillUps, 0);
  }, [enrichedFuelData]);

  const avgMetricBenchmark = useMemo(() => {
    if (!enrichedFuelData.length) return 0;
    if (fuelMetric === 'fillUps') {
      return Math.round(totalFillUps / enrichedFuelData.length);
    }
    if (fuelMetric === 'liters') {
      return Math.round(totalFuelLiters / enrichedFuelData.length);
    }
    return Math.round(totalFuelCost / enrichedFuelData.length);
  }, [enrichedFuelData, fuelMetric, totalFillUps, totalFuelLiters, totalFuelCost]);


  const yearlyEarningsData = [
    { label: 'Jan', earnings: 4500000 },
    { label: 'Feb', earnings: 4200000 },
    { label: 'Mar', earnings: 4800000 },
    { label: 'Apr', earnings: 5100000 },
    { label: 'May', earnings: 4900000 },
    { label: 'Jun', earnings: 5300000 },
    { label: 'Jul', earnings: 5600000 },
    { label: 'Aug', earnings: 5400000 },
    { label: 'Sep', earnings: 5800000 },
    { label: 'Oct', earnings: 5200000 },
    { label: 'Nov', earnings: 5900000 },
    { label: 'Dec', earnings: 6200000 },
  ];

  const mockRevenueData = [
    { time: '6 AM', value: 12000 * tfMult },
    { time: '9 AM', value: 35000 * tfMult },
    { time: '12 PM', value: 48000 * tfMult },
    { time: '3 PM', value: 72000 * tfMult },
    { time: '6 PM', value: 95000 * tfMult },
    { time: '9 PM', value: 110000 * tfMult },
    { time: '12 AM', value: 124567 * tfMult }
  ];

  const pieData = [
    { name: 'Good', value: good },
    { name: 'Warning', value: warn },
    { name: 'Critical', value: crit },
    { name: 'Idle', value: idle },
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

  // Calculate current date strings
  
  const MOCK_DISPATCHES = [
    { id: 1, name: "Juan Dela Cruz", vehicle: "NGQ 3326", route: "Cubao - Antipolo", avatar: "https://i.pravatar.cc/150?u=1", schedule: "06:00 AM - 02:00 PM" },
    { id: 2, name: "Pedro Penduko", vehicle: "UVP 9182", route: "Makati - BGC", avatar: "https://i.pravatar.cc/150?u=2", schedule: "08:00 AM - 04:00 PM" },
    { id: 3, name: "Cardo Dalisay", vehicle: "XYZ 1234", route: "Pasay - MOA", avatar: "https://i.pravatar.cc/150?u=3", schedule: "10:00 AM - 06:00 PM" },
    { id: 4, name: "Lito Lapid", vehicle: "DEF 5678", route: "Quezon Ave - UP", avatar: "https://i.pravatar.cc/150?u=4", schedule: "02:00 PM - 10:00 PM" }
  ];

  const currentEarningsData = earningsTab === 'Week' ? weeklyEarningsData : earningsTab === 'Month' ? monthlyEarningsData : yearlyEarningsData;
  const currentEarningsTotal = earningsTab === 'Week' ? '₱1,189,000' : earningsTab === 'Month' ? '₱4,594,000' : '₱62,900,000';
  const earningsColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16', '#a855f7', '#06b6d4'];

  const CustomEarningsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-3 rounded-xl shadow-lg">
          <p className="dark:text-slate-400 text-slate-500 text-xs font-semibold mb-1">{label}</p>
          <p className="dark:text-white text-slate-900 font-bold text-lg">
            ₱{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const FuelCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs w-48 pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80">
            <span className="font-semibold text-slate-200">{dataItem.label}</span>
            <span className="text-[10px] text-slate-400 font-mono">{dataItem.time}</span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Refuels
              </span>
              <span className="font-bold text-white font-mono">{dataItem.fillUps} units</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Volume
              </span>
              <span className="font-medium text-slate-300 font-mono">{dataItem.totalLiters} L</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Expense
              </span>
              <span className="font-medium text-slate-300 font-mono">₱{dataItem.totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const widgetContents = {
    'chart-fuel-efficiency': (() => {
      const selectedSlot = enrichedFuelData.find(s => s.time === selectedFuelTime) || enrichedFuelData[4] || enrichedFuelData[0];
      
      const filteredUnitsList = todayRefueledUnitsList.filter(u => {
        if (!fuelSearchQuery.trim()) return true;
        const q = fuelSearchQuery.toLowerCase();
        return u.unitNumber.toLowerCase().includes(q) ||
               u.plate.toLowerCase().includes(q) ||
               u.driver.toLowerCase().includes(q) ||
               u.station.toLowerCase().includes(q);
      });

      const currentDataKey = fuelMetric === 'fillUps' ? 'fillUps' : fuelMetric === 'liters' ? 'totalLiters' : 'totalCost';
      const metricUnitLabel = fuelMetric === 'fillUps' ? ' units' : fuelMetric === 'liters' ? ' L' : ' ₱';

      const formatYAxis = (val) => {
        if (fuelMetric === 'cost') {
          return val >= 1000 ? `₱${(val / 1000).toFixed(0)}k` : `₱${val}`;
        }
        if (fuelMetric === 'liters') {
          return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}L`;
        }
        return val;
      };

      return (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto">
          {/* Gradients */}
          <svg style={{ height: 0, width: 0, position: 'absolute' }}>
            <defs>
              <linearGradient id="fuelDefaultBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="fuelActiveBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                <stop offset="100%" stopColor="#047857" stopOpacity={0.95} />
              </linearGradient>
            </defs>
          </svg>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900">Fuel Disbursement & Units</h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    Live Today
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Hourly refueling timeline & active units (Sep 7, 2026)</p>
              </div>
            </div>

            {/* View Mode Toggle: Timeline vs Units Log */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0" onPointerDown={(e) => e.stopPropagation()}>
              <div className="flex dark:bg-slate-900 bg-slate-100 rounded-xl p-1 border dark:border-slate-700 border-slate-200 shadow-xs">
                <button
                  onClick={() => setFuelViewMode('chart')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    fuelViewMode === 'chart' 
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setFuelViewMode('units')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    fuelViewMode === 'units' 
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Units Log ({todayRefueledUnitsList.length})
                </button>
              </div>
            </div>
          </div>

          {fuelViewMode === 'chart' ? (
            <div className="flex-1 flex flex-col justify-between" onPointerDown={(e) => e.stopPropagation()}>
              {/* Samsara-style Executive KPI Strip + Metric Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                {/* 4 Key Metrics */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Refuels</span>
                    <span className="text-lg font-black dark:text-white text-slate-900">{totalFillUps}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Volume Dispensed</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{totalFuelLiters.toLocaleString()} L</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Fuel Expense {timeFilter}</span>
                    <span className="text-lg font-black dark:text-white text-slate-900">₱{totalFuelCost.toLocaleString()}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Active Units {timeFilter}</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">20 <span className="text-xs text-slate-400 font-normal">/ 25</span></span>
                  </div>
                </div>

                {/* Metric Switcher: [Fill-ups | Liters | Cost] */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-[11px] text-slate-400 font-medium">Metric:</span>
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    {[
                      { id: 'fillUps', label: 'Events' },
                      { id: 'liters', label: 'Liters' },
                      { id: 'cost', label: 'Expense (₱)' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setFuelMetric(m.id)}
                        className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors ${
                          fuelMetric === m.id
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spacious, Modern Recharts BarChart */}
              <div className="relative flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrichedFuelData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barSize={34}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700/70" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'currentColor' }} 
                      className="text-slate-500 dark:text-slate-400 font-medium"
                      dy={6}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'currentColor' }} 
                      className="text-slate-500 dark:text-slate-400 font-mono"
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} content={<FuelCustomTooltip />} />
                    <ReferenceLine 
                      y={avgMetricBenchmark} 
                      stroke="#10b981" 
                      strokeDasharray="4 4" 
                      strokeOpacity={0.4}
                      label={{ 
                        value: `Avg: ${avgMetricBenchmark}${metricUnitLabel}`, 
                        fill: '#10b981', 
                        fontSize: 10, 
                        position: 'insideTopRight' 
                      }} 
                    />
                    <Bar 
                      dataKey={currentDataKey} 
                      radius={[6, 6, 0, 0]}
                      onClick={(data) => {
                        if (data?.time) setSelectedFuelTime(data.time);
                      }}
                      className="cursor-pointer"
                    >
                      {enrichedFuelData.map((entry) => (
                        <Cell 
                          key={entry.time} 
                          fill={entry.time === selectedFuelTime ? 'url(#fuelActiveBar)' : 'url(#fuelDefaultBar)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sleek Interactive Inspection Footer Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold dark:text-white text-slate-900">
                      {selectedSlot.label} ({selectedSlot.time}):
                    </span>
                    <span className="text-slate-500">
                      {selectedSlot.units.length} units • {selectedSlot.totalLiters} L
                    </span>
                  </div>

                  {/* Micro unit chips */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
                    {selectedSlot.units.slice(0, 8).map(u => (
                      <span 
                        key={u.unitNumber}
                        title={`${u.plate} • ${u.liters}L • ${u.driver}`}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold shrink-0"
                      >
                        #{u.unitNumber}
                      </span>
                    ))}
                    {selectedSlot.units.length > 8 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{selectedSlot.units.length - 8} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setInspectedSlot(selectedSlot)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] shrink-0 flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/80"
                >
                  <span>Inspect Units</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Modern Full-Height Units Table with Search */
            <div className="flex-1 flex flex-col overflow-hidden pt-1" onPointerDown={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fuelSearchQuery}
                    onChange={(e) => setFuelSearchQuery(e.target.value)}
                    placeholder="Search unit #, plate, driver..."
                    className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {filteredUnitsList.length} of {todayRefueledUnitsList.length} units ({totalFuelLiters} L)
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[290px]">
                {filteredUnitsList.map((u) => (
                  <div key={u.unitNumber} className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs font-mono border border-emerald-200 dark:border-emerald-800">
                        {u.unitNumber}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                          Unit {u.unitNumber}
                          <span className="text-[11px] text-slate-500 font-normal">({u.plate})</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {u.fillUpsCount}x fill-up
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Driver: {u.driver}</span>
                          <span>•</span>
                          <span className="text-slate-400">{u.station}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        {u.totalLiters} L
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 justify-end font-mono">
                        <span>₱{u.totalCost.toLocaleString()}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3 text-slate-400 inline" />
                        <span>{u.times.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    })(),

    'chart-weekly-earnings': (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900">Earnings Comparison</h2>
            </div>
            <div className="flex dark:bg-slate-900 bg-slate-50 rounded-lg p-1 border dark:border-slate-700 border-slate-200 shadow-sm" onPointerDown={(e) => e.stopPropagation()}>
              {['Week', 'Month', 'Year'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setEarningsTab(tab)}
                  className={`px-3 py-1 text-xs font-bold rounded shadow-sm border transition-colors ${earningsTab === tab ? 'dark:bg-slate-800 bg-white dark:text-blue-400 text-blue-600 dark:border-slate-600 border-slate-200' : 'border-transparent dark:text-slate-400 text-slate-500 hover:text-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-end gap-3 mb-4">
            <h3 className="text-4xl font-black dark:text-white text-slate-900">{currentEarningsTotal}</h3>
          </div>

          <div className="relative flex-1 w-full min-h-[200px] relative z-10" onPointerDown={(e) => e.stopPropagation()}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentEarningsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} content={<CustomEarningsTooltip />} />
                <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                  {currentEarningsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={earningsColors[index % earningsColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
    ),
    'metric-revenue': (
              <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col w-full h-full cursor-grab active:cursor-grabbing">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 dark:bg-blue-900/50 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="dark:text-blue-400 text-blue-600 w-5 h-5" />
            </div>
            <div className="dark:bg-emerald-900/50 bg-emerald-100 dark:text-emerald-400 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12.5%
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">Total Revenue {timeFilter}</p>
            <h2 className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900 tracking-tight">
              {formatCurrency ? formatCurrency(totalRevenue) : `₱${totalRevenue.toLocaleString()}`}
            </h2>
          </div>
          <div className="mt-auto pt-4 flex justify-between items-end">
            <p className="text-[11px] dark:text-slate-500 text-slate-400">vs ₱{(110800 * tfMult).toLocaleString()} previous</p>
            <div className="flex items-end gap-1 opacity-80">
              <div className="w-2 dark:bg-blue-800 bg-blue-200 rounded-sm h-3"></div>
              <div className="w-2 dark:bg-blue-700 bg-blue-300 rounded-sm h-4"></div>
              <div className="w-2 dark:bg-blue-600 bg-blue-400 rounded-sm h-5"></div>
              <div className="w-2 dark:bg-blue-500 bg-blue-500 rounded-sm h-7"></div>
              <div className="w-2 dark:bg-blue-400 bg-blue-600 rounded-sm h-8"></div>
            </div>
          </div>
        </div>
      
    ),
    'metric-fuel': (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col w-full h-full cursor-grab active:cursor-grabbing">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 dark:bg-amber-900/50 bg-amber-50 rounded-lg flex items-center justify-center">
              <Fuel className="dark:text-amber-400 text-amber-600 w-5 h-5" />
            </div>
            <div className="dark:bg-red-900/50 bg-red-100 dark:text-red-400 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              -2.1%
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">Fuel Expense {timeFilter}</p>
            <h2 className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900 tracking-tight">
              {formatCurrency ? formatCurrency(82350 * tfMult) : `₱${(82350 * tfMult).toLocaleString()}`}
            </h2>
          </div>
          <div className="mt-auto pt-4 flex justify-between items-end">
            <p className="text-[11px] dark:text-slate-500 text-slate-400">vs ₱{(84120 * tfMult).toLocaleString()} previous</p>
            <div className="flex items-end gap-1">
              <div className="w-2 dark:bg-amber-400 bg-amber-600 rounded-sm h-4"></div>
              <div className="w-2 dark:bg-amber-400 bg-amber-600 rounded-sm h-6"></div>
              <div className="w-2 dark:bg-amber-400 bg-amber-600 rounded-sm h-3"></div>
              <div className="w-2 dark:bg-slate-700 bg-slate-200 rounded-sm h-7"></div>
            </div>
          </div>
        </div>
    ),
    'metric-active-units': (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col w-full h-full cursor-grab active:cursor-grabbing">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 dark:bg-emerald-900/50 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Truck className="dark:text-emerald-400 text-emerald-600 w-5 h-5" />
            </div>
            <div className="dark:bg-emerald-900/50 bg-emerald-100 dark:text-emerald-400 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              80% Active
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">Active Units {timeFilter}</p>
            <h2 className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900 tracking-tight flex items-baseline">
              20 <span className="text-sm font-semibold dark:text-slate-500 text-slate-400 ml-1.5">/ 25 Units</span>
            </h2>
          </div>
          <div className="mt-auto pt-4 flex justify-between items-end">
            <p className="text-[11px] dark:text-slate-500 text-slate-400">14 on route • 6 standby</p>
            <div className="flex items-end gap-1">
              <div className="w-2 dark:bg-emerald-400 bg-emerald-500 rounded-sm h-4"></div>
              <div className="w-2 dark:bg-emerald-400 bg-emerald-500 rounded-sm h-6"></div>
              <div className="w-2 dark:bg-emerald-400 bg-emerald-500 rounded-sm h-7"></div>
              <div className="w-2 dark:bg-emerald-400 bg-emerald-500 rounded-sm h-8"></div>
            </div>
          </div>
        </div>
    ),
    'metric-users': (
              <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col w-full h-full cursor-grab active:cursor-grabbing">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 dark:bg-purple-900/50 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="dark:text-purple-400 text-purple-600 w-5 h-5" />
            </div>
            <div className="dark:bg-purple-900/50 bg-purple-100 dark:text-purple-400 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full">
              Live Staff
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">Users Online</p>
            <h2 className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900 tracking-tight flex items-baseline">
              5 <span className="text-sm font-medium dark:text-slate-500 text-slate-400 ml-1">Active Now</span>
            </h2>
          </div>
          <div className="mt-auto pt-5 flex justify-between items-center">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 border border-white dark:border-slate-800 flex items-center justify-center text-[9px] text-white font-bold">DI</div>
              <div className="w-6 h-6 rounded-full bg-purple-500 border border-white dark:border-slate-800 flex items-center justify-center text-[9px] text-white font-bold">M</div>
              <div className="w-6 h-6 rounded-full bg-amber-500 border border-white dark:border-slate-800 flex items-center justify-center text-[9px] text-white font-bold">ES</div>
            </div>
            <Link to="/users" className="dark:text-purple-400 text-purple-600 text-xs font-semibold hover:underline relative z-20" onClick={(e) => e.stopPropagation()}>
              Roster
            </Link>
          </div>
        </div>
      
    ),
    'chart-revenue': (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col w-full h-full cursor-grab active:cursor-grabbing">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900">Revenue Overview</h2>
              
            </div>
            
            {/* Revenue Internal Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
              {['1d', '1w', '1m', '6m', '1y'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setRevenueTab(tab)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${revenueTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          
          <div className="relative flex-1 min-h-[200px] w-full mb-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenueData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₱${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-colors-slate-800)', color: 'white' }}
                  formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={{ stroke: '#3b82f6', strokeWidth: 2, fill: '#fff', r: 4 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-auto border-t dark:border-slate-700 border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs dark:text-slate-400 text-slate-500 font-semibold whitespace-nowrap">Average Per Trip</p>
                <p className="text-base font-bold dark:text-white text-slate-900 flex items-baseline flex-wrap xl:flex-nowrap gap-1">
                  <span className="whitespace-nowrap">₱384</span> <span className="text-[10px] text-emerald-500">+5.4%</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs dark:text-slate-400 text-slate-500 font-semibold whitespace-nowrap">Total Trips</p>
                <p className="text-base font-bold dark:text-white text-slate-900 flex items-baseline flex-wrap xl:flex-nowrap gap-1">
                  <span className="whitespace-nowrap">{324 * tfMult}</span> <span className="text-[10px] dark:text-slate-500 text-slate-400 font-normal">dispatches</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs dark:text-slate-400 text-slate-500 font-semibold whitespace-nowrap">Fuel Efficiency</p>
                <p className="text-base font-bold dark:text-white text-slate-900 flex items-baseline flex-wrap xl:flex-nowrap gap-1">
                  <span className="whitespace-nowrap">4.2 km/L</span> <span className="text-[9px] font-bold dark:text-emerald-400 text-emerald-600 dark:bg-emerald-900/50 bg-emerald-100 px-1 py-0.5 rounded">Euro-4 OK</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      
    ),
    'chart-fleet': (
              <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col items-center w-full h-full cursor-grab active:cursor-grabbing">
          <div className="w-full flex justify-between items-start mb-4">
            <h2 className="text-base font-bold dark:text-white text-slate-900 flex items-center gap-1">
              Fleet Health Score <Info className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400" />
            </h2>
            <span className="flex flex-col text-right leading-tight dark:text-emerald-400 text-emerald-600 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/50">Good<br/>Standby</span>
          </div>
          
          <div className="w-full flex-1 flex flex-col justify-evenly pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-end">
               <div className="flex flex-col">
                 <span className="text-3xl font-black dark:text-white text-slate-900 tracking-tight">85%</span>
                 <span className="text-[10px] font-bold dark:text-slate-500 text-slate-400 tracking-wider">OVERALL INDEX</span>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-semibold dark:text-slate-300 text-slate-700">20 / 25 Units</p>
                 <p className="text-[9px] dark:text-slate-500 text-slate-500">Road-ready for peak commute</p>
               </div>
            </div>
            
            {/* Health Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 border-slate-200">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(good/25)*100}%` }} title={`Good: ${good}`}></div>
              <div className="bg-amber-400 h-full transition-all duration-500 border-l dark:border-slate-800 border-white" style={{ width: `${(warn/25)*100}%` }} title={`Warning: ${warn}`}></div>
              <div className="bg-red-500 h-full transition-all duration-500 border-l dark:border-slate-800 border-white" style={{ width: `${(crit/25)*100}%` }} title={`Critical: ${crit}`}></div>
              <div className="bg-slate-400 dark:bg-slate-500 h-full transition-all duration-500 border-l dark:border-slate-800 border-white" style={{ width: `${(idle/25)*100}%` }} title={`Idle: ${idle}`}></div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-between items-center text-[9px] font-medium px-1">
               <span className="flex items-center dark:text-slate-300 text-slate-600"><span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1.5 shadow-sm"></span> {good} Good</span>
               <span className="flex items-center dark:text-slate-300 text-slate-600"><span className="w-2.5 h-2.5 rounded bg-amber-400 mr-1.5 shadow-sm"></span> {warn} Warning</span>
               <span className="flex items-center dark:text-slate-300 text-slate-600"><span className="w-2.5 h-2.5 rounded bg-red-500 mr-1.5 shadow-sm"></span> {crit} Critical</span>
               <span className="flex items-center dark:text-slate-400 text-slate-500"><span className="w-2.5 h-2.5 rounded bg-slate-400 dark:bg-slate-500 mr-1.5 shadow-sm"></span> {idle} Idle</span>
            </div>
          </div>

                  </div>
          ),
    'chart-dispatches': (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-3">
            <h2 className="text-base font-bold dark:text-white text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 dark:text-blue-400 text-blue-500" />
              Today's Driver
            </h2>
            
                        {/* Active Drivers Count */}
            <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4 mr-1.5" /> 14 Online
            </div>
          </div>
          
          {/* Vertical Leaderboard / Messenger-style List */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 relative z-20 flex-1 min-h-0" onPointerDown={(e) => e.stopPropagation()}>
            {MOCK_DISPATCHES.map((driver) => (
              <div key={driver.id} className="flex items-center p-2 rounded-xl border dark:border-slate-700 border-slate-100 dark:bg-slate-900/50 bg-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all cursor-pointer shadow-sm group">
                <div className="relative shrink-0 mr-3">
                  <img src={driver.avatar} alt={driver.name} className="w-10 h-10 rounded-full object-cover border-2 dark:border-slate-700 border-slate-200 group-hover:border-blue-400 transition-colors" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800"></span>
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-xs font-bold dark:text-white text-slate-900 truncate">{driver.name}</h4>
                  <div className="flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400 gap-1.5 mt-0.5">
                    <span className="flex items-center dark:text-blue-400 text-blue-600 truncate"><Truck className="w-3 h-3 mr-1" /> {driver.vehicle}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
                    <span className="truncate">{driver.route}</span>
                  </div>
                </div>


              </div>
            ))}
          </div>
        </div>
    )
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-10 gap-5 grid-flow-row-dense">
              {widgetOrder.map(id => (
                <SortableItem key={id} id={id} className={WIDGET_CLASSES[id]}>
                  {widgetContents[id]}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (
              <div className={`shadow-2xl opacity-90 scale-105 cursor-grabbing ${WIDGET_CLASSES[activeId]}`}>
                {widgetContents[activeId]}
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>

      {/* Fleetio/Samsara-style Unit Inspection Modal */}
      {inspectedSlot && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => { setInspectedSlot(null); setModalSearchQuery(''); }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold dark:text-white text-slate-900 flex items-center gap-2">
                    Refueling Window: {inspectedSlot.label} ({inspectedSlot.time})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectedSlot.shiftName} • {inspectedSlot.units.length} units refueled
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setInspectedSlot(null); setModalSearchQuery(''); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Units</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{inspectedSlot.units.length} Units</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Volume</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{inspectedSlot.totalLiters} L</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Total Cost</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">₱{inspectedSlot.totalCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="Filter units by number, driver, or station..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Units Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-700/60">
              {inspectedSlot.units
                .filter(u => {
                  if (!modalSearchQuery.trim()) return true;
                  const q = modalSearchQuery.toLowerCase();
                  return u.unitNumber.toLowerCase().includes(q) ||
                         u.plate.toLowerCase().includes(q) ||
                         u.driver.toLowerCase().includes(q) ||
                         u.station.toLowerCase().includes(q);
                })
                .map(u => (
                  <div key={u.unitNumber} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold font-mono text-xs border border-emerald-200 dark:border-emerald-800">
                        {u.unitNumber}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                          Unit {u.unitNumber}
                          <span className="text-[11px] text-slate-500 font-normal">({u.plate})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {u.driver} • {u.station}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {u.liters} L
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ₱{u.cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Close Button */}
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
              <button
                onClick={() => { setInspectedSlot(null); setModalSearchQuery(''); }}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminDashboard;


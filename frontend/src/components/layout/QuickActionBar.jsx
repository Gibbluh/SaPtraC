import React, { useState } from 'react';
import { Plus, UserPlus, BadgePlus, Car, Fuel, FileCheck2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickActionBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const actions = [
    { icon: UserPlus, label: 'Add User', link: '/users', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BadgePlus, label: 'Add Driver', link: '/drivers', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Car, label: 'Add Unit', link: '/units', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Fuel, label: 'Record Fuel', link: '/fuel', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: FileCheck2, label: 'Verify Remit', link: '/remittances', color: 'text-teal-600', bg: 'bg-teal-50' },
    { icon: FileText, label: 'Report', link: '/analytics', color: 'text-slate-600', bg: 'bg-slate-100' },
  ];
  
  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Action buttons Container */}
      <div className={`absolute bottom-full right-0 mb-3 flex flex-col gap-3 transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0 visible pointer-events-auto' : 'opacity-0 translate-y-4 invisible pointer-events-none'}`}>
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              to={action.link}
              className="flex items-center gap-3 group/item justify-end"
            >
              <span className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm transition-transform group-hover/item:scale-105 duration-200 whitespace-nowrap">
                {action.label}
              </span>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-transform group-hover/item:scale-110 ${action.bg} ${action.color} border border-slate-200 bg-white shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Main FAB */}
      <button 
        className={`w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 hover:shadow-xl transition-all duration-300 relative z-10 ${isOpen ? 'rotate-45' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Action"
      >
        <Plus size={24} className="transition-transform duration-300" />
      </button>
      
      {/* Hover bridge - invisible area between FAB and actions so the mouse doesn't leave the container when moving up */}
      {isOpen && <div className="absolute bottom-14 right-0 w-14 h-4" />}
    </div>
  );
};

export default QuickActionBar;


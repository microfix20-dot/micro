import React from 'react';
import { LayoutDashboard, Wrench, Package, Users, DollarSign, FileText, ShoppingCart, Settings as SettingsIcon, Truck, Sparkles, FileOutput, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Staff, AppSettings } from '../types';
import { ROLE_ACCESS_CONFIG } from '../services/initialData';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  currentUser: Staff | null;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  settings: AppSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, onLogout, isCollapsed, toggleSidebar, settings }) => {
  
  // Define menu items and map roles from configuration
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS System', icon: ShoppingCart },
    { id: 'quotations', label: 'Quotations / AI Invoice', icon: FileOutput },
    { id: 'jobs', label: 'Repair Tickets', icon: Wrench },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'purchases', label: 'Purchases (PO)', icon: Truck },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ].map(item => ({
    ...item,
    roles: ROLE_ACCESS_CONFIG[item.id]
  }));

  // Filter items based on current user role
  const visibleItems = menuItems.filter(item => {
    if (!currentUser) return false;
    if (!item.roles) return true;
    return item.roles.includes(currentUser.role);
  });

  return (
    <div 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white h-screen flex flex-col no-print fixed left-0 top-0 overflow-y-auto z-50 shadow-2xl transition-all duration-300 ease-in-out border-r border-slate-800`}
    >
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        {!isCollapsed && (
          <div className="animate-fadeIn flex items-center gap-3 overflow-hidden">
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain shrink-0" />
            ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40">
                  <Wrench size={16} />
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                <h1 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight whitespace-nowrap truncate">{settings.storeName}</h1>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider whitespace-nowrap font-semibold truncate">{settings.tagline || 'Repair Shop OS'}</p>
            </div>
          </div>
        )}
        {isCollapsed && (
           <div className="mx-auto font-bold text-blue-400 text-xl animate-fadeIn">
              {settings.logoUrl ? (
                 <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                 settings.storeName.charAt(0)
              )}
           </div>
        )}
        <button 
          onClick={toggleSidebar} 
          className={`text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all duration-200 ${isCollapsed ? 'hidden group-hover:block' : ''}`}
        >
          {isCollapsed ? '' : <ChevronLeft size={20} />}
        </button>
      </div>
      
      {/* Toggle button when collapsed (centered) */}
      {isCollapsed && (
         <div className="flex justify-center py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={toggleSidebar}>
             <ChevronRight size={20} className="text-slate-400" />
         </div>
      )}
      
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`
                w-full flex items-center 
                ${isCollapsed ? 'justify-center px-2' : 'justify-start px-4'} 
                py-3 rounded-xl transition-all duration-200 ease-out group relative overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-900/30 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-1'
                }
              `}
            >
              {/* Hover effect highlight */}
              <div className={`absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isActive ? 'hidden' : 'block'}`} />
              
              <Icon 
                size={20} 
                className={`
                  relative z-10 transition-transform duration-300 ease-out
                  ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110 group-hover:-rotate-6 text-slate-400 group-hover:text-blue-200'}
                  ${isCollapsed ? '' : 'mr-3'}
                `} 
              />
              
              {!isCollapsed && (
                <span className={`relative z-10 font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ${isActive ? 'translate-x-1 font-semibold' : 'group-hover:translate-x-0.5'}`}>
                  {item.label}
                </span>
              )}
              
              {/* Active right indicator dot (subtle) */}
              {isActive && !isCollapsed && (
                 <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-200 shadow-sm shadow-blue-400/50 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky bottom-0 z-10">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-4 transition-all duration-300`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold shadow-lg shadow-blue-900/20 border-2 border-slate-700 shrink-0 group hover:border-blue-400 transition-colors">
             <span className="group-hover:scale-110 transition-transform duration-200">{currentUser?.name.charAt(0)}</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-200 group-hover:text-white transition-colors">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.role}</p>
            </div>
          )}
        </div>
        <button 
           onClick={onLogout}
           title={isCollapsed ? "Sign Out" : ""}
           className={`w-full flex items-center justify-center ${isCollapsed ? '' : 'gap-2'} bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-red-100 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-red-900/20 active:scale-95 group`}
        >
           <LogOut size={16} className="transition-transform group-hover:rotate-12" /> {!isCollapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { JobSheet, InventoryItem, JobStatus, Sale, Staff } from '../types';
import { DollarSign, AlertCircle, Wrench, CheckCircle, ShoppingCart, Plus, ArrowUpRight, ArrowRight, Clock, Users, Package, Activity, Truck, CreditCard } from 'lucide-react';

interface DashboardProps {
  jobs: JobSheet[];
  inventory: InventoryItem[];
  sales: Sale[];
  setView: (view: string) => void;
  currentUser: Staff | null;
  onAction?: (action: string) => void;
}

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: string | number; icon: any; color: string; trend?: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all animate-fadeIn">
    <div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {trend && <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium"><ArrowUpRight size={12}/> {trend}</p>}
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform`}>
      <Icon className="text-white" size={24} />
    </div>
  </div>
);

const ActionCard = ({ title, desc, icon: Icon, color, onClick }: { title: string; desc: string; icon: any; color: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 text-left group hover:border-blue-500 hover:shadow-md transition-all animate-fadeIn"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-lg shadow-blue-900/10 group-hover:scale-110 transition-transform shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="flex-1 overflow-hidden">
      <h4 className="font-bold text-slate-800 text-sm truncate">{title}</h4>
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">{desc}</p>
    </div>
    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
  </button>
);

export const Dashboard: React.FC<DashboardProps> = ({ jobs, inventory, sales, setView, currentUser, onAction }) => {
  // Fix: COMPLETED and DELIVERED exist on expanded JobStatus
  const activeJobs = jobs.filter(j => j.status !== JobStatus.COMPLETED && j.status !== JobStatus.DELIVERED && j.status !== JobStatus.CANCELLED).length;
  const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED).length;
  const lowStockItems = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;
  const pendingJobs = jobs.filter(j => j.status === JobStatus.PENDING).length;
  
  // Calculate Finances
  const jobRevenue = jobs.reduce((acc, job) => acc + (job.finalCost || job.estimatedCost || 0), 0);
  const salesRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalRevenue = jobRevenue + salesRevenue;

  // Role Based Logic
  const userRole = currentUser?.role;
  const canViewFinancials = userRole === 'Admin' || userRole === 'Manager';
  
  // Recent Activity Feed (Merge Jobs & Sales based on role)
  let activities = [];
  
  if (canViewFinancials) {
      // Admins see Sales and Jobs
      activities = [
        ...jobs.map(j => ({ type: 'job', date: j.createdAt, data: j })),
        ...sales.map(s => ({ type: 'sale', date: s.date, data: s }))
      ];
  } else {
      // Techs/Others only see Jobs
      activities = jobs.map(j => ({ type: 'job', date: j.createdAt, data: j }));
  }
  
  activities = activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Generate Last 7 Days Data
  const getChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().split('T')[0];
       
       const dayJobsCreated = jobs.filter(j => j.createdAt.startsWith(dateStr)).length;
       const dayJobsCompleted = jobs.filter(j => j.history.some(h => h.status === JobStatus.COMPLETED && h.date.startsWith(dateStr))).length;

       if (canViewFinancials) {
           const daySales = sales.filter(s => s.date.startsWith(dateStr)).reduce((acc, s) => acc + s.total, 0);
           data.push({
              name: d.toLocaleDateString('en-US', { weekday: 'short' }),
              revenue: daySales,
              jobs: dayJobsCreated
           });
       } else {
           // Non-financial chart data: Workload
           data.push({
              name: d.toLocaleDateString('en-US', { weekday: 'short' }),
              created: dayJobsCreated,
              completed: dayJobsCompleted
           });
       }
    }
    return data;
  };

  const chartData = getChartData();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard</h2>
            <p className="text-slate-500 font-medium mt-1 italic">Selamat datang kembali, {currentUser?.name}. Berikut ringkasan hari ini.</p>
         </div>
         <div className="flex gap-2 text-xs font-black uppercase text-slate-400 bg-white px-4 py-2 rounded-xl border shadow-sm tracking-widest">
            <Clock size={14} className="mt-0.5" /> {new Date().toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
         </div>
      </div>

      {/* Pintas Pantas (Quick Actions) */}
      <div className="space-y-4">
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Pintas Pantas</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard 
               title="Tiket Baru" 
               desc="Buka Kerja Baiki" 
               icon={Wrench} 
               color="bg-blue-600" 
               onClick={() => onAction?.('newJob')}
            />
            <ActionCard 
               title="Tambah Stok" 
               desc="Inventori & Part" 
               icon={Package} 
               color="bg-emerald-600" 
               onClick={() => onAction?.('addInventory')}
            />
            <ActionCard 
               title="Buat PO" 
               desc="Pesanan Pembelian" 
               icon={Truck} 
               color="bg-indigo-600" 
               onClick={() => onAction?.('createPO')}
            />
            <ActionCard 
               title="Bayar Job" 
               desc="POS & Kutipan" 
               icon={CreditCard} 
               color="bg-purple-600" 
               onClick={() => onAction?.('payJob')}
            />
         </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {canViewFinancials ? (
            <StatCard title="Jumlah Pendapatan" value={`RM${totalRevenue.toFixed(0)}`} icon={DollarSign} color="bg-gradient-to-br from-green-500 to-emerald-700" trend="+12% vs last week" />
        ) : (
            <StatCard title="Repairs Menunggu" value={pendingJobs} icon={Clock} color="bg-gradient-to-br from-orange-400 to-orange-600" />
        )}
        
        <StatCard title="Jobs Aktif" value={activeJobs} icon={Wrench} color="bg-gradient-to-br from-blue-500 to-indigo-700" />
        <StatCard title="Stok Rendah" value={lowStockItems} icon={AlertCircle} color="bg-gradient-to-br from-red-500 to-pink-700" />
        <StatCard title="Jobs Selesai" value={completedJobs} icon={CheckCircle} color="bg-gradient-to-br from-purple-500 to-violet-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
             {canViewFinancials ? <DollarSign size={18} className="text-blue-500"/> : <Activity size={18} className="text-blue-500"/>} 
             {canViewFinancials ? "Analisis Pendapatan" : "Analisis Beban Kerja"}
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              {canViewFinancials ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                     contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="created" name="Dibuat" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
             <Activity size={18} className="text-blue-500" /> Aktiviti Terkini
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activity.type === 'job' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                   {activity.type === 'job' ? <Wrench size={18} /> : <ShoppingCart size={18} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">
                     {activity.type === 'job' ? (activity.data as JobSheet).customer.name : 'Jualan POS'}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                     {activity.type === 'job' ? `${(activity.data as JobSheet).device.brand} ${(activity.data as JobSheet).device.model}` : `Invoice #${(activity.data as Sale).id}`}
                  </p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-slate-700">
                      RM{activity.type === 'job' ? ((activity.data as JobSheet).finalCost || (activity.data as JobSheet).estimatedCost) : (activity.data as Sale).total}
                   </p>
                   <p className="text-[10px] text-slate-400 mt-0.5">{new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
             onClick={() => setView(canViewFinancials ? 'reports' : 'jobs')}
             className="mt-6 w-full py-3 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
          >
             Lihat Semua <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

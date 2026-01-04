
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, syncItem, fetchAllFromSupabase } from './services/supabaseClient';
import { Profile, JobStatus, RepairJob, Customer, AppSettings, Staff, JobSheet, InventoryItem, Sale, Quotation, ExpenseDocument, Supplier, PurchaseOrder } from './types';
import { 
  LayoutDashboard, Users, Wrench, Settings as SettingsIcon, LogOut, 
  Loader2, Sparkles, Plus, Search, Database, Terminal, Copy, Check, Info, FileText
} from 'lucide-react';
import { INITIAL_STAFF, INITIAL_SETTINGS, INITIAL_JOBS, INITIAL_INVENTORY_DATA, INITIAL_CUSTOMERS, INITIAL_EXPENSES } from './services/initialData';
import { getStoreData, saveStoreData, getSettings, saveSettings } from './services/db';

// Sidebar component
import { Sidebar } from './components/Sidebar';

// View components
import { Dashboard as XtraDashboard } from './views/Dashboard';
import { Jobs as XtraJobs } from './views/Jobs';
import { Customers as XtraCustomers } from './views/Customers';
import { Reports } from './views/Reports';
import { POS } from './views/POS';
import { Inventory } from './views/Inventory';
import { Settings } from './views/Settings';
import { Expenses } from './views/Expenses';
import { Quotations } from './views/Quotations';
import { Purchases } from './views/Purchases';
import { LandingPage } from './views/LandingPage';
import { OrderTracking } from './views/OrderTracking';
import { Login } from './views/Login';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [landingMode, setLandingMode] = useState<'home' | 'login' | 'tracking'>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Pending Action state for Dashboard shortcuts
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Global Application State
  const [jobs, setJobs] = useState<JobSheet[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDocument[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Load individual data source with local fallback
  const loadSource = async <T,>(key: string, supabaseTable: string, initialData: T[]) => {
    try {
      const sbData = await fetchAllFromSupabase<T>(supabaseTable);
      if (sbData && sbData.length > 0) {
        return sbData;
      }
    } catch (e) {
      // Supabase failed, proceed to local storage
    }
    
    const idbData = await getStoreData<T>(key as any);
    return (idbData && idbData.length > 0) ? idbData : initialData;
  };

  useEffect(() => {
    const loadAllData = async () => {
        try {
            // Load sources individually to prevent one failure blocking all
            const [j, i, st, sa, ex, qu, su, po, cu] = await Promise.all([
                loadSource<JobSheet>('jobs', 'repair_jobs', INITIAL_JOBS),
                loadSource<InventoryItem>('inventory', 'inventory', INITIAL_INVENTORY_DATA),
                loadSource<Staff>('staff', 'staff', INITIAL_STAFF),
                loadSource<Sale>('sales', 'sales', []),
                loadSource<ExpenseDocument>('expenses', 'expenses', INITIAL_EXPENSES),
                loadSource<Quotation>('quotations', 'quotations', []),
                loadSource<Supplier>('suppliers', 'suppliers', []),
                loadSource<PurchaseOrder>('purchaseOrders', 'purchase_orders', []),
                loadSource<Customer>('customers', 'customers', INITIAL_CUSTOMERS)
            ]);

            setJobs(j);
            setInventory(i);
            setStaff(st);
            setSales(sa);
            setExpenses(ex);
            setQuotations(qu);
            setSuppliers(su);
            setPurchaseOrders(po);
            setCustomers(cu);

            // Handle Settings specifically
            try {
              const { data: setRes } = await supabase.from('app_settings').select('payload').eq('id', 'main').maybeSingle();
              if (setRes?.payload) {
                setSettings(setRes.payload);
              } else {
                const idb = await getSettings();
                if (idb) setSettings(idb);
              }
            } catch (err) {
              const idb = await getSettings();
              if (idb) setSettings(idb);
            }

        } catch (err) {
            console.error("Initialization error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    loadAllData();

    // Set up real-time subscriptions for collaboration
    const channels = [
      supabase.channel('jobs-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'repair_jobs' }, (payload) => { if (payload.new?.payload) setJobs(prev => { const other = prev.filter(j => j.id !== payload.new.id); return [...other, payload.new.payload]; })}),
      supabase.channel('inventory-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => { if (payload.new?.payload) setInventory(prev => { const other = prev.filter(i => i.id !== payload.new.id); return [...other, payload.new.payload]; })}),
      supabase.channel('customers-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => { if (payload.new?.payload) setCustomers(prev => { const other = prev.filter(c => c.id !== payload.new.id); return [...other, payload.new.payload]; })})
    ].map(c => c.subscribe());

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  // Sync state to local and remote storage
  useEffect(() => { if (!isLoading && jobs.length > 0) { saveStoreData('jobs', jobs); syncItem('repair_jobs', jobs[0].id, jobs[0]); } }, [jobs, isLoading]);
  useEffect(() => { if (!isLoading && inventory.length > 0) { saveStoreData('inventory', inventory); inventory.slice(0, 5).forEach(item => syncItem('inventory', item.id, item)); } }, [inventory, isLoading]);
  useEffect(() => { if (!isLoading && customers.length > 0) { saveStoreData('customers', customers); syncItem('customers', customers[0].id, customers[0]); } }, [customers, isLoading]);
  useEffect(() => { if (!isLoading && sales.length > 0) { saveStoreData('sales', sales); syncItem('sales', sales[sales.length - 1].id, sales[sales.length - 1]); } }, [sales, isLoading]);
  useEffect(() => { if (!isLoading) { saveSettings(settings); syncItem('app_settings', 'main', settings); } }, [settings, isLoading]);

  const addSale = (sale: Sale) => setSales(prev => [...prev, sale]);
  const handleLogout = () => {
    setCurrentUser(null);
    setLandingMode('home');
  };

  const handleDashboardAction = (action: string) => {
    setPendingAction(action);
    switch(action) {
       case 'newJob': setCurrentView('jobs'); break;
       case 'addInventory': setCurrentView('inventory'); break;
       case 'createPO': setCurrentView('purchases'); break;
       case 'payJob': setCurrentView('pos'); break;
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin text-cyan-500" size={48} /></div>;

  if (!currentUser) {
    if (landingMode === 'login') {
      return <Login staff={staff} settings={settings} onLogin={setCurrentUser} onBack={() => setLandingMode('home')} />;
    }
    if (landingMode === 'tracking') {
      return <OrderTracking jobs={jobs} settings={settings} onBack={() => setLandingMode('home')} />;
    }
    return <LandingPage settings={settings} onLoginClick={() => setLandingMode('login')} onTrackClick={() => setLandingMode('tracking')} />;
  }

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <XtraDashboard jobs={jobs} inventory={inventory} sales={sales} setView={setCurrentView} currentUser={currentUser} onAction={handleDashboardAction} />;
      case 'pos': return <POS inventory={inventory} setInventory={setInventory} addSale={addSale} sales={sales} settings={settings} setSettings={setSettings} customers={customers} setCustomers={setCustomers} jobs={jobs} setJobs={setJobs} setQuotations={setQuotations} autoOpenJobPay={pendingAction === 'payJob'} onModalHandled={() => setPendingAction(null)} />;
      case 'jobs': return <XtraJobs jobs={jobs} setJobs={setJobs} staff={staff} settings={settings} addSale={addSale} inventory={inventory} customers={customers} currentUser={currentUser} setView={setCurrentView} autoOpenNew={pendingAction === 'newJob'} onJobCreationHandled={() => setPendingAction(null)} />;
      case 'customers': return <XtraCustomers customers={customers} setCustomers={setCustomers} jobs={jobs} sales={sales} settings={settings} onNewJobForCustomer={(id) => { setCurrentView('jobs'); }} />;
      case 'inventory': return <Inventory items={inventory} setItems={setInventory} settings={settings} currentUser={currentUser} autoOpenAdd={pendingAction === 'addInventory'} onModalHandled={() => setPendingAction(null)} />;
      case 'purchases': return <Purchases suppliers={suppliers} setSuppliers={setSuppliers} orders={purchaseOrders} setOrders={setPurchaseOrders} inventory={inventory} setInventory={setInventory} settings={settings} autoOpenOrder={pendingAction === 'createPO'} onModalHandled={() => setPendingAction(null)} />;
      case 'expenses': return <Expenses settings={settings} documents={expenses} setDocuments={setExpenses} />;
      case 'quotations': return <Quotations quotations={quotations} setQuotations={setQuotations} inventory={inventory} customers={customers} settings={settings} setSettings={setSettings} addSale={addSale} sales={sales} />;
      case 'reports': return <Reports jobs={jobs} setJobs={setJobs} inventory={inventory} sales={sales} setSales={setSales} expenses={expenses} setExpenses={setExpenses} settings={settings} staff={staff} />;
      case 'settings': return <Settings settings={settings} setSettings={setSettings} staff={staff} setStaff={setStaff} onBackup={() => JSON.stringify({ jobs, inventory, staff, sales, expenses, quotations, suppliers, purchaseOrders, customers, settings })} onRestore={(json) => { const d = JSON.parse(json); if(d.jobs) setJobs(d.jobs); if(d.inventory) setInventory(d.inventory); if(d.staff) setStaff(d.staff); if(d.sales) setSales(d.sales); if(d.settings) setSettings(d.settings); }} onReset={() => {}} currentUser={currentUser} onLogout={handleLogout} />;
      default: return <XtraDashboard jobs={jobs} inventory={inventory} sales={sales} setView={setCurrentView} currentUser={currentUser} onAction={handleDashboardAction} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        settings={settings}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} p-10 overflow-y-auto min-h-screen`}>
        {renderView()}
      </main>
    </div>
  );
}

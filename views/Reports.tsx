import React, { useState, useEffect } from 'react';
import { JobSheet, InventoryItem, JobStatus, Sale, AppSettings, ExpenseDocument, TaxReliefItem, Staff, FinancialAdjustments } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag, Download, Archive, CreditCard, Calendar, Building, FileText, Scale, Calculator, HelpCircle, AlertTriangle, AlertCircle, Users, BarChart3, Pencil, Trash2, X, Save, Edit3, Upload, Database, FileDown, FileUp, Coins, Receipt, Info } from 'lucide-react';

interface ReportsProps {
  jobs: JobSheet[];
  setJobs: React.Dispatch<React.SetStateAction<JobSheet[]>>;
  inventory: InventoryItem[];
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  expenses?: ExpenseDocument[];
  setExpenses?: React.Dispatch<React.SetStateAction<ExpenseDocument[]>>;
  staff?: Staff[];
}

const TAX_BRACKETS = [
  { limit: 5000, rate: 0, baseTax: 0 },
  { limit: 20000, rate: 0.01, baseTax: 0 },
  { limit: 35000, rate: 0.03, baseTax: 150 },
  { limit: 50000, rate: 0.08, baseTax: 600 },
  { limit: 70000, rate: 0.13, baseTax: 1800 },
  { limit: 100000, rate: 0.21, baseTax: 4400 },
  { limit: 250000, rate: 0.24, baseTax: 10700 },
  { limit: 400000, rate: 0.245, baseTax: 46700 },
  { limit: 600000, rate: 0.25, baseTax: 83450 },
  { limit: 2000000, rate: 0.26, baseTax: 133450 },
  { limit: Infinity, rate: 0.30, baseTax: 497450 }
];

const TAX_RELIEFS_CONFIG: TaxReliefItem[] = [
  { id: 'self', label: '1. Individu / Diri Sendiri', maxLimit: 9000, value: 9000 },
  { id: 'parents_medical', label: '2. Perbelanjaan rawatan perubatan ibu bapa', maxLimit: 8000, value: 0 },
  { id: 'basic_equipment', label: '3. Peralatan sokongan asas (OKU)', maxLimit: 6000, value: 0 },
  { id: 'disabled_self', label: '4. Individu yang kurang upaya (OKU)', maxLimit: 6000, value: 0 },
  { id: 'education_fees', label: '5. Yuran pengajian (Sendiri)', maxLimit: 7000, value: 0 },
  { id: 'medical_serious', label: '6. Perbelanjaan perubatan penyakit serius / kesuburan', maxLimit: 8000, value: 0 },
  { id: 'lifestyle', label: '7. Gaya Hidup (PC, Buku, Gym, Internet)', maxLimit: 2500, value: 0 },
  { id: 'lifestyle_tech', label: '8. Gaya Hidup Tambahan (Tech for Home/School)', maxLimit: 2500, value: 0 },
  { id: 'breastfeeding', label: '9. Peralatan penyusuan ibu (2 tahun sekali)', maxLimit: 1000, value: 0 },
  { id: 'child_care', label: '10. Yuran taska / tadika (Anak < 6 tahun)', maxLimit: 3000, value: 0 },
  { id: 'sspn', label: '11. Tabungan bersih SSPN', maxLimit: 8000, value: 0 },
  { id: 'alimony', label: '12. Suami / Isteri / Alimoni bekas isteri', maxLimit: 4000, value: 0 },
  { id: 'disabled_spouse', label: '13. Suami / Isteri kurang upaya', maxLimit: 5000, value: 0 },
  { id: 'child_under_18', label: '14. Anak di bawah umur 18 tahun (RM2,000 per anak)', maxLimit: 50000, value: 0 },
  { id: 'child_over_18', label: '15. Anak 18+ masih belajar (Diploma+)', maxLimit: 50000, value: 0 },
  { id: 'life_insurance', label: '16. Insurans Nyawa & KWSP (Penjawat Awam)', maxLimit: 7000, value: 0 },
  { id: 'epf', label: '17. Insurans Nyawa & KWSP (Swasta)', maxLimit: 4000, value: 0 },
  { id: 'education_medical_insurance', label: '18. Insurans Pendidikan & Perubatan', maxLimit: 3000, value: 0 },
  { id: 'prs', label: '19. Skim Persaraan Swasta (PRS)', maxLimit: 3000, value: 0 },
  { id: 'socso', label: '20. PERKESO (SOCSO)', maxLimit: 350, value: 0 },
  { id: 'sports', label: '21. Peralatan Sukan', maxLimit: 500, value: 0 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Reports: React.FC<ReportsProps> = ({ jobs, setJobs, inventory, sales, setSales, settings, setSettings, expenses = [], setExpenses, staff = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'drawer' | 'inventory_sales' | 'profit_loss' | 'staff_perf' | 'financial' | 'tax_zakat' | 'data_mgmt'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleFormData, setSaleFormData] = useState<Partial<Sale>>({});
  const [showFinancialEdit, setShowFinancialEdit] = useState(false);
  const [finFormData, setFinFormData] = useState<FinancialAdjustments>({
     fixedAssets: settings.financialAdjustments?.fixedAssets || 0,
     otherCurrentAssets: settings.financialAdjustments?.otherCurrentAssets || 0,
     currentLiabilities: settings.financialAdjustments?.currentLiabilities || 0
  });

  const [taxIncome, setTaxIncome] = useState<number>(0);
  const [zakatPaid, setZakatPaid] = useState<number>(0);
  const [reliefs, setReliefs] = useState<Record<string, number>>(
     TAX_RELIEFS_CONFIG.reduce((acc, item) => ({ ...acc, [item.id]: item.value }), {})
  );

  useEffect(() => {
     if (activeTab === 'tax_zakat') {
        const totalSales = sales.reduce((acc: number, s: Sale) => acc + s.total, 0);
        const totalExpenses = expenses.reduce((acc: number, e: ExpenseDocument) => acc + e.amount, 0);
        setTaxIncome(Math.max(0, totalSales - totalExpenses));
     }
  }, [activeTab, sales, expenses]);

  // Logic Helpers
  const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED || j.status === JobStatus.DELIVERED);
  const serviceRevenue = completedJobs.reduce((acc: number, job: JobSheet) => acc + (job.finalCost || job.estimatedCost), 0);
  const salesRevenue = sales.reduce((acc: number, sale: Sale) => acc + sale.total, 0);
  const totalRevenue = serviceRevenue + salesRevenue;

  const revenueData = [
    { name: 'Services', value: serviceRevenue },
    { name: 'Retail', value: salesRevenue },
  ];

  const cashSales = sales.filter(s => s.paymentMethod === 'Cash').reduce((a, b) => a + b.total, 0);
  const cardSales = sales.filter(s => s.paymentMethod === 'Card').reduce((a, b) => a + b.total, 0);
  const transferSales = sales.filter(s => s.paymentMethod === 'Transfer').reduce((a, b) => a + b.total, 0);

  const calculateFinancials = () => {
      const inventoryValue = inventory.reduce((sum: number, item) => sum + (item.quantity * item.costPrice), 0);
      const tradeDebtors = jobs.filter(j => j.status !== JobStatus.CANCELLED).reduce((sum: number, job) => {
          const total = job.finalCost || job.estimatedCost;
          const paid = job.advanceAmount;
          return sum + Math.max(0, total - paid);
      }, 0);
      const totalSalesAll = sales.reduce((sum: number, s) => sum + s.total, 0);
      const totalExpAll = expenses.reduce((sum: number, e) => sum + e.amount, 0);
      const cashBalance = Math.max(0, totalSalesAll - totalExpAll); 
      
      const fixedAssets = settings.financialAdjustments?.fixedAssets || 0; 
      const otherCurrentAssets = settings.financialAdjustments?.otherCurrentAssets || 0;
      const currentLiabilities = settings.financialAdjustments?.currentLiabilities || 0;

      const totalCurrentAssets = cashBalance + tradeDebtors + inventoryValue + otherCurrentAssets; 
      const totalAssets = fixedAssets + totalCurrentAssets;
      const totalEquity = totalAssets - currentLiabilities;

      return { fixedAssets, cashBalance, tradeDebtors, inventoryValue, otherCurrentAssets, totalCurrentAssets, totalAssets, currentLiabilities, totalEquity };
  };

  const financials = calculateFinancials();

  const calculateProfitLoss = () => {
     const start = new Date(dateRange.start);
     const end = new Date(dateRange.end);
     end.setHours(23, 59, 59);

     const periodSales = sales.filter(s => {
        const d = new Date(s.date);
        return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
     });
     const salesRev = periodSales.reduce((acc: number, s) => acc + s.total, 0);

     const periodJobs = jobs.filter(j => {
        const d = new Date(j.createdAt);
        return d.getTime() >= start.getTime() && d.getTime() <= end.getTime() && (j.status === JobStatus.COMPLETED || j.status === JobStatus.DELIVERED);
     });
     const serviceRev = periodJobs.reduce((acc: number, j) => acc + (j.finalCost || j.estimatedCost), 0);

     const cogs = periodSales.reduce((total: number, sale) => {
        return total + sale.items.reduce((itemTotal, item) => {
           const invItem = inventory.find(i => i.id === item.inventoryItemId);
           return itemTotal + ((invItem?.costPrice || 0) * item.quantity);
        }, 0);
     }, 0);

     const periodExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
     });
     const totalExp = periodExpenses.reduce((acc: number, e) => acc + e.amount, 0);

     const grossProfit = (salesRev + serviceRev) - cogs;
     const netProfit = grossProfit - totalExp;

     return { salesRev, serviceRev, cogs, totalExp, grossProfit, netProfit, periodExpenses };
  };

  const pl = calculateProfitLoss();

  const staffPerf = staff.map(s => {
     const completed = jobs.filter(j => j.assignedTechnicianId === s.id && (j.status === JobStatus.COMPLETED || j.status === JobStatus.DELIVERED));
     const revenue = completed.reduce((acc: number, j) => acc + (j.finalCost || j.estimatedCost), 0);
     return { name: s.name, role: s.role, jobs: completed.length, revenue };
  }).sort((a, b) => b.revenue - a.revenue);

  const calculateTax = () => {
     const totalRelief = (Object.values(reliefs) as number[]).reduce((a, b) => a + b, 0);
     const chargeableIncome = Math.max(0, (taxIncome || 0) - (totalRelief || 0));
     
     let baseTax = 0;
     let taxOnBalance = 0;
     let bracketRate = 0;
     let bracketLimit = 0;

     for (let i = 0; i < TAX_BRACKETS.length; i++) {
        const bracket = TAX_BRACKETS[i];
        const prevLimit = i > 0 ? (TAX_BRACKETS[i-1]?.limit || 0) : 0;
        
        if (chargeableIncome <= bracket.limit) {
           baseTax = bracket.baseTax;
           const balance = chargeableIncome - prevLimit;
           bracketRate = bracket.rate;
           bracketLimit = prevLimit;
           taxOnBalance = Math.max(0, balance * bracket.rate);
           break;
        }
     }

     let rebate = chargeableIncome <= 35000 ? 400 : 0;
     let finalTax = Math.max(0, baseTax + taxOnBalance - rebate - zakatPaid);

     return { totalRelief, chargeableIncome, baseTax, taxOnBalance, bracketRate, bracketLimit, rebate, finalTax };
  };

  const taxResult = calculateTax();

  const calculateZakatBusiness = () => {
     const netCurrentAssets = financials.totalCurrentAssets - financials.currentLiabilities;
     const nisab = 24000; // Sample nisab in RM
     const isSubjectToZakat = netCurrentAssets >= nisab;
     const zakatAmount = isSubjectToZakat ? netCurrentAssets * 0.025 : 0;
     return { netCurrentAssets, nisab, isSubjectToZakat, zakatAmount };
  };

  const zakatBusiness = calculateZakatBusiness();

  // --- CSV DATA TOOLS LOGIC ---
  const downloadCSV = (content: string, filename: string) => {
     const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = filename;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const exportSales = () => {
     const headers = ['InvoiceID', 'Date', 'Total', 'Tax', 'Subtotal', 'PaymentMethod', 'Status'];
     const rows = sales.map(s => [s.id, s.date, s.total, s.tax, s.subtotal, s.paymentMethod, s.status]);
     const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
     downloadCSV(csvContent, `SalesLog_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportExpenses = () => {
     const headers = ['ID', 'Date', 'Category', 'Description', 'Amount'];
     const rows = expenses.map(e => [e.id, e.date, e.category, `"${e.description.replace(/"/g, '""')}"`, e.amount]);
     const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
     downloadCSV(csvContent, `ExpensesLog_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportJobs = () => {
     const headers = ['JobID', 'CreatedAt', 'Customer', 'Device', 'Issue', 'Status', 'Cost'];
     const rows = jobs.map(j => [j.id, j.createdAt, `"${j.customer.name}"`, `"${j.device.brand} ${j.device.model}"`, `"${j.issueDescription.replace(/"/g, '""')}"`, j.status, (j.finalCost || j.estimatedCost)]);
     const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
     downloadCSV(csvContent, `JobsHistory_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImportSales = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const newSales: Sale[] = [];
        for (let i = 1; i < lines.length; i++) {
           const cols = lines[i].split(',');
           if (cols.length >= 6) {
              newSales.push({
                 id: cols[0],
                 date: cols[1],
                 total: parseFloat(cols[2]),
                 tax: parseFloat(cols[3]),
                 subtotal: parseFloat(cols[4]),
                 paymentMethod: cols[5] as any,
                 items: [], 
                 status: (cols[6] || 'Completed') as any,
                 template: 'modern'
              });
           }
        }
        if (newSales.length > 0) {
           setSales(prev => [...prev, ...newSales]);
           alert(`Imported ${newSales.length} sales records.`);
        }
     };
     reader.readAsText(file);
  };

  const handleImportExpenses = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const newExp: ExpenseDocument[] = [];
        for (let i = 1; i < lines.length; i++) {
           const cols = lines[i].split(',');
           if (cols.length >= 5) {
              newExp.push({
                 id: cols[0] || `EXP-${Date.now()}-${i}`,
                 date: cols[1],
                 category: cols[2] as any,
                 description: cols[3].replace(/"/g, ''),
                 amount: parseFloat(cols[4]),
                 imageUrl: ''
              });
           }
        }
        if (newExp.length > 0) {
           if (setExpenses) setExpenses(prev => [...prev, ...newExp]);
           alert(`Imported ${newExp.length} expenses.`);
        }
     };
     reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
        <div className="flex bg-white rounded-lg shadow-sm border p-1 overflow-x-auto max-w-full">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Overview</button>
            <button onClick={() => setActiveTab('profit_loss')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'profit_loss' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Profit & Loss</button>
            <button onClick={() => setActiveTab('staff_perf')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'staff_perf' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Staff Perf.</button>
            <button onClick={() => setActiveTab('sales')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'sales' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Sales Log</button>
            <button onClick={() => setActiveTab('drawer')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'drawer' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Drawer</button>
            <button onClick={() => setActiveTab('financial')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'financial' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Balance Sheet</button>
            <button onClick={() => setActiveTab('tax_zakat')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'tax_zakat' ? 'bg-green-50 text-green-600' : 'text-slate-500'}`}>Tax & Zakat</button>
            <button onClick={() => setActiveTab('data_mgmt')} className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'data_mgmt' ? 'bg-slate-100 text-slate-800' : 'text-slate-500'}`}>Import/Export</button>
        </div>
      </div>

      {activeTab === 'tax_zakat' && (
         <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
            {/* Income Tax Estimator */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="bg-slate-50 p-6 border-b border-slate-200">
                  <div className="flex justify-between items-center">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calculator size={20} className="text-blue-600"/> Income Tax Estimation</h3>
                        <p className="text-sm text-slate-500">Based on Inland Revenue Board of Malaysia (LHDN) individual brackets.</p>
                     </div>
                     <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        Assessment Year 2023/24
                     </div>
                  </div>
               </div>
               
               <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                     <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Annual Gross Profit</label>
                              <div className="relative">
                                 <span className="absolute left-3 top-3 text-slate-400 font-bold">{settings.currency}</span>
                                 <input 
                                    type="number" 
                                    className="w-full pl-12 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 font-black text-slate-800 text-xl shadow-inner bg-white" 
                                    value={taxIncome} 
                                    onChange={e => setTaxIncome(parseFloat(e.target.value) || 0)}
                                 />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 italic">* Auto-calculated from Sales minus Expenses.</p>
                           </div>
                           <div>
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Zakat Paid (Rebate)</label>
                              <div className="relative">
                                 <span className="absolute left-3 top-3 text-slate-400 font-bold">{settings.currency}</span>
                                 <input 
                                    type="number" 
                                    className="w-full pl-12 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 font-black text-green-700 text-xl shadow-inner bg-white" 
                                    value={zakatPaid} 
                                    onChange={e => setZakatPaid(parseFloat(e.target.value) || 0)}
                                 />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 italic">* Deducted directly from final tax due.</p>
                           </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                           <h4 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                              <Receipt size={16} className="text-blue-500"/> Pelepasan Cukai (Reliefs)
                           </h4>
                           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin">
                              {TAX_RELIEFS_CONFIG.map(item => (
                                 <div key={item.id} className="flex justify-between items-center group">
                                    <span className="text-xs text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                       <span className="text-[10px] text-slate-400 font-bold italic">Max: RM{item.maxLimit.toLocaleString()}</span>
                                       <input 
                                          type="number" 
                                          className="w-24 p-1.5 border rounded-lg text-right text-sm font-bold text-blue-700 bg-white" 
                                          value={reliefs[item.id]} 
                                          onChange={e => setReliefs({...reliefs, [item.id]: Math.min(item.maxLimit, parseFloat(e.target.value) || 0)})}
                                       />
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center font-bold text-slate-800">
                              <span>Total Tax Reliefs</span>
                              <span className="text-blue-600">{settings.currency}{taxResult.totalRelief.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assessment Result</p>
                           
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                 <span className="text-slate-400">Chargeable Income</span>
                                 <span className="font-bold">{settings.currency}{taxResult.chargeableIncome.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                 <span className="text-slate-400">Base Tax</span>
                                 <span className="font-bold">{settings.currency}{taxResult.baseTax.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                 <span className="text-slate-400">Tax on Balance ({(taxResult.bracketRate * 100).toFixed(1)}%)</span>
                                 <span className="font-bold">{settings.currency}{taxResult.taxOnBalance.toFixed(2)}</span>
                              </div>
                              {taxResult.rebate > 0 && (
                                 <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-green-400">Tax Rebate</span>
                                    <span className="font-bold text-green-400">-{settings.currency}{taxResult.rebate}</span>
                                 </div>
                              )}
                              {zakatPaid > 0 && (
                                 <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-green-400">Zakat Rebate</span>
                                    <span className="font-bold text-green-400">-{settings.currency}{zakatPaid.toLocaleString()}</span>
                                 </div>
                              )}
                           </div>

                           <div className="mt-8 pt-6 border-t-2 border-dashed border-white/20">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Final Tax Payable</p>
                              <p className="text-4xl font-black text-blue-400">{settings.currency}{taxResult.finalTax.toLocaleString()}</p>
                           </div>
                        </div>

                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start gap-3">
                           <Info className="text-blue-500 shrink-0 mt-1" size={18}/>
                           <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                              This estimator uses standard individual tax rates. For official filing, please refer to <b>MyTax LHDN</b>. Relief values are limited to Malaysian individual tax regulations for the 2023 Assessment Year.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Zakat on Business Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
               <div className="bg-green-50 p-6 border-b border-green-100">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Coins size={20} className="text-green-600"/> Zakat on Business Estimator</h3>
                  <p className="text-sm text-slate-500">Working Capital Method: (Current Assets - Current Liabilities) x 2.5%</p>
               </div>
               <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                           <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Calculation Data</h4>
                           <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                 <span className="text-slate-600">Total Current Assets</span>
                                 <span className="font-bold text-slate-800">{settings.currency}{financials.totalCurrentAssets.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                 <span className="text-slate-600">Total Current Liabilities</span>
                                 <span className="font-bold text-slate-800">({settings.currency}{financials.currentLiabilities.toLocaleString()})</span>
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between font-bold">
                                 <span className="text-slate-800">Net Current Assets</span>
                                 <span className="text-blue-600">{settings.currency}{zakatBusiness.netCurrentAssets.toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                           <AlertTriangle className="text-yellow-600" size={20}/>
                           <div className="text-xs text-yellow-800 font-medium">
                              Current Nisab Value: <b>{settings.currency}{zakatBusiness.nisab.toLocaleString()}</b>
                              <p className="mt-0.5 opacity-80">You are only required to pay Zakat if Net Assets exceeds Nisab.</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col justify-center items-center text-center p-8 bg-green-50 rounded-3xl border-2 border-green-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-green-200 -rotate-12">
                           <Coins size={120}/>
                        </div>
                        <div className="relative z-10">
                           <p className="text-sm font-black text-green-700 uppercase tracking-widest mb-2">Estimated Zakat Due</p>
                           <p className="text-5xl font-black text-green-900 mb-4">{settings.currency}{zakatBusiness.zakatAmount.toLocaleString()}</p>
                           <div className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block ${zakatBusiness.isSubjectToZakat ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                              {zakatBusiness.isSubjectToZakat ? 'Subject to Zakat' : 'Below Nisab Threshold'}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'data_mgmt' && (
         <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-4 mb-8 border-b pb-6">
                  <div className="bg-slate-100 p-3 rounded-xl text-slate-600"><Database size={32}/></div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">CSV Data Portal</h3>
                     <p className="text-sm text-slate-500">Manage large datasets by exporting to spreadsheets or importing from external files.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export Section */}
                  <div className="space-y-6">
                     <h4 className="font-bold text-slate-700 flex items-center gap-2"><FileDown size={20} className="text-blue-600"/> Export Collections</h4>
                     <div className="grid grid-cols-1 gap-3">
                        <button onClick={exportSales} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><ShoppingBag size={18}/></div>
                              <div className="text-left"><p className="font-bold text-sm">Export Sales Log</p><p className="text-xs text-slate-400">{sales.length} transactions</p></div>
                           </div>
                           <Download size={18} className="text-slate-400 group-hover:text-blue-600"/>
                        </button>
                        <button onClick={exportExpenses} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg text-red-600 shadow-sm"><DollarSign size={18}/></div>
                              <div className="text-left"><p className="font-bold text-sm">Export Expenses</p><p className="text-xs text-slate-400">{expenses.length} records</p></div>
                           </div>
                           <Download size={18} className="text-slate-400 group-hover:text-red-600"/>
                        </button>
                        <button onClick={exportJobs} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm"><Archive size={18}/></div>
                              <div className="text-left"><p className="font-bold text-sm">Export Repair Jobs</p><p className="text-xs text-slate-400">{jobs.length} tickets</p></div>
                           </div>
                           <Download size={18} className="text-slate-400 group-hover:text-purple-600"/>
                        </button>
                     </div>
                  </div>

                  {/* Import Section */}
                  <div className="space-y-6">
                     <h4 className="font-bold text-slate-700 flex items-center gap-2"><FileUp size={20} className="text-green-600"/> Batch Import</h4>
                     <div className="space-y-4">
                        <div className="p-5 bg-green-50 border border-green-100 rounded-2xl">
                           <p className="text-xs text-green-700 leading-relaxed mb-4 font-medium"><AlertCircle size={14} className="inline mr-1 mb-0.5"/> <b>Nota:</b> Pastikan susunan kolum CSV anda adalah tepat. Gunakan format eksport di sebelah sebagai rujukan template.</p>
                           
                           <div className="space-y-3">
                              <label className="block w-full text-center py-3 bg-white border-2 border-dashed border-green-200 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-100 transition-all font-bold text-sm text-green-700 shadow-sm">
                                 <Upload size={18} className="inline mr-2"/> Import Sales CSV
                                 <input type="file" accept=".csv" className="hidden" onChange={handleImportSales} />
                              </label>
                              <label className="block w-full text-center py-3 bg-white border-2 border-dashed border-green-200 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-100 transition-all font-bold text-sm text-green-700 shadow-sm">
                                 <Upload size={18} className="inline mr-2"/> Import Expenses CSV
                                 <input type="file" accept=".csv" className="hidden" onChange={handleImportExpenses} />
                              </label>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'overview' && (
         <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><div className="flex justify-between items-start"><div><p className="text-sm text-slate-500 font-medium">Total Revenue</p><h3 className="text-2xl font-bold text-slate-800 mt-1">{settings.currency}{totalRevenue.toFixed(2)}</h3></div><div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={20} /></div></div></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><div className="flex justify-between items-start"><div><p className="text-sm text-slate-500 font-medium">Service Revenue</p><h3 className="text-2xl font-bold text-slate-800 mt-1">{settings.currency}{serviceRevenue.toFixed(2)}</h3></div><div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={20} /></div></div></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><div className="flex justify-between items-start"><div><p className="text-sm text-slate-500 font-medium">Retail Sales</p><h3 className="text-2xl font-bold text-slate-800 mt-1">{settings.currency}{salesRevenue.toFixed(2)}</h3></div><div className="p-3 bg-green-50 text-green-600 rounded-lg"><ShoppingBag size={20} /></div></div></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
               <h3 className="text-lg font-bold mb-4">Revenue Breakdown</h3>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}/></BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      )}

      {activeTab === 'profit_loss' && (
         <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
               <Calendar size={18} className="text-slate-400" />
               <input type="date" className="border p-2 rounded text-sm bg-white text-slate-900" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
               <span className="text-slate-400">to</span>
               <input type="date" className="border p-2 rounded text-sm bg-white text-slate-900" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
            </div>
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
               <div className="bg-slate-800 text-white p-6 text-center"><h3 className="text-2xl font-bold">Profit & Loss Statement</h3><p className="text-slate-400 text-sm mt-1">{dateRange.start} to {dateRange.end}</p></div>
               <div className="p-8">
                  <div className="mb-6"><h4 className="text-sm font-bold text-slate-500 uppercase mb-2 border-b pb-1">Revenue</h4><div className="flex justify-between py-2 border-b"><span>Sales & Services</span><span className="font-mono">{settings.currency}{(pl.salesRev + pl.serviceRev).toFixed(2)}</span></div></div>
                  <div className="mb-6"><h4 className="text-sm font-bold text-slate-500 uppercase mb-2 border-b pb-1">Expenses</h4><div className="flex justify-between py-2 border-b"><span>Cost of Sales (COGS)</span><span className="text-red-500">({settings.currency}{pl.cogs.toFixed(2)})</span></div><div className="flex justify-between py-2 border-b"><span>Operating Expenses</span><span className="text-red-500">({settings.currency}{pl.totalExp.toFixed(2)})</span></div></div>
                  <div className={`flex justify-between py-4 px-4 rounded-lg font-bold text-xl ${pl.netProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}><span>Net Profit</span><span>{settings.currency}{pl.netProfit.toFixed(2)}</span></div>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'staff_perf' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b"><tr><th className="px-6 py-3 font-bold text-slate-600">Staff</th><th className="px-6 py-3 font-bold text-slate-600">Jobs</th><th className="px-6 py-3 font-bold text-slate-600 text-right">Revenue</th></tr></thead>
               <tbody className="divide-y">{staffPerf.map(s => (<tr key={s.name}><td className="px-6 py-4 font-medium">{s.name}</td><td className="px-6 py-4">{s.jobs}</td><td className="px-6 py-4 text-right font-bold text-green-600">{settings.currency}{s.revenue.toFixed(2)}</td></tr>))}</tbody>
            </table>
         </div>
      )}

      {activeTab === 'sales' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b"><tr><th className="px-6 py-4 font-bold text-slate-600">Sale ID</th><th className="px-6 py-4 font-bold text-slate-600">Date</th><th className="px-6 py-4 font-bold text-slate-600">Method</th><th className="px-6 py-4 font-bold text-slate-800 text-right">Total</th></tr></thead>
               <tbody className="divide-y">{sales.map(s => (<tr key={s.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-mono">{s.id}</td><td className="px-6 py-4 text-sm">{new Date(s.date).toLocaleDateString()}</td><td className="px-6 py-4 text-sm"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">{s.paymentMethod}</span></td><td className="px-6 py-4 text-right font-bold">{settings.currency}{s.total.toFixed(2)}</td></tr>))}</tbody>
            </table>
         </div>
      )}

      {activeTab === 'financial' && (
         <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="text-center mb-8"><h3 className="text-2xl font-bold uppercase">Statement of Financial Position</h3><p className="text-slate-500">As of {new Date().toLocaleDateString()}</p></div>
            <table className="w-full text-sm">
               <thead><tr className="bg-slate-50 border-b"><th className="text-left py-3 px-4 font-bold">Description</th><th className="text-right py-3 px-4 font-bold">{settings.currency}</th></tr></thead>
               <tbody>
                  <tr><td className="py-3 px-4 font-bold bg-slate-50">Assets</td><td></td></tr>
                  <tr className="border-b"><td className="py-2 px-4 pl-8">Current Assets (Cash, Debtors, Inventory)</td><td className="text-right font-mono">{financials.totalCurrentAssets.toFixed(2)}</td></tr>
                  <tr className="border-b"><td className="py-2 px-4 pl-8">Fixed Assets</td><td className="text-right font-mono">{financials.fixedAssets.toFixed(2)}</td></tr>
                  <tr className="bg-slate-800 text-white font-bold"><td className="py-3 px-4">Total Assets</td><td className="text-right">{financials.totalAssets.toFixed(2)}</td></tr>
                  <tr><td className="py-3 px-4 font-bold bg-slate-50 mt-4">Equity</td><td></td></tr>
                  <tr className="border-b"><td className="py-2 px-4 pl-8">Owner's Equity / Retained Earnings</td><td className="text-right font-mono">{financials.totalEquity.toFixed(2)}</td></tr>
               </tbody>
            </table>
         </div>
      )}
    </div>
  );
};

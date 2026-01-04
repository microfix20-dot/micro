import React, { useState } from 'react';
import { Customer, JobSheet, Sale, AppSettings, JobStatus } from '../types';
import { Phone, Mail, Clock, ShoppingBag, Search, Download, Upload, Plus, Pencil, X, Wrench, Smartphone, Calendar, CheckCircle, AlertCircle, FileText, CreditCard, Package, ArrowRight, History, MapPin, DollarSign, Tag } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  jobs: JobSheet[];
  sales: Sale[];
  settings: AppSettings;
  onNewJobForCustomer: (customerId: string) => void;
}

export const Customers: React.FC<CustomersProps> = ({ customers, setCustomers, jobs, sales, settings, onNewJobForCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  
  // History Modal State
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'repairs' | 'purchases'>('repairs');

  const handleOpenModal = (e: React.MouseEvent, customer?: Customer) => {
    e.stopPropagation(); // Prevent opening history modal
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setShowModal(true);
  };

  const handleOpenHistory = (customer: Customer, tab: 'repairs' | 'purchases' = 'repairs') => {
      setHistoryCustomer(customer);
      setActiveHistoryTab(tab);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (editingCustomer) {
      // Edit
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...formData } as Customer : c));
    } else {
      // Add
      const newCustomer: Customer = {
        id: `CUST-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        createdAt: new Date().toISOString(),
      };
      setCustomers([newCustomer, ...customers]);
    }
    setShowModal(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );
  
  const exportToCSV = () => {
     const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'CreatedAt'];
     const rows = customers.map(c => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        c.phone,
        c.email || '',
        c.address ? `"${c.address.replace(/"/g, '""')}"` : '',
        c.createdAt
     ]);
     
     const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `Customers_${new Date().toISOString().split('T')[0]}.csv`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        
        const lines = text.split('\n');
        const newCustomers: Customer[] = [];

        for (let i = 1; i < lines.length; i++) {
           const line = lines[i].trim();
           if (!line) continue;
           
           const cols = line.split(',');
           if (cols.length >= 3) {
              newCustomers.push({
                 id: cols[0] || `CUST-${Date.now()}-${i}`,
                 name: cols[1].replace(/"/g, '') || 'Unknown',
                 phone: cols[2] || '',
                 email: cols[3]?.replace(/"/g, '') || undefined,
                 address: cols[4]?.replace(/"/g, '') || undefined,
                 createdAt: cols[5] || new Date().toISOString()
              });
           }
        }
        
        if (newCustomers.length > 0) {
           setCustomers(prev => [...prev, ...newCustomers]);
           alert(`Successfully imported ${newCustomers.length} customers.`);
        } else {
           alert("No valid customers found in file. Please check format (ID,Name,Phone,Email,Address,CreatedAt).");
        }
     };
     reader.readAsText(file);
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case JobStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case JobStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case JobStatus.WAITING_PARTS: return 'bg-orange-100 text-orange-700';
      case JobStatus.DELIVERED: return 'bg-slate-200 text-slate-700';
      case JobStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Helper stats for history modal
  const getCustomerStats = (cust: Customer) => {
      const customerJobs = jobs.filter(j => j.customer.id === cust.id || j.customer.phone === cust.phone);
      const customerSales = sales.filter(s => s.customerId === cust.id);
      
      const repairSpend = customerJobs.reduce((acc, j) => acc + (j.finalCost || j.estimatedCost || 0), 0);
      const purchaseSpend = customerSales.reduce((acc, s) => acc + s.total, 0);
      
      return { customerJobs, customerSales, repairSpend, purchaseSpend };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800">Client Management</h2>
         <div className="flex gap-2">
            <button onClick={exportToCSV} className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
               <Download size={18}/> Export CSV
            </button>
            <label className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium cursor-pointer">
               <Upload size={18}/> Import CSV
               <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            <button onClick={(e) => handleOpenModal(e)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold">
               <Plus size={20}/> Add Customer
            </button>
         </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => {
           const { customerJobs, customerSales } = getCustomerStats(customer);
           
           return (
             <div 
               key={customer.id} 
               onClick={() => handleOpenHistory(customer)}
               className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow group flex flex-col cursor-pointer"
             >
               <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
                    {customer.name.charAt(0)}
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
                 </div>
               </div>
               
               <h3 className="font-bold text-lg text-slate-800 flex-1 group-hover:text-blue-600 transition-colors">
                  {customer.name}
               </h3>
               
               <div className="space-y-2 mt-2">
                 <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Phone size={14} /> {customer.phone}
                 </div>
                 {customer.email && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                       <Mail size={14} /> {customer.email}
                    </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                  <div 
                    className="bg-slate-50 p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all group/stat text-center"
                    onClick={(e) => { e.stopPropagation(); handleOpenHistory(customer, 'repairs'); }}
                    title="View Repair History"
                  >
                     <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1 group-hover/stat:text-blue-600"><Wrench size={14} /> Repairs</div>
                     <span className="font-bold text-lg text-slate-800 group-hover/stat:text-blue-700">{customerJobs.length}</span>
                  </div>
                  <div 
                    className="bg-slate-50 p-3 rounded-lg hover:bg-green-50 border border-transparent hover:border-green-100 transition-all group/stat text-center"
                    onClick={(e) => { e.stopPropagation(); handleOpenHistory(customer, 'purchases'); }}
                    title="View Purchase History"
                  >
                     <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1 group-hover/stat:text-green-600"><ShoppingBag size={14} /> Purchases</div>
                     <span className="font-bold text-lg text-slate-800 group-hover/stat:text-green-700">{customerSales.length}</span>
                  </div>
               </div>
               
               <div className="mt-4 pt-4 border-t flex gap-2">
                  <button 
                     onClick={(e) => { e.stopPropagation(); handleOpenHistory(customer); }}
                     className="flex-1 bg-white border text-slate-700 px-2 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-1 text-sm font-medium justify-center transition-colors"
                  >
                     <History size={16} className="text-slate-400"/> View History
                  </button>
                  <button 
                     onClick={(e) => handleOpenModal(e, customer)} 
                     className="w-10 flex items-center justify-center bg-white border text-slate-700 rounded-lg hover:bg-slate-50 transition-colors z-10"
                     title="Edit Customer"
                  >
                     <Pencil size={16} className="text-slate-400 hover:text-blue-600"/>
                  </button>
               </div>
             </div>
           );
        })}
        
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed">
            <Search size={48} className="mx-auto mb-4 opacity-20"/>
            <p>No customers found matching "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="text-blue-600 hover:underline mt-2">Clear Search</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  required 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                <input 
                  required 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                  value={formData.phone || ''} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                  value={formData.email || ''} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Address (Optional)</label>
                <textarea 
                  className="w-full border p-2 rounded h-20 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                  value={formData.address || ''} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-slate-50 text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn p-4 backdrop-blur-sm" onClick={() => setHistoryCustomer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b bg-slate-50 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md text-blue-600 flex items-center justify-center font-bold text-2xl">
                          {historyCustomer.name.charAt(0)}
                      </div>
                      <div>
                          <h3 className="font-bold text-2xl text-slate-800">{historyCustomer.name}</h3>
                          <div className="flex gap-4 mt-1 text-sm text-slate-600">
                              <span className="flex items-center gap-1"><Phone size={14}/> {historyCustomer.phone}</span>
                              {historyCustomer.email && <span className="flex items-center gap-1"><Mail size={14}/> {historyCustomer.email}</span>}
                          </div>
                          {historyCustomer.address && (
                             <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12}/> {historyCustomer.address}</p>
                          )}
                      </div>
                  </div>
                  <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"><X size={24}/></button>
              </div>

              {/* Stats & Tabs */}
              <div className="bg-white border-b px-6 pt-6 pb-0">
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-blue-600 uppercase mb-1">Lifetime Repairs</p>
                          <h4 className="text-2xl font-bold text-blue-900">{settings.currency}{getCustomerStats(historyCustomer).repairSpend.toFixed(2)}</h4>
                       </div>
                       <div className="bg-white p-2 rounded-full text-blue-500 shadow-sm"><Wrench size={20}/></div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-green-600 uppercase mb-1">Lifetime Purchases</p>
                          <h4 className="text-2xl font-bold text-green-900">{settings.currency}{getCustomerStats(historyCustomer).purchaseSpend.toFixed(2)}</h4>
                       </div>
                       <div className="bg-white p-2 rounded-full text-green-500 shadow-sm"><ShoppingBag size={20}/></div>
                    </div>
                 </div>

                 <div className="flex gap-6">
                     <button 
                        onClick={() => setActiveHistoryTab('repairs')}
                        className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeHistoryTab === 'repairs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                     >
                        <Clock size={16}/> Repair History ({getCustomerStats(historyCustomer).customerJobs.length})
                     </button>
                     <button 
                        onClick={() => setActiveHistoryTab('purchases')}
                        className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeHistoryTab === 'purchases' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                     >
                        <ShoppingBag size={16}/> Purchase History ({getCustomerStats(historyCustomer).customerSales.length})
                     </button>
                 </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                  {activeHistoryTab === 'repairs' ? (
                      <div className="space-y-4">
                          {getCustomerStats(historyCustomer).customerJobs.length === 0 ? (
                              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                                  <Wrench size={32} className="mx-auto mb-2 opacity-30"/>
                                  <p>No repair tickets found for this customer.</p>
                              </div>
                          ) : (
                              getCustomerStats(historyCustomer).customerJobs
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                  .map(job => (
                                      <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all group">
                                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                                              <div className="flex items-center gap-3">
                                                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{job.id}</span>
                                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getStatusColor(job.status)}`}>{job.status}</span>
                                              </div>
                                              <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12}/> {new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          
                                          <div className="flex gap-4">
                                              <div className="bg-blue-50 p-3 rounded-xl text-blue-600 h-fit shrink-0">
                                                  <Smartphone size={24}/>
                                              </div>
                                              <div className="flex-1">
                                                  <h5 className="font-bold text-slate-800">{job.device.brand} {job.device.model}</h5>
                                                  <p className="text-xs text-slate-500 mb-2">SN: {job.device.serialNumber}</p>
                                                  
                                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                                                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Issue Reported</p>
                                                      <p className="text-sm text-slate-700 italic">"{job.issueDescription}"</p>
                                                  </div>

                                                  {job.technicianNotes && (
                                                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-2">
                                                          <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Tech Notes</p>
                                                          <p className="text-sm text-yellow-800">{job.technicianNotes}</p>
                                                      </div>
                                                  )}
                                              </div>
                                          </div>

                                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end items-center gap-4">
                                              <div className="text-right">
                                                  <p className="text-xs text-slate-400">Total Cost</p>
                                                  <p className="font-bold text-lg text-slate-800">{settings.currency}{(job.finalCost || job.estimatedCost).toFixed(2)}</p>
                                              </div>
                                          </div>
                                      </div>
                                  ))
                          )}
                      </div>
                  ) : (
                      <div className="space-y-4">
                         {getCustomerStats(historyCustomer).customerSales.length === 0 ? (
                             <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                                 <Package size={32} className="mx-auto mb-2 opacity-30"/>
                                 <p>No purchase history found for this customer.</p>
                             </div>
                         ) : (
                             getCustomerStats(historyCustomer).customerSales
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(sale => (
                                   <div key={sale.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all">
                                      <div className="flex justify-between items-start mb-4">
                                         <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText size={14} className="text-slate-400"/>
                                                <span className="font-bold text-slate-800">Invoice #{sale.id}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                         </div>
                                         <div className="text-right">
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold border border-green-200 uppercase">{sale.status}</span>
                                         </div>
                                      </div>

                                      <div className="bg-slate-50 rounded-lg p-3 mb-3 space-y-2">
                                         {sale.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                               <span className="text-slate-700 flex items-center gap-2">
                                                  <span className="bg-white border px-1.5 rounded text-xs font-bold text-slate-500">{item.quantity}x</span> 
                                                  {item.name}
                                               </span>
                                               <span className="text-slate-500 font-mono">{settings.currency}{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                         ))}
                                      </div>

                                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                         <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CreditCard size={12}/> {sale.paymentMethod}
                                         </div>
                                         <p className="font-bold text-lg text-slate-800">{settings.currency}{sale.total.toFixed(2)}</p>
                                      </div>
                                   </div>
                                ))
                         )}
                      </div>
                  )}
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-white border-t flex justify-end gap-3 shadow-lg z-10">
                  <button onClick={() => setHistoryCustomer(null)} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">Close</button>
                  <button 
                      onClick={() => {
                          // Fix: Convert ID to string to match onNewJobForCustomer signature
                          onNewJobForCustomer(String(historyCustomer.id));
                          setHistoryCustomer(null); // Close modal
                      }}
                      className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                      <Plus size={18} /> New Job Ticket
                  </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

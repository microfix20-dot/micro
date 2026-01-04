
import React, { useState, useEffect } from 'react';
import { Supplier, PurchaseOrder, InventoryItem, AppSettings } from '../types';
import { Plus, Search, Truck, CheckCircle, Zap, Download, Upload } from 'lucide-react';

interface PurchasesProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  orders: PurchaseOrder[];
  setOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  settings: AppSettings;
  autoOpenOrder?: boolean;
  onModalHandled?: () => void;
}

export const Purchases: React.FC<PurchasesProps> = ({ suppliers, setSuppliers, orders, setOrders, inventory, setInventory, settings, autoOpenOrder, onModalHandled }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({});

  // Order Form State
  const [orderForm, setOrderForm] = useState<{ supplierId: string; items: { itemId: string; qty: number; cost: number }[] }>({
     supplierId: '',
     items: []
  });
  
  // Quick Add Item State (Inside PO)
  const [quickAdd, setQuickAdd] = useState({ name: '', cost: '', qty: '' });

  useEffect(() => {
    if (autoOpenOrder) {
      setShowOrderModal(true);
      if (onModalHandled) onModalHandled();
    }
  }, [autoOpenOrder]);

  const handleAddSupplier = () => {
    const newSupplier: Supplier = {
      id: `SUP-${Date.now()}`,
      name: supplierForm.name || 'New Supplier',
      contact: supplierForm.contact || '',
      email: supplierForm.email || '',
      address: supplierForm.address || ''
    };
    setSuppliers([...suppliers, newSupplier]);
    setShowSupplierModal(false);
    setSupplierForm({});
  };

  const handleCreateOrder = () => {
     if (!orderForm.supplierId) return;
     const total = orderForm.items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
     const newOrder: PurchaseOrder = {
       id: `PO-${Date.now()}`,
       supplierId: orderForm.supplierId,
       date: new Date().toISOString(),
       items: orderForm.items.map(i => ({ inventoryItemId: i.itemId, quantity: i.qty, cost: i.cost })),
       total,
       status: 'Ordered'
     };
     setOrders([newOrder, ...orders]);
     setShowOrderModal(false);
     setOrderForm({ supplierId: '', items: [] });
  };

  const handleQuickAddItem = () => {
      if (!quickAdd.name || !quickAdd.cost || !quickAdd.qty) return;
      const cost = parseFloat(quickAdd.cost);
      const qty = parseInt(quickAdd.qty);
      
      const newItem: InventoryItem = {
          id: `NEW-${Date.now()}`,
          name: quickAdd.name,
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          category: 'Part',
          quantity: 0,
          costPrice: cost,
          sellingPrice: cost * 1.3, // Default markup
          lowStockThreshold: 5
      };

      setInventory(prev => [newItem, ...prev]);
      
      setOrderForm(prev => ({
          ...prev,
          items: [...prev.items, { itemId: newItem.id, qty, cost }]
      }));

      setQuickAdd({ name: '', cost: '', qty: '' });
  };

  const receiveOrder = (orderId: string) => {
     const order = orders.find(o => o.id === orderId);
     if (!order || order.status === 'Received') return;

     // Update Inventory
     const updatedInventory = [...inventory];
     order.items.forEach(orderItem => {
        const itemIndex = updatedInventory.findIndex(i => i.id === orderItem.inventoryItemId);
        if (itemIndex >= 0) {
           updatedInventory[itemIndex] = {
              ...updatedInventory[itemIndex],
              quantity: updatedInventory[itemIndex].quantity + orderItem.quantity,
              costPrice: orderItem.cost // Update last cost price
           };
        }
     });
     
     setInventory(updatedInventory);
     setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'Received' } : o));
  };

  // --- CSV Logic ---
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

  const exportSuppliers = () => {
    const headers = ['ID', 'Name', 'Contact', 'Email', 'Address'];
    const rows = suppliers.map(s => [s.id, `"${s.name}"`, `"${s.contact}"`, s.email, `"${s.address}"`]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `Suppliers_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportOrders = () => {
    const headers = ['PO_ID', 'Supplier', 'Date', 'Total', 'Status'];
    const rows = orders.map(o => {
      const sup = suppliers.find(s => s.id === o.supplierId);
      return [o.id, `"${sup?.name || 'Unknown'}"`, o.date, o.total, o.status];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `PurchaseOrders_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImportSuppliers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const newSups: Supplier[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
        if (cols.length >= 2) {
          newSups.push({
            id: cols[0] || `SUP-IMP-${Date.now()}-${i}`,
            name: cols[1],
            contact: cols[2] || '',
            email: cols[3] || '',
            address: cols[4] || ''
          });
        }
      }
      if (newSups.length > 0) {
        setSuppliers(prev => [...prev, ...newSups]);
        alert(`Successfully imported ${newSups.length} suppliers.`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportOrders = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const newOrders: PurchaseOrder[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
        if (cols.length >= 4) {
          // Attempt to match supplier by name if ID isn't provided or is invalid
          let supId = suppliers.find(s => s.name === cols[1])?.id || cols[1];
          newOrders.push({
            id: cols[0],
            supplierId: supId,
            date: cols[2],
            total: parseFloat(cols[3]) || 0,
            status: (cols[4] as any) || 'Ordered',
            items: [] // Historical items are usually not imported for simplicity
          });
        }
      }
      if (newOrders.length > 0) {
        setOrders(prev => [...prev, ...newOrders]);
        alert(`Successfully imported ${newOrders.length} order logs.`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800">Purchasing</h2>
         <div className="flex bg-white rounded-lg shadow-sm border p-1">
            <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Purchase Orders</button>
            <button onClick={() => setActiveTab('suppliers')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'suppliers' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>Suppliers</button>
         </div>
      </div>

      {activeTab === 'suppliers' && (
         <div className="space-y-4">
             <div className="flex justify-end gap-2">
                <button onClick={exportSuppliers} className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                   <Download size={18}/> Export
                </button>
                <label className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium cursor-pointer">
                   <Upload size={18}/> Import
                   <input type="file" accept=".csv" onChange={handleImportSuppliers} className="hidden" />
                </label>
                <button onClick={() => setShowSupplierModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold shadow-sm ml-2">
                   <Plus size={18} /> Add Supplier
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map(s => (
                   <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-800">{s.name}</h3>
                        <span className="text-[10px] text-slate-300 font-mono">{s.id}</span>
                      </div>
                      <p className="text-slate-500 text-sm">{s.contact} | {s.email}</p>
                      <p className="text-slate-400 text-xs mt-2 italic">{s.address}</p>
                   </div>
                ))}
                {suppliers.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed">
                    <Truck size={48} className="mx-auto mb-2 opacity-20"/>
                    <p>No suppliers configured. Add or Import one to start ordering.</p>
                  </div>
                )}
             </div>
         </div>
      )}

      {activeTab === 'orders' && (
         <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <button onClick={exportOrders} className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                   <Download size={18}/> Export Log
                </button>
                <label className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium cursor-pointer">
                   <Upload size={18}/> Import Log
                   <input type="file" accept=".csv" onChange={handleImportOrders} className="hidden" />
                </label>
                <button onClick={() => setShowOrderModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold shadow-sm ml-2">
                   <Plus size={18} /> Create PO
                </button>
             </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PO #</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {orders.map(order => {
                        const supplier = suppliers.find(s => s.id === order.supplierId);
                        return (
                           <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-sm font-bold text-slate-600">{order.id}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{supplier?.name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-slate-500 text-sm">{new Date(order.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-black text-slate-900">{settings.currency}{order.total.toFixed(2)}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${order.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {order.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 {order.status !== 'Received' ? (
                                    <button onClick={() => receiveOrder(order.id)} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-all">
                                       Mark Received
                                    </button>
                                 ) : (
                                   <div className="flex items-center justify-end gap-1 text-green-600 text-xs font-bold">
                                      <CheckCircle size={14}/> Stock Updated
                                   </div>
                                 )}
                              </td>
                           </tr>
                        );
                     })}
                     {orders.length === 0 && (
                        <tr>
                           <td colSpan={6} className="py-12 text-center text-slate-400 italic">No purchase orders found.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-slate-800">Add New Supplier</h3>
                  <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <Plus size={24} className="rotate-45" />
                  </button>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Company Name</label>
                     <input placeholder="e.g. Tech Components Ltd" className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900" onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Person</label>
                     <input placeholder="e.g. John Doe" className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900" onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                     <input placeholder="e.g. sales@techcomp.com" className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900" onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Office Address</label>
                     <textarea placeholder="Full business address..." className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 bg-white text-slate-900" onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
                  </div>
               </div>
               <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setShowSupplierModal(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                  <button onClick={handleAddSupplier} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Save Supplier</button>
               </div>
            </div>
         </div>
      )}

      {/* PO Modal */}
      {showOrderModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-2xl text-slate-800">Create Purchase Order</h3>
                  <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <Plus size={24} className="rotate-45" />
                  </button>
               </div>
               
               <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target Supplier</label>
                     <select className="w-full border-2 border-slate-100 p-3 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800" onChange={e => setOrderForm({...orderForm, supplierId: e.target.value})}>
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                  </div>

                  {/* Quick Add Section */}
                  <div className="bg-indigo-50 p-5 rounded-3xl border-2 border-indigo-100 shadow-sm">
                     <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={14} className="text-amber-500 fill-amber-500"/> Quick Add New Part to Order
                     </label>
                     <div className="flex gap-3">
                        <input 
                           className="flex-1 border-2 border-white p-2.5 rounded-xl text-sm shadow-sm focus:border-indigo-400 outline-none bg-white text-slate-900" 
                           placeholder="Component name..."
                           value={quickAdd.name}
                           onChange={e => setQuickAdd({...quickAdd, name: e.target.value})}
                        />
                        <input 
                           className="w-20 border-2 border-white p-2.5 rounded-xl text-sm shadow-sm focus:border-indigo-400 outline-none bg-white text-slate-900" 
                           type="number" 
                           placeholder="Qty"
                           value={quickAdd.qty}
                           onChange={e => setQuickAdd({...quickAdd, qty: e.target.value})}
                        />
                        <input 
                           className="w-28 border-2 border-white p-2.5 rounded-xl text-sm shadow-sm focus:border-indigo-400 outline-none bg-white text-slate-900" 
                           type="number" 
                           placeholder={`Cost (${settings.currency})`}
                           value={quickAdd.cost}
                           onChange={e => setQuickAdd({...quickAdd, cost: e.target.value})}
                        />
                        <button 
                           onClick={handleQuickAddItem}
                           disabled={!quickAdd.name || !quickAdd.qty || !quickAdd.cost}
                           className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
                        >
                           <Plus size={20} />
                        </button>
                     </div>
                  </div>
                  
                  <div className="border-2 border-slate-50 p-2 rounded-3xl bg-slate-50 flex-1 overflow-y-auto min-h-[200px]">
                     <div className="px-4 py-3 flex justify-between items-center bg-white rounded-t-2xl border-b border-slate-100 sticky top-0 z-10">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Catalog</h4>
                        <span className="text-[10px] font-bold text-blue-500">{inventory.length} items available</span>
                     </div>
                     {inventory.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-10 font-medium italic">No inventory items. Use Quick Add above.</p>
                     ) : (
                        <div className="divide-y divide-slate-100">
                           {inventory.map(item => {
                              const inCart = orderForm.items.find(i => i.itemId === item.id);
                              return (
                                 <div key={item.id} className={`flex justify-between items-center text-sm p-4 transition-all ${inCart ? 'bg-white shadow-sm ring-1 ring-blue-100' : 'hover:bg-white/50'}`}>
                                    <div className="w-1/3">
                                       <p className="truncate font-bold text-slate-700">{item.name}</p>
                                       <p className="text-[10px] text-slate-400 font-mono">{item.sku} | Current: {item.quantity}</p>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                       <div className="relative">
                                          <span className="absolute left-2 top-2 text-[8px] font-bold text-slate-400 uppercase">Qty</span>
                                          <input 
                                             type="number" 
                                             className={`w-24 border-2 p-2 pl-8 rounded-xl font-bold text-right transition-all ${inCart ? 'border-blue-400 bg-blue-50 text-slate-900' : 'border-transparent bg-white text-slate-900'}`}
                                             value={inCart ? inCart.qty : ''}
                                             placeholder="0"
                                             onChange={(e) => {
                                                const qty = parseInt(e.target.value) || 0;
                                                const cost = inCart ? inCart.cost : item.costPrice;
                                                
                                                if (qty > 0) {
                                                   if (inCart) {
                                                      setOrderForm({
                                                         ...orderForm,
                                                         items: orderForm.items.map(i => i.itemId === item.id ? { ...i, qty } : i)
                                                      });
                                                   } else {
                                                      setOrderForm({ ...orderForm, items: [...orderForm.items, { itemId: item.id, qty, cost }] });
                                                   }
                                                } else {
                                                   setOrderForm({ ...orderForm, items: orderForm.items.filter(i => i.itemId !== item.id) });
                                                }
                                             }}
                                          />
                                       </div>
                                       <div className="relative">
                                          <span className="absolute left-2 top-2 text-[8px] font-bold text-slate-400 uppercase">Cost</span>
                                          <input 
                                             type="number" 
                                             className={`w-28 border-2 p-2 pl-8 rounded-xl font-bold text-right transition-all ${inCart ? 'border-blue-400 bg-blue-50 text-slate-900' : 'border-transparent bg-white text-slate-900'}`}
                                             value={inCart ? inCart.cost : item.costPrice}
                                             onChange={(e) => {
                                                const cost = parseFloat(e.target.value) || 0;
                                                if (inCart) {
                                                   setOrderForm({
                                                      ...orderForm,
                                                      items: orderForm.items.map(i => i.itemId === item.id ? { ...i, cost } : i)
                                                   });
                                                }
                                             }}
                                          />
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
                  
                  <div className="flex justify-between items-center font-black text-2xl bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                     <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Estimate</span>
                     <span className="text-blue-400">{settings.currency}{orderForm.items.reduce((s, i) => s + (i.qty * i.cost), 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t-2 border-dashed border-slate-100">
                     <button onClick={() => setShowOrderModal(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                     <button 
                        onClick={handleCreateOrder} 
                        disabled={!orderForm.supplierId || orderForm.items.length === 0} 
                        className="px-12 py-3 bg-blue-600 text-white rounded-2xl disabled:opacity-50 hover:bg-blue-700 font-black shadow-lg shadow-blue-200 active:scale-95 transition-all"
                     >
                        Confirm Purchase
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

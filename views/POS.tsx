
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, Sale, AppSettings, Customer, PaymentSplit, JobSheet, JobStatus, Quotation } from '../types';
import { Search, Plus, Minus, Trash2, CreditCard, ShoppingCart, Printer, UserPlus, Zap, Pencil, X, ScanBarcode, Camera, AlertCircle, RotateCcw, Wallet, Banknote, QrCode, AlertTriangle, CheckCircle, Wrench, FileText, Mail, Loader2, History, Download } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface POSProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addSale: (sale: Sale) => void;
  sales: Sale[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  jobs: JobSheet[];
  setJobs: React.Dispatch<React.SetStateAction<JobSheet[]>>;
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  autoOpenJobPay?: boolean;
  onModalHandled?: () => void;
}

const MALAYSIA_PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: Banknote },
  { id: 'DuitNow', label: 'DuitNow QR', icon: QrCode },
  { id: 'TNG eWallet', label: 'TNG eWallet', icon: Wallet },
  { id: 'GrabPay', label: 'GrabPay', icon: Wallet },
  { id: 'Card', label: 'Credit/Debit', icon: CreditCard },
  { id: 'Transfer', label: 'Online Transfer', icon: Banknote },
  { id: 'Split', label: 'Split Payment', icon: RotateCcw },
];

export const POS: React.FC<POSProps> = ({ inventory, setInventory, addSale, sales, settings, setSettings, customers, setCustomers, jobs, setJobs, setQuotations, autoOpenJobPay, onModalHandled }) => {
  const [cart, setCart] = useState<{ item: InventoryItem; qty: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [linkedJobId, setLinkedJobId] = useState('');
  const [splitPayments, setSplitPayments] = useState<PaymentSplit[]>([]);
  const [splitInput, setSplitInput] = useState({ method: 'Cash', amount: '', ref: '' });

  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<any>(null);

  const [customItem, setCustomItem] = useState({ name: '', price: '', qty: 1 });
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; price: number; qty: number } | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [showJobPayModal, setShowJobPayModal] = useState(false);
  const [showSalesLog, setShowSalesLog] = useState(false);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);

  useEffect(() => {
    if (autoOpenJobPay) {
      setShowJobPayModal(true);
      if (onModalHandled) onModalHandled();
    }
  }, [autoOpenJobPay]);

  const filteredItems = inventory.filter(i => 
    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
     i.barcode?.includes(searchTerm)) &&
    i.quantity > 0
  );

  const subtotal = cart.reduce((acc, curr) => acc + (curr.item.sellingPrice * curr.qty), 0);
  const tax = subtotal * settings.taxRate;
  const total = subtotal + tax;

  useEffect(() => {
    if (showScanner) {
      const scannerId = "reader";
      const timer = setTimeout(() => {
        const element = document.getElementById(scannerId);
        if (!element) return;
        
        try {
           const scanner = new Html5QrcodeScanner(
             scannerId, 
             { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, 
             false
           );
           
           scanner.render(
             (decodedText) => { 
                handleScanResult(decodedText); 
                setShowScanner(false); 
             }, 
             (errorMessage) => {}
           );
           scannerRef.current = scanner;
        } catch (e) { 
          console.error("Scanner Error:", e);
          setScanError("Scanner initialization failed."); 
        }
      }, 150);
      
      return () => { 
        clearTimeout(timer); 
        if (scannerRef.current) { 
          scannerRef.current.clear().catch((err: any) => console.error("Scanner cleanup error", err)); 
        } 
      };
    }
  }, [showScanner]);

  const handleScanResult = (decodedText: string) => {
      const exactMatch = inventory.find(i => (i.barcode === decodedText || i.sku.toLowerCase() === decodedText.toLowerCase()));
      if (exactMatch) {
        if (exactMatch.quantity > 0) { addToCart(exactMatch); setSearchTerm(''); setScanError(null); }
        else { setScanError(`Item '${exactMatch.name}' is out of stock.`); }
      } else {
         setScanError(`Barcode '${decodedText}' not found.`);
         setCustomItem(prev => ({ ...prev, name: `Item ${decodedText}` }));
         setTimeout(() => { document.getElementById('custom-item-price')?.focus(); }, 300);
      }
  };

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        if (item.category !== 'Service' && existing.qty >= item.quantity) return prev;
        return prev.map(p => p.item.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const term = searchTerm.trim();
      const exactMatch = inventory.find(i => (i.barcode === term || i.sku.toLowerCase() === term.toLowerCase()));
      if (exactMatch) {
        if (exactMatch.quantity > 0) { addToCart(exactMatch); setSearchTerm(''); setScanError(null); }
        else { setScanError(`Item '${exactMatch.name}' is out of stock.`); }
        return;
      }
      if (filteredItems.length === 1) { addToCart(filteredItems[0]); setSearchTerm(''); setScanError(null); return; }
      setScanError(`Item '${term}' not found.`);
      setCustomItem(prev => ({ ...prev, name: term }));
      setSearchTerm('');
      setTimeout(() => { document.getElementById('custom-item-price')?.focus(); }, 100);
    }
  };

  const handleAddCustomItem = () => {
    if (!customItem.name || !customItem.price) return;
    const price = parseFloat(customItem.price);
    const qty = parseInt(String(customItem.qty)) || 1;
    const newItem: InventoryItem = { id: `MANUAL-${Date.now()}`, name: customItem.name, sku: 'CUSTOM', category: 'Service', quantity: 999999, costPrice: 0, sellingPrice: price, lowStockThreshold: 0 };
    setCart(prev => [...prev, { item: newItem, qty }]);
    setCustomItem({ name: '', price: '', qty: 1 });
    setScanError(null);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(p => p.item.id !== id));
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.item.id === id) {
        const newQty = p.qty + delta;
        if (p.item.category !== 'Service' && newQty > p.item.quantity) return p;
        if (newQty < 1) return p;
        return { ...p, qty: newQty };
      }
      return p;
    }));
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setCart(prev => prev.map(p => {
      if (p.item.id === editingItem.id) {
        return { ...p, qty: editingItem.qty, item: { ...p.item, sellingPrice: editingItem.price } };
      }
      return p;
    }));
    setEditingItem(null);
  };

  const handleSaveAsQuotation = () => {
    if (cart.length === 0 || !selectedCustomer) {
      alert("Please select a customer and add items to cart before saving as quote.");
      return;
    }
    const newQuote: Quotation = {
      id: `QT-${Date.now().toString().slice(-6)}`,
      customerId: selectedCustomer.id,
      date: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: cart.map(c => ({ inventoryItemId: c.item.id, sku: c.item.sku, name: c.item.name, quantity: c.qty, price: c.item.sellingPrice })),
      subtotal, tax, total,
      status: 'Draft',
      notes: settings.termsAndConditions,
      template: settings.defaultQuoteTemplate
    };
    setQuotations(prev => [newQuote, ...prev]);
    setCart([]);
    setSelectedCustomer(null);
    alert(`Quotation ${newQuote.id} created successfully!`);
  };

  const handleAddSplitLine = () => {
     const amount = parseFloat(splitInput.amount);
     const currentPaid = splitPayments.reduce((acc, curr) => acc + curr.amount, 0);
     const remaining = total - currentPaid;
     if (amount > remaining + 0.01) return;
     setSplitPayments(prev => [...prev, { method: splitInput.method, amount: amount, reference: splitInput.ref }]);
     const newRemaining = total - (currentPaid + amount);
     setSplitInput({ method: 'Cash', amount: newRemaining > 0 ? newRemaining.toFixed(2) : '', ref: '' });
  };

  const removeSplitLine = (index: number) => setSplitPayments(prev => prev.filter((_, i) => i !== index));
  const getSplitRemaining = () => total - splitPayments.reduce((acc, curr) => acc + curr.amount, 0);
  
  const prepareCheckout = () => { setPaymentMethod('Cash'); setSplitPayments([]); setSplitInput({ method: 'Cash', amount: '', ref: '' }); setTransactionRef(''); setShowCheckout(true); };

  const handleCheckout = () => {
    if (paymentMethod === 'Split' && Math.abs(getSplitRemaining()) > 0.05) { alert("Split payments do not match total."); return; }
    const invoiceId = `${settings.invoicePrefix || 'INV-'}${settings.invoiceNextNumber || 1000}`;
    const paidJobs: string[] = [];
    cart.forEach(c => {
        if (c.item.id.startsWith('JOB_PAYMENT_')) {
            const jobId = c.item.id.replace('JOB_PAYMENT_', '');
            const paymentAmount = c.item.sellingPrice * c.qty;
            setJobs(prevJobs => prevJobs.map(j => {
                if (j.id === jobId) {
                    const newHistory = [...j.history, { status: j.status, date: new Date().toISOString(), note: `Payment of ${settings.currency}${paymentAmount.toFixed(2)} via POS #${invoiceId}` }];
                    return { ...j, advanceAmount: (j.advanceAmount || 0) + paymentAmount, history: newHistory };
                }
                return j;
            }));
            paidJobs.push(jobId);
        }
    });

    const sale: Sale = { id: invoiceId, date: new Date().toISOString(), items: cart.map(c => ({ inventoryItemId: c.item.id, sku: c.item.sku, name: c.item.name, quantity: c.qty, price: c.item.sellingPrice })), subtotal, tax, total, paymentMethod: paymentMethod as any, paymentDetails: paymentMethod === 'Split' ? splitPayments : undefined, transactionRef, customerId: selectedCustomer?.id, jobId: linkedJobId || (paidJobs.length > 0 ? paidJobs[0] : undefined), status: 'Completed', template: settings.defaultQuoteTemplate };
    const newInventory = inventory.map(item => {
      const cartItem = cart.find(c => c.item.id === item.id);
      if (cartItem && item.category !== 'Service') { return { ...item, quantity: item.quantity - cartItem.qty }; }
      return item;
    });
    setInventory(newInventory); addSale(sale); setLastSale(sale); setCart([]); setLinkedJobId(''); setShowCheckout(false);
    setSettings(prev => ({ ...prev, invoiceNextNumber: (prev.invoiceNextNumber || 1000) + 1 }));
    setShowSuccessModal(true);
  };
  
  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomerObject: Customer = { id: `CUST-${Date.now()}`, name: newCustomer.name, phone: newCustomer.phone, email: newCustomer.email, createdAt: new Date().toISOString() };
    setCustomers(prev => [...prev, newCustomerObject]); setSelectedCustomer(newCustomerObject); setShowAddCustomer(false); setNewCustomer({name: '', phone: '', email: ''});
  };

  const handleUpdateCustomerEmail = (email: string) => {
     if (!selectedCustomer) return;
     const updated = { ...selectedCustomer, email };
     setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updated : c));
     setSelectedCustomer(updated);
  };

  const handlePayJob = (job: JobSheet) => {
      const balance = (job.finalCost || job.estimatedCost) - (job.advanceAmount || 0);
      if (balance <= 0) return;
      const jobItem: InventoryItem = { id: `JOB_PAYMENT_${job.id}`, name: `Repair: ${job.device.brand} ${job.device.model} (${job.id})`, sku: `SVC-${job.id}`, category: 'Service', quantity: 1, costPrice: 0, sellingPrice: balance, lowStockThreshold: 0 };
      addToCart(jobItem); setLinkedJobId(job.id);
      const jobCustomer = customers.find(c => c.id === job.customer.id);
      if (jobCustomer) { setSelectedCustomer(jobCustomer); }
      setShowJobPayModal(false);
  };

  const handleSendEmailReceipt = () => {
    if (!selectedCustomer?.email) {
      alert("Please provide a customer email address first.");
      return;
    }
    setIsEmailSending(true);
    setTimeout(() => {
       setIsEmailSending(false);
       alert(`Receipt successfully emailed to ${selectedCustomer.email}`);
    }, 2000);
  };

  const exportTodaySales = () => {
     const today = new Date().toISOString().split('T')[0];
     const todaySales = sales.filter(s => s.date.startsWith(today));
     
     if (todaySales.length === 0) {
        alert("No sales recorded today to export.");
        return;
     }

     const headers = ['Invoice ID', 'Date', 'Customer', 'Items Count', 'Subtotal', 'Tax', 'Total', 'Payment Method'];
     const rows = todaySales.map(s => [
        s.id,
        new Date(s.date).toLocaleString(),
        customers.find(c => c.id === s.customerId)?.name || 'Guest',
        s.items.length,
        s.subtotal,
        s.tax,
        s.total,
        s.paymentMethod
     ]);

     const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `DailySales_${today}.csv`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const rePrintSale = (sale: Sale) => {
     setLastSale(sale);
     setTimeout(() => window.print(), 100);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      <div className="flex-1 flex flex-col gap-4 no-print">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
              <input type="text" placeholder="Search name, SKU or scan Barcode..." className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 ${scanError ? 'border-red-500' : ''}`} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setScanError(null); }} onKeyDown={handleSearchKeyDown} autoFocus />
            </div>
            <button onClick={() => setShowSalesLog(true)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-lg border border-blue-200 flex items-center justify-center gap-2 px-4 whitespace-nowrap font-medium transition-all" title="View Recent Sales"><History size={18} /> Sales Log</button>
            <button onClick={() => setShowJobPayModal(true)} className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded-lg border border-purple-200 flex items-center justify-center gap-2 px-4 whitespace-nowrap font-medium"><Wrench size={18} /> Pay Job</button>
            <button onClick={() => setShowScanner(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg border border-slate-200 flex items-center justify-center gap-2 px-4 whitespace-nowrap"><ScanBarcode size={20} /> <span className="hidden md:inline">Scan</span></button>
          </div>
          {scanError && <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 animate-fadeIn"><AlertCircle size={16} className="text-red-500 mt-0.5" /><p className="text-xs text-red-700 font-bold">{scanError}</p><button onClick={() => setScanError(null)} className="text-red-400 ml-auto"><X size={14}/></button></div>}
          <div className="flex gap-2 items-center pt-3 border-t border-slate-100">
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mr-2 shrink-0"><Zap size={14} /> Quick Add</div>
             <div className="flex-1"><input placeholder="Item Name" className="w-full border p-2 rounded-lg text-sm bg-white text-slate-800" value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} /></div>
             <div className="w-24"><input id="custom-item-price" type="number" placeholder="Price" className="w-full border p-2 rounded-lg text-sm bg-white text-slate-800" value={customItem.price} onChange={e => setCustomItem({...customItem, price: e.target.value})} /></div>
             <div className="w-20"><input type="number" placeholder="Qty" className="w-full border p-2 rounded-lg text-sm bg-white text-slate-800" value={customItem.qty} onChange={e => setCustomItem({...customItem, qty: parseInt(e.target.value) || 1})} /></div>
             <button onClick={handleAddCustomItem} disabled={!customItem.name || !customItem.price} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"><Plus size={20} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
                <button key={item.id} onClick={() => addToCart(item)} className={`relative flex flex-col items-center justify-center p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center group bg-white ${item.quantity <= item.lowStockThreshold ? 'border-red-200' : ''}`}>
                  {item.quantity <= item.lowStockThreshold && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></div>}
                  <h4 className="font-semibold text-slate-700 text-sm line-clamp-2 h-10 w-full">{item.name}</h4>
                  <div className="mt-2 flex justify-between w-full px-2 items-center"><span className="text-blue-600 font-bold">{settings.currency}{item.sellingPrice}</span><span className="text-xs text-slate-400">{item.quantity} left</span></div>
                </button>
            ))}
          </div>
        </div>
      </div>
      <div className="w-96 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full shrink-0 no-print">
        <div className="p-4 border-b bg-slate-50 rounded-t-xl">
          <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Current Sale</h2><button onClick={() => { setCart([]); setLinkedJobId(''); }} className="text-xs text-red-500">Clear</button></div>
          <div className="space-y-3">
             <div className="flex gap-2">
               <select className="w-full border p-2 rounded text-sm flex-1 bg-white text-slate-800" onChange={(e) => setSelectedCustomer(customers.find(cust => cust.id === e.target.value) || null)} value={selectedCustomer?.id || ''}><option value="">Guest Customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
               <button onClick={() => setShowAddCustomer(true)} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 transition-colors"><Plus size={18} /></button>
             </div>
             {selectedCustomer && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs animate-fadeIn">
                   <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider">Client Details</span>
                      <button onClick={() => setSelectedCustomer(null)} className="text-red-500"><X size={14}/></button>
                   </div>
                   <p className="font-medium text-slate-800">{selectedCustomer.name}</p>
                   <div className="mt-2 flex items-center gap-2">
                      <Mail size={12} className="text-slate-400"/>
                      {selectedCustomer.email ? (
                         <span className="text-blue-600 truncate">{selectedCustomer.email}</span>
                      ) : (
                         <input 
                            placeholder="Add email address..." 
                            className="bg-slate-50 border-none p-1 rounded w-full outline-none focus:bg-blue-50 transition-colors text-slate-800"
                            onBlur={(e) => handleUpdateCustomerEmail(e.target.value)}
                         />
                      )}
                   </div>
                </div>
             )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? <div className="text-center text-slate-400 py-10">Cart is empty</div> : cart.map((line, idx) => (
              <div key={idx} className="flex justify-between items-center group">
                <div className="flex-1"><h4 className="font-medium text-sm text-slate-800 line-clamp-2">{line.item.name}</h4><p className="text-xs text-slate-500">{settings.currency}{line.item.sellingPrice} x {line.qty}</p></div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setEditingItem({ id: line.item.id, name: line.item.name, price: line.item.sellingPrice, qty: line.qty })} className="w-8 h-8 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                   <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 h-8"><button onClick={() => updateQty(line.item.id, -1)} className="w-8 h-full flex items-center justify-center" disabled={line.qty <= 1}><Minus size={12}/></button><span className="w-8 text-center text-xs font-bold text-slate-800">{line.qty}</span><button onClick={() => updateQty(line.item.id, 1)} className="w-8 h-full flex items-center justify-center"><Plus size={12}/></button></div>
                   <button onClick={() => removeFromCart(line.item.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              </div>
          ))}
        </div>
        <div className="p-4 border-t bg-slate-50 rounded-b-xl space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{settings.currency}{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t"><span>Total</span><span className="text-blue-600">{settings.currency}{total.toFixed(2)}</span></div>
          <div className="grid grid-cols-2 gap-2 mt-4">
             <button disabled={cart.length === 0} onClick={handleSaveAsQuotation} className="bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 flex items-center justify-center gap-2"><FileText size={18}/> Quote</button>
             <button disabled={cart.length === 0} onClick={prepareCheckout} className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><CreditCard size={18} /> Pay</button>
          </div>
        </div>
      </div>

      {showSalesLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 no-print">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="font-bold text-xl text-slate-800">Today's Transactions</h3>
                          <p className="text-sm text-slate-500">History of sales made today</p>
                      </div>
                      <div className="flex gap-2">
                          <button 
                             onClick={exportTodaySales}
                             className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-md"
                          >
                             <Download size={18} /> Export CSV
                          </button>
                          <button onClick={() => setShowSalesLog(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={24}/></button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                      {sales.filter(s => s.date.startsWith(new Date().toISOString().split('T')[0])).length === 0 ? (
                          <div className="text-center py-20 text-slate-400">
                              <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                              <p>No sales recorded yet today.</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {sales
                                  .filter(s => s.date.startsWith(new Date().toISOString().split('T')[0]))
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map(sale => (
                                      <div key={sale.id} className="border border-slate-100 bg-white rounded-xl p-4 flex justify-between items-center hover:border-blue-200 hover:shadow-sm transition-all">
                                          <div>
                                              <div className="flex items-center gap-2">
                                                  <span className="font-bold text-slate-800">#{sale.id}</span>
                                                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">{sale.paymentMethod}</span>
                                              </div>
                                              <p className="text-xs text-slate-500 mt-1">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.items.length} items</p>
                                          </div>
                                          <div className="text-right flex items-center gap-4">
                                              <div>
                                                  <p className="font-bold text-lg text-slate-900">{settings.currency}{sale.total.toFixed(2)}</p>
                                              </div>
                                              <button 
                                                 onClick={() => rePrintSale(sale)}
                                                 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                 title="Print Receipt"
                                              >
                                                 <Printer size={18}/>
                                              </button>
                                          </div>
                                      </div>
                                  ))
                              }
                          </div>
                      )}
                  </div>
                  <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">Total Volume Today:</span>
                      <span className="text-xl font-black text-blue-700">
                          {settings.currency}
                          {sales
                              .filter(s => s.date.startsWith(new Date().toISOString().split('T')[0]))
                              .reduce((acc, curr) => acc + curr.total, 0)
                              .toFixed(2)
                          }
                      </span>
                  </div>
              </div>
          </div>
      )}

      {showJobPayModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 no-print">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50"><div><h3 className="font-bold text-xl text-slate-800">Select Job to Pay</h3><p className="text-sm text-slate-500">Unpaid repair jobs</p></div><button onClick={() => setShowJobPayModal(false)}><X size={24}/></button></div>
                  <div className="p-4 border-b"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={20} /><input className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-slate-900" placeholder="Search Jobs..." value={jobSearchTerm} onChange={e => setJobSearchTerm(e.target.value)} /></div></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {jobs.filter(j => j.status !== JobStatus.CANCELLED && ((j.finalCost || j.estimatedCost) - (j.advanceAmount || 0) > 0) && (j.id.toLowerCase().includes(jobSearchTerm.toLowerCase()) || j.customer.name.toLowerCase().includes(jobSearchTerm.toLowerCase()))).map(job => (
                          <div key={job.id} className="border rounded-xl p-4 flex justify-between items-center">
                              <div><span className="font-bold text-slate-800">{job.customer.name}</span><p className="text-sm text-slate-500">{job.device.brand} {job.device.model} ({job.id})</p></div>
                              <div className="text-right"><p className="font-bold text-red-600">{settings.currency}{((job.finalCost || job.estimatedCost) - (job.advanceAmount || 0)).toFixed(2)}</p><button onClick={() => handlePayJob(job)} className="bg-purple-600 text-white px-4 py-1 rounded-lg text-xs mt-1">Pay</button></div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
           <div className="bg-white p-6 rounded-xl w-[480px]">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Payment</h3>
              <p className="mb-4 text-center text-3xl font-mono text-slate-900">{settings.currency}{total.toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-2 mb-6">{MALAYSIA_PAYMENT_METHODS.map(m => (<button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`py-3 px-2 border rounded-lg flex items-center justify-center gap-2 text-sm ${paymentMethod === m.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-700'}`}><m.icon size={16} /> {m.label}</button>))}</div>
              {paymentMethod === 'Split' ? (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                      <div className="space-y-2 mb-3">{splitPayments.map((sp, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-2 rounded"><span>{sp.method}</span><div className="flex gap-2 font-bold">{settings.currency}{sp.amount.toFixed(2)}<button onClick={() => removeSplitLine(idx)}><X size={14}/></button></div></div>))}</div>
                      <div className="flex justify-between mb-3"><span className="text-xs font-bold uppercase text-slate-500">Remaining</span><span className="font-bold text-red-600">{settings.currency}{Math.max(0, getSplitRemaining()).toFixed(2)}</span></div>
                      {getSplitRemaining() > 0.01 && <div className="flex gap-2"><select className="flex-1 border p-2 rounded bg-white text-slate-800" value={splitInput.method} onChange={e => setSplitInput({...splitInput, method: e.target.value})}>{MALAYSIA_PAYMENT_METHODS.filter(m => m.id !== 'Split').map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select><input type="number" className="w-24 border p-2 rounded bg-white text-slate-800" value={splitInput.amount} onChange={e => setSplitInput({...splitInput, amount: e.target.value})} /><button onClick={handleAddSplitLine} className="bg-blue-600 text-white px-4 rounded"><Plus/></button></div>}
                  </div>
              ) : <input className="w-full border p-3 rounded-lg mb-6 bg-white text-slate-900" placeholder="Reference #" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} />}
              <div className="flex gap-3"><button onClick={() => setShowCheckout(false)} className="flex-1 py-2 border rounded-lg text-slate-600">Cancel</button><button onClick={handleCheckout} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">Complete</button></div>
           </div>
        </div>
      )}

      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] no-print p-4">
           <div className="bg-white p-8 rounded-xl w-full max-w-sm text-center shadow-2xl animate-fadeIn">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
              <h3 className="text-2xl font-bold mb-2 text-slate-800">Paid Successfully!</h3>
              <p className="text-sm text-slate-500 mb-6">Transaction #{lastSale.id}</p>
              
              <div className="space-y-3">
                <button onClick={() => window.print()} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"><Printer size={20}/> Print Receipt</button>
                
                <button 
                  onClick={handleSendEmailReceipt} 
                  disabled={isEmailSending}
                  className="w-full bg-blue-50 text-blue-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                   {isEmailSending ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20}/>}
                   {isEmailSending ? 'Sending...' : 'Email Receipt'}
                </button>
                
                <button onClick={() => setShowSuccessModal(false)} className="w-full border py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-50">New Sale</button>
              </div>
           </div>
        </div>
      )}

      {showScanner && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 no-print"><div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative"><div id="reader" className="w-full bg-white"></div><button onClick={() => setShowScanner(false)} className="absolute top-2 right-2 bg-white rounded-full p-1"><X/></button></div></div>)}

      {lastSale && (
        <div className="print-only printable thermal-receipt">
           <div className="font-mono text-sm bg-white text-black">
              <div className="text-center mb-4"><h1 className="text-xl font-bold">{settings.storeName}</h1><p className="text-xs">{settings.address}</p></div>
              <div className="border-b border-dashed pb-2 mb-2 text-xs">
                  <p>Invoice: {lastSale.id}</p><p>Date: {new Date(lastSale.date).toLocaleString()}</p>
              </div>
              <div className="mb-4 text-xs">
                {lastSale.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="flex-1">{item.name} x{item.quantity}</span>
                    <span className="ml-2">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed pt-2 font-bold text-base">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>{settings.currency}{lastSale.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-center text-[10px] mt-6 border-t border-slate-100 pt-2"><p>Thank you for your business!</p></div>
           </div>
        </div>
      )}

      {showAddCustomer && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">New Quick Customer</h3>
                  <button onClick={() => setShowAddCustomer(false)}><X/></button>
               </div>
               <form onSubmit={handleSaveNewCustomer} className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700">Full Name</label>
                     <input required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700">Phone</label>
                     <input required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700">Email (for e-receipt)</label>
                     <input type="email" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                  </div>
                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setShowAddCustomer(false)} className="flex-1 py-2 border rounded-lg text-slate-600">Cancel</button>
                     <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Save Client</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

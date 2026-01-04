
import React, { useState, useEffect } from 'react';
import { Quotation, InventoryItem, Customer, AppSettings, SaleItem, Sale, EInvoiceDetails, QuoteTemplate } from '../types';
import { Plus, Search, FileText, Printer, Mail, CheckCircle, XCircle, Trash2, ArrowRight, Globe, QrCode, Copy, Info, AlertCircle, Zap, Sparkles, Loader2, Building, Hash, X } from 'lucide-react';
import { generateQuoteContent, generateEInvoiceProfile } from '../services/gemini';

const QuoteDocument = ({ 
   quote, 
   viewMode, 
   settings, 
   customers, 
   sales 
}: { 
   quote: Quotation, 
   viewMode: 'quote' | 'invoice', 
   settings: AppSettings, 
   customers: Customer[], 
   sales: Sale[] 
}) => {
   const customer = customers.find(c => c.id === quote.customerId);
   const displayDate = viewMode === 'invoice' && quote.invoiceId ? sales.find(s => s.id === quote.invoiceId)?.date : quote.date;
   const eInvoice = quote.eInvoice;
   const template = quote.template || 'modern';

   useEffect(() => {
     if (quote) { document.title = viewMode === 'invoice' ? `Invoice_${quote.invoiceId || quote.id}` : `Quote_${quote.id}`; }
     return () => { document.title = 'FixMaster Pro'; };
   }, [quote, viewMode]);

   return (
      <div className={`p-12 text-slate-900 bg-white max-w-[210mm] mx-auto min-h-[297mm] template-${template}`}>
         <div className="document-body">
             <div className="flex justify-between items-start mb-8 header">
                <div>
                   {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 mb-4 object-contain" />}
                   <h1 className="text-3xl font-bold text-slate-800">{settings.storeName}</h1>
                   <div className="text-sm text-slate-500 mt-2 space-y-1"><p>{settings.address}</p><p>{settings.email}</p><p>{settings.phone}</p></div>
                </div>
                <div className="text-right">
                   <h2 className="text-4xl font-light text-slate-300 mb-2">{viewMode === 'invoice' ? 'INVOICE' : 'QUOTATION'}</h2>
                   <p className="font-bold text-lg">#{viewMode === 'invoice' ? (quote.invoiceId || 'N/A') : quote.id}</p>
                   <p className="text-sm text-slate-500">Date: {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}</p>
                   <p className="text-sm text-slate-500">{viewMode === 'invoice' ? 'Due: Upon Receipt' : `Expires: ${new Date(quote.expiryDate).toLocaleDateString()}`}</p>
                </div>
             </div>
             <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Bill To</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                   <p className="font-bold text-lg">{customer?.name || 'Unknown'}</p>
                   <p className="text-slate-600">{customer?.phone}</p>
                   {customer?.email && <p className="text-slate-600">{customer.email}</p>}
                </div>

                {eInvoice && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-[10px] grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><p className="font-bold text-slate-400 uppercase">Buyer TIN</p><p className="font-mono text-slate-700">{eInvoice.buyerTin}</p></div>
                        <div><p className="font-bold text-slate-400 uppercase">Reg No.</p><p className="font-mono text-slate-700">{eInvoice.buyerRegNo || 'N/A'}</p></div>
                        <div><p className="font-bold text-slate-400 uppercase">SST No.</p><p className="font-mono text-slate-700">{eInvoice.buyerSst || 'N/A'}</p></div>
                        <div><p className="font-bold text-slate-400 uppercase">MSIC Code</p><p className="font-mono text-slate-700">{eInvoice.buyerMsic}</p></div>
                    </div>
                )}
             </div>
             <table className="w-full mb-8">
                <thead className="table-header">
                   <tr className="border-b-2 border-slate-800 text-sm font-bold text-slate-600">
                      <th className="text-left py-3 px-2">Description</th>
                      <th className="text-center py-3 px-2">Qty</th>
                      <th className="text-right py-3 px-2">Price</th>
                      <th className="text-right py-3 px-2">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {quote.items.map((item, idx) => (
                      <tr key={idx} className="table-row">
                         <td className="py-4 text-sm px-2">{item.name}</td>
                         <td className="py-4 text-center text-sm px-2">{item.quantity}</td>
                         <td className="py-4 text-right text-sm px-2">{settings.currency}{item.price.toFixed(2)}</td>
                         <td className="py-4 text-right font-medium px-2">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
             <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                   <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{settings.currency}{quote.subtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-slate-500"><span>Tax ({(settings.taxRate * 100).toFixed(0)}%)</span><span>{settings.currency}{quote.tax.toFixed(2)}</span></div>
                   <div className="flex justify-between font-bold text-xl pt-4 border-t border-slate-200 totals"><span>Total</span><span>{settings.currency}{quote.total.toFixed(2)}</span></div>
                </div>
             </div>
             <div className="pt-8 border-t border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Terms & Conditions</h4>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{quote.notes || settings.termsAndConditions}</p>
             </div>
         </div>
      </div>
   );
};

interface QuotationsProps {
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  inventory: InventoryItem[];
  customers: Customer[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  addSale: (sale: Sale) => void;
  sales: Sale[];
}

export const Quotations: React.FC<QuotationsProps> = ({ quotations, setQuotations, inventory, customers, settings, setSettings, addSale, sales }) => {
  const [showModal, setShowModal] = useState(false);
  const [viewQuote, setViewQuote] = useState<Quotation | null>(null);
  const [viewMode, setViewMode] = useState<'quote' | 'invoice'>('quote');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [template, setTemplate] = useState<QuoteTemplate>(settings.defaultQuoteTemplate || 'modern');
  const [manualTerms, setManualTerms] = useState(settings.termsAndConditions || '');
  
  const [quickItem, setQuickItem] = useState({ name: '', price: '', qty: '1' });

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [eInvoiceData, setEInvoiceData] = useState<EInvoiceDetails | null>(null);

  const handleGenerateAiTerms = async () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer || items.length === 0) {
        alert("Please select a customer and add items first.");
        return;
    }
    setIsAiGenerating(true);
    try {
        const content = await generateQuoteContent(
            customer.name, 
            items.map(i => ({ name: i.name, price: i.price })), 
            settings.storeName
        );
        setManualTerms(content.terms);
    } catch (e) {
        alert("Failed to generate AI terms.");
    } finally {
        setIsAiGenerating(false);
    }
  };

  const handleGenerateEInvoice = async () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
        alert("Please select a customer first.");
        return;
    }
    setIsAiGenerating(true);
    try {
        const details = await generateEInvoiceProfile(customer.name);
        setEInvoiceData(details);
    } catch (e) {
        alert("Failed to generate E-Invoice details.");
    } finally {
        setIsAiGenerating(false);
    }
  };

  const handleAddItem = (inventoryItem: InventoryItem) => {
     setItems(prev => {
        const existing = prev.find(i => i.inventoryItemId === inventoryItem.id);
        if (existing) { return prev.map(i => i.inventoryItemId === inventoryItem.id ? { ...i, quantity: i.quantity + 1 } : i); }
        return [...prev, { inventoryItemId: inventoryItem.id, sku: inventoryItem.sku, name: inventoryItem.name, quantity: 1, price: inventoryItem.sellingPrice }];
     });
     setItemSearch('');
  };

  const handleAddQuickItem = () => {
    if (!quickItem.name || !quickItem.price) return;
    const price = parseFloat(quickItem.price);
    const quantity = parseInt(quickItem.qty) || 1;
    setItems(prev => [...prev, { inventoryItemId: `QUICK-${Date.now()}`, sku: 'CUSTOM', name: quickItem.name, quantity, price }]);
    setQuickItem({ name: '', price: '', qty: '1' });
  };

  const handleRemoveItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
     if (!selectedCustomerId || items.length === 0) return;
     const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
     const tax = subtotal * settings.taxRate;
     const total = subtotal + tax;
     const newQuote: Quotation = { 
         id: `QT-${Date.now().toString().slice(-6)}`, 
         customerId: selectedCustomerId, 
         date: new Date().toISOString(), 
         expiryDate, 
         items, 
         subtotal, 
         tax, 
         total, 
         status: 'Draft', 
         notes: manualTerms, 
         template,
         eInvoice: eInvoiceData || undefined
     };
     setQuotations([newQuote, ...quotations]);
     setShowModal(false);
     setItems([]); setSelectedCustomerId('');
     setEInvoiceData(null);
  };

  const convertToInvoice = (quote: Quotation) => {
     const invoiceId = `${settings.invoicePrefix}${settings.invoiceNextNumber}`;
     const newSale: Sale = { id: invoiceId, date: new Date().toISOString(), items: quote.items, subtotal: quote.subtotal, tax: quote.tax, total: quote.total, paymentMethod: 'Card', customerId: quote.customerId, status: 'Completed', template: quote.template };
     addSale(newSale);
     setSettings(prev => ({ ...prev, invoiceNextNumber: prev.invoiceNextNumber + 1 }));
     setQuotations(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'Converted', invoiceId } : q));
     alert(`Quote converted to Invoice #${invoiceId}`);
  };

  const filteredQuotes = quotations.filter(q => q.id.includes(searchTerm) || customers.find(c => c.id === q.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()) && itemSearch.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-slate-800">Quotations</h2><p className="text-sm text-slate-500">Estimates and e-invoices</p></div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold"><Plus size={20} /> New Quote</button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {filteredQuotes.map(q => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow">
               <div><h3 className="font-bold text-lg">{q.id} <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 ml-2">{q.status}</span></h3><p className="text-slate-600">{customers.find(c => c.id === q.customerId)?.name}</p></div>
               <div className="flex items-center gap-6"><div className="text-right"><p className="text-xs text-slate-500">Total</p><p className="font-bold">{settings.currency}{q.total.toFixed(2)}</p></div><div className="flex gap-2"><button onClick={() => { setViewQuote(q); setViewMode('quote'); }} className="p-2 hover:bg-slate-100 rounded-full"><Printer size={20} /></button>{q.status === 'Accepted' && <button onClick={() => convertToInvoice(q)} className="p-2 text-green-600 hover:bg-green-50 rounded-full"><CheckCircle size={20} /></button>}</div></div>
            </div>
         ))}
      </div>

      {showModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col animate-fadeIn">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50"><h3 className="text-xl font-bold">New Quotation</h3><button onClick={() => setShowModal(false)}><XCircle className="text-slate-400"/></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="block text-sm font-bold text-slate-700">Customer</label><select className="w-full border p-2 rounded-lg bg-white text-slate-800" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}><option value="">Select...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label className="block text-sm font-bold text-slate-700">Expiry Date</label><input type="date" className="w-full border p-2 rounded-lg bg-white text-slate-800" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>
                        <div><label className="block text-sm font-bold text-slate-700">Template</label><select className="w-full border p-2 rounded-lg bg-white text-slate-800" value={template} onChange={e => setTemplate(e.target.value as any)}><option value="modern">Modern</option><option value="classic">Classic</option><option value="technical">Technical</option></select></div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 text-indigo-700 text-xs font-black uppercase mb-3"><Sparkles size={14} /> AI Assistance</div>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                disabled={!selectedCustomerId || items.length === 0 || isAiGenerating}
                                onClick={handleGenerateAiTerms}
                                className="flex items-center justify-center gap-2 py-2.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 font-bold transition-all disabled:opacity-50 shadow-sm"
                            >
                                {isAiGenerating ? <Loader2 className="animate-spin" size={16}/> : <FileText size={16}/>}
                                Generate Terms
                            </button>
                            <button 
                                type="button"
                                disabled={!selectedCustomerId || isAiGenerating}
                                onClick={handleGenerateEInvoice}
                                className="flex items-center justify-center gap-2 py-2.5 bg-white text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-bold transition-all disabled:opacity-50 shadow-sm"
                            >
                                {isAiGenerating ? <Loader2 className="animate-spin" size={16}/> : <QrCode size={16}/>}
                                E-Invoice Details
                            </button>
                        </div>
                    </div>

                    {eInvoiceData && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fadeIn">
                             <div className="flex justify-between items-center mb-3">
                                 <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Building size={14}/> AI-Generated E-Invoice Details</h4>
                                 <button onClick={() => setEInvoiceData(null)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase">TIN</label>
                                     <input className="w-full bg-white border border-slate-300 rounded p-1 text-sm font-mono text-slate-800" value={eInvoiceData.buyerTin} onChange={e => setEInvoiceData({...eInvoiceData, buyerTin: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase">Reg No</label>
                                     <input className="w-full bg-white border border-slate-300 rounded p-1 text-sm font-mono text-slate-800" value={eInvoiceData.buyerRegNo} onChange={e => setEInvoiceData({...eInvoiceData, buyerRegNo: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase">SST</label>
                                     <input className="w-full bg-white border border-slate-300 rounded p-1 text-sm font-mono text-slate-800" value={eInvoiceData.buyerSst} onChange={e => setEInvoiceData({...eInvoiceData, buyerSst: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase">MSIC</label>
                                     <input className="w-full bg-white border border-slate-300 rounded p-1 text-sm font-mono text-slate-800" value={eInvoiceData.buyerMsic} onChange={e => setEInvoiceData({...eInvoiceData, buyerMsic: e.target.value})} />
                                 </div>
                             </div>
                        </div>
                    )}
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase mb-2"><Zap size={14} /> Quick Add Item</div>
                        <div className="flex gap-2">
                           <input placeholder="Item Description" className="flex-1 border p-2 rounded-lg text-sm bg-white text-slate-800" value={quickItem.name} onChange={e => setQuickItem({...quickItem, name: e.target.value})} />
                           <input placeholder="Price" type="number" className="w-24 border p-2 rounded-lg text-sm bg-white text-slate-800" value={quickItem.price} onChange={e => setQuickItem({...quickItem, price: e.target.value})} />
                           <input placeholder="Qty" type="number" className="w-16 border p-2 rounded-lg text-sm bg-white text-slate-800" value={quickItem.qty} onChange={e => setQuickItem({...quickItem, qty: e.target.value})} />
                           <button onClick={handleAddQuickItem} className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700"><Plus/></button>
                        </div>
                    </div>

                    <div>
                        <div className="relative mb-4"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input placeholder="Search inventory..." className="w-full pl-9 p-2 border rounded-lg bg-white text-slate-800" value={itemSearch} onChange={e => setItemSearch(e.target.value)} />{itemSearch && <div className="absolute top-full left-0 w-full bg-white border shadow-lg rounded-lg mt-1 z-10">{filteredInventory.map(i => <button key={i.id} onClick={() => handleAddItem(i)} className="w-full text-left p-3 hover:bg-slate-50 flex justify-between"><span>{i.name}</span><span className="font-bold">{settings.currency}{i.sellingPrice}</span></button>)}</div>}</div>
                        <table className="w-full border rounded-lg overflow-hidden">
                           <thead className="bg-slate-50"><tr><th className="text-left p-3 text-sm">Item</th><th className="text-center p-3 text-sm w-24">Qty</th><th className="text-right p-3 text-sm w-32">Total</th><th className="w-12"></th></tr></thead>
                           <tbody className="divide-y">{items.map((it, idx) => (<tr key={idx}><td className="p-3 text-sm text-slate-800">{it.name}</td><td className="p-3"><input type="number" className="w-full border rounded p-1 text-center bg-white text-slate-800" value={it.quantity} onChange={e => { const q = parseInt(e.target.value) || 1; setItems(items.map((x, i) => i === idx ? { ...x, quantity: q } : x)); }} /></td><td className="p-3 text-right font-bold text-slate-800">{settings.currency}{(it.price * it.quantity).toFixed(2)}</td><td className="p-3 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-red-400"><Trash2 size={16}/></button></td></tr>))}</tbody>
                        </table>
                    </div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Custom Terms</label><textarea className="w-full border p-3 rounded-lg h-32 text-sm bg-white text-slate-800" value={manualTerms} onChange={e => setManualTerms(e.target.value)} /></div>
                </div>
                <div className="p-6 border-t flex justify-end gap-3 bg-slate-50"><button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg text-slate-600">Cancel</button><button onClick={handleSave} disabled={items.length === 0 || !selectedCustomerId} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">Create Quote</button></div>
            </div>
         </div>
      )}
      {viewQuote && (
         <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[60] overflow-y-auto p-4 py-10 no-print">
             <div className="relative bg-white rounded-xl shadow-2xl max-w-[210mm] w-full min-h-fit printable">
                 <button onClick={() => setViewQuote(null)} className="absolute top-4 -right-12 text-white no-print"><X size={32}/></button>
                 <QuoteDocument quote={viewQuote} viewMode={viewMode} settings={settings} customers={customers} sales={sales} />
                 <div className="sticky bottom-0 left-0 w-full flex justify-center gap-4 p-6 bg-white/80 backdrop-blur-md border-t no-print"><button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2"><Printer size={20}/> Print PDF</button><button onClick={() => setViewQuote(null)} className="bg-white border px-8 py-3 rounded-full font-bold">Close</button></div>
             </div>
         </div>
      )}
    </div>
  );
};

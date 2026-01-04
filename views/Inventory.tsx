
import React, { useState, useEffect } from 'react';
import { InventoryItem, AppSettings, Staff } from '../types';
import { Plus, Search, Tag, DollarSign, RefreshCw, Barcode, AlertTriangle, Printer, Wand2, X, QrCode, Settings, Type, Download, Upload, Package, Pencil, Trash2 } from 'lucide-react';

interface InventoryProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  settings: AppSettings;
  currentUser: Staff | null;
  autoOpenAdd?: boolean;
  onModalHandled?: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, setItems, settings, currentUser, autoOpenAdd, onModalHandled }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'buy_sell' | 'tools'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    category: settings.inventoryCategories[0] || 'Part',
    quantity: 1
  });

  const [viewBarcodeItem, setViewBarcodeItem] = useState<InventoryItem | null>(null);
  
  // Barcode Maker State
  const [makerText, setMakerText] = useState('');
  const [makerType, setMakerType] = useState('code128');
  const [makerIncludeText, setMakerIncludeText] = useState(true);
  const [makerScale, setMakerScale] = useState(3);
  const [qrErrorLevel, setQrErrorLevel] = useState('L');

  // Allowed to delete: Admin, Manager, or Inventory staff
  const canDelete = currentUser?.role === 'Admin' || currentUser?.role === 'Manager' || currentUser?.role === 'Inventory';

  // Handling auto-open trigger from dashboard
  useEffect(() => {
    if (autoOpenAdd) {
       handleOpenAdd();
       if (onModalHandled) onModalHandled();
    }
  }, [autoOpenAdd]);

  // Filter items based on tab and search
  const filteredItems = items.filter(i => 
    (activeTab === 'stock' ? i.category !== 'UsedDevice' : i.category === 'UsedDevice') &&
    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.toLowerCase().includes(searchTerm.toLowerCase()) || i.barcode?.includes(searchTerm))
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      category: settings.inventoryCategories[0] || 'Part',
      quantity: 1,
      name: '',
      sku: '',
      barcode: '',
      costPrice: 0,
      sellingPrice: 0,
      lowStockThreshold: 5
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
       alert("Access Denied: You do not have permission to delete inventory items.");
       return;
    }
    
    if (window.confirm("Are you sure you want to delete this item from inventory? This cannot be undone.")) {
      setItems(prev => prev.filter(i => String(i.id) !== String(id)));
      setShowModal(false);
      setEditingItem(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      // Update Existing
      const updatedItem = { ...editingItem, ...formData } as InventoryItem;
      setItems(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i));
    } else {
      // Add New
      const newItem: InventoryItem = {
        ...(formData as InventoryItem),
        id: Math.random().toString(36).substr(2, 9),
        sku: formData.sku || `SKU-${Date.now()}`
      };
      setItems(prev => [newItem, ...prev]);
    }
    
    setShowModal(false);
    setEditingItem(null);
  };

  const generateBarcode = () => {
    const randomBarcode = Math.floor(Math.random() * 89999999 + 10000000).toString();
    setFormData(prev => ({ ...prev, barcode: randomBarcode }));
  };
  
  const handlePrintBarcode = (text: string, title?: string, price?: number, type: string = 'code128', scale: number = 3, ecLevel: string = 'L', includeText: boolean = true) => {
     const printWindow = window.open('', '', 'height=600,width=600');
     if (printWindow) {
        printWindow.document.write('<html><head><title>Print Barcode</title><style>body { font-family: sans-serif; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; } .label { border: 1px dashed #ccc; padding: 20px; display: flex; flex-direction: column; align-items: center; min-width: 200px; max-width: 300px; }</style></head><body>');
        printWindow.document.write('<div class="label">');
        if (title) printWindow.document.write(`<h2 style="margin: 0 0 10px 0; font-size: 16px;">${title}</h2>`);
        
        const includeTextParam = (includeText && type !== 'qrcode') ? 'Y' : 'N';
        let url = `https://bwipjs-api.metafloor.com/?bcid=${type}&text=${encodeURIComponent(text)}&scale=${scale}&incltext=${includeTextParam}`;
        if (type === 'qrcode') {
          url += `&eclevel=${ecLevel}`;
        }
        
        printWindow.document.write(`<img src="${url}" style="max-width: 100%;" />`);
        
        if (type === 'qrcode' && includeText) {
           printWindow.document.write(`<p style="margin: 5px 0 0 0; font-family: monospace; font-size: 12px; word-break: break-all;">${text}</p>`);
        }
        
        if (price) printWindow.document.write(`<p style="margin: 10px 0 0 0; font-weight: bold; font-size: 18px;">${settings.currency}${price}</p>`);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
     }
  };
  
  const exportToCSV = () => {
     const headers = ['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Cost Price', 'Selling Price', 'Low Stock Threshold', 'Barcode'];
     const rows = filteredItems.map(item => [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`, 
        item.sku,
        item.category,
        item.quantity,
        item.costPrice,
        item.sellingPrice,
        item.lowStockThreshold,
        item.barcode || ''
     ]);
     
     const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `Inventory_${new Date().toISOString().split('T')[0]}.csv`;
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
        const newItems: InventoryItem[] = [];
        
        for (let i = 1; i < lines.length; i++) {
           const line = lines[i].trim();
           if (!line) continue;
           
           const cols = line.split(',');
           if (cols.length >= 7) {
              newItems.push({
                 id: cols[0] || `IMP-${Date.now()}-${i}`,
                 name: cols[1].replace(/"/g, '') || 'Imported Item',
                 sku: cols[2] || 'SKU',
                 category: cols[3] || 'Part',
                 quantity: parseInt(cols[4]) || 0,
                 costPrice: parseFloat(cols[5]) || 0,
                 sellingPrice: parseFloat(cols[6]) || 0,
                 lowStockThreshold: parseInt(cols[7]) || 0,
                 barcode: cols[8] || undefined
              });
           }
        }
        
        if (newItems.length > 0) {
           setItems(prev => [...prev, ...newItems]);
           alert(`Successfully imported ${newItems.length} items.`);
        }
     };
     reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
        <div className="flex bg-white rounded-lg shadow-sm border p-1">
            <button 
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'stock' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}>
              Parts & Stock
            </button>
            <button 
              onClick={() => setActiveTab('buy_sell')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'buy_sell' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>
              Used Devices (Buy/Sell)
            </button>
            <button 
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'tools' ? 'bg-purple-50 text-purple-600' : 'text-slate-500'}`}>
              Barcode Tools
            </button>
        </div>
      </div>

      {activeTab === 'tools' ? (
         <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
               <div className="flex items-center gap-4 mb-8 border-b pb-6">
                 <div className="bg-purple-100 p-3 rounded-xl">
                    {makerType === 'qrcode' ? <QrCode size={32} className="text-purple-600"/> : <Barcode size={32} className="text-purple-600"/>} 
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Standalone Barcode Maker</h3>
                    <p className="text-slate-500">Generate, preview, and print custom barcodes for labels or products.</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Barcode Type</label>
                        <select
                          className="w-full border p-3 rounded-lg bg-white text-slate-800"
                          value={makerType}
                          onChange={e => setMakerType(e.target.value)}
                        >
                           <option value="code128">Code 128 (Standard)</option>
                           <option value="qrcode">QR Code</option>
                           <option value="ean13">EAN-13 (Retail)</option>
                           <option value="upca">UPC-A (US Retail)</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
                        <div className="relative">
                           <Type className="absolute left-3 top-3 text-slate-400" size={18}/>
                           <input 
                              list="inventory-options"
                              className="w-full border p-3 pl-10 rounded-lg font-mono focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-900"
                              placeholder={makerType === 'qrcode' ? "https://example.com or Select SKU" : "ITEM-001 or Select SKU"}
                              value={makerText}
                              onChange={e => setMakerText(e.target.value)}
                           />
                           <datalist id="inventory-options">
                              {items.map(i => (
                                 <option key={i.id} value={i.sku}>{i.name}</option>
                              ))}
                           </datalist>
                        </div>
                     </div>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between">
                           <label className="block text-sm font-bold text-slate-700">Size (Scale)</label>
                           <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 rounded">{makerScale}x</span>
                        </div>
                        <input
                           type="range"
                           min="1"
                           max="5"
                           step="0.5"
                           value={makerScale}
                           onChange={e => setMakerScale(parseFloat(e.target.value))}
                           className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                     </div>
                     
                     {makerType === 'qrcode' && (
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Error Correction</label>
                           <select
                              className="w-full border p-3 rounded-lg bg-white text-slate-800"
                              value={qrErrorLevel}
                              onChange={e => setQrErrorLevel(e.target.value)}
                           >
                              <option value="L">Level L (Low, 7%)</option>
                              <option value="M">Level M (Medium, 15%)</option>
                              <option value="Q">Level Q (Quartile, 25%)</option>
                              <option value="H">Level H (High, 30%)</option>
                           </select>
                        </div>
                     )}

                     <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <input 
                           type="checkbox" 
                           id="incText" 
                           checked={makerIncludeText} 
                           onChange={e => setMakerIncludeText(e.target.checked)}
                           className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="incText" className="text-sm font-medium text-slate-700 cursor-pointer">
                           Include text label below barcode
                        </label>
                     </div>

                     <button 
                        disabled={!makerText}
                        onClick={() => handlePrintBarcode(makerText, 'Custom Label', undefined, makerType, makerScale, qrErrorLevel, makerIncludeText)}
                        className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-purple-200"
                     >
                        <Printer size={20} /> Print Label
                     </button>
                  </div>

                  <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 min-h-[300px] relative">
                     <span className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Preview Output</span>
                     {makerText ? (
                        <div className="bg-white p-6 shadow-md border rounded-xl flex flex-col items-center animate-fadeIn min-w-[200px]">
                           <h2 className="text-base font-bold mb-2 text-slate-800">Custom Label</h2>
                           <img 
                              src={`https://bwipjs-api.metafloor.com/?bcid=${makerType}&text=${encodeURIComponent(makerText)}&scale=${makerScale}&incltext=${(makerIncludeText && makerType !== 'qrcode') ? 'Y' : 'N'}&guardwhitespace=false${makerType === 'qrcode' ? `&eclevel=${qrErrorLevel}`:''}`} 
                              alt="Preview" 
                              className="max-w-full h-auto object-contain mx-auto"
                           />
                           {makerType === 'qrcode' && makerIncludeText && (
                              <p className="mt-2 font-mono text-sm text-slate-600 max-w-[200px] break-all text-center">{makerText}</p>
                           )}
                        </div>
                     ) : (
                        <div className="text-center text-slate-400">
                           <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                              {makerType === 'qrcode' ? <QrCode size={32} className="opacity-20 text-slate-900" /> : <Barcode size={32} className="opacity-20 text-slate-900" />}
                           </div>
                           <p className="font-medium">Enter content to generate preview</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      ) : (
         <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search name, SKU, or Barcode..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                 <button onClick={exportToCSV} className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                    <Download size={18}/> Export
                 </button>
                 <label className="bg-white border text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Upload size={18}/> Import
                    <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                 </label>
                 <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-medium shadow-sm">
                   <Plus size={20} /> Add Item
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => {
                const isLowStock = item.quantity <= item.lowStockThreshold;
                return (
                  <div key={item.id} className={`group rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 ${isLowStock ? 'bg-red-50 border-red-500 shadow-red-500/10' : 'bg-white border-slate-100'}`}>
                    <div className={`h-2 w-full ${isLowStock ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.category}</span>
                        {isLowStock && (
                          <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded border border-red-200">
                             <AlertTriangle size={12} /> LOW STOCK
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight">{item.name}</h3>
                      
                      <div className="flex items-center justify-between mb-2 h-6">
                         {item.barcode ? (
                            <button 
                               onClick={(e) => { e.stopPropagation(); setViewBarcodeItem(item); }}
                               className="text-xs text-slate-500 flex items-center gap-1 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
                            >
                               <Barcode size={14}/> {item.barcode}
                            </button>
                         ) : (
                            <span className="text-[10px] text-slate-300 italic">No Barcode</span>
                         )}
                         <div className="flex gap-1 opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenEdit(item); }} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"><Pencil size={16}/></button>
                            {canDelete && (
                               <button 
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(item.id); }} 
                                  className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                  title="Delete Item"
                               >
                                  <Trash2 size={16}/>
                                </button>
                            )}
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Sell Price</p>
                          <p className="text-xl font-black text-blue-600">{settings.currency}{item.sellingPrice}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Stock</p>
                          <p className={`font-mono font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                            {item.quantity} units
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  <Package size={48} className="mx-auto mb-2 opacity-20"/>
                  <p>No inventory items found matching your criteria.</p>
                </div>
              )}
            </div>
         </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <Package size={24} className="text-blue-600"/>
                    {editingItem ? `Edit Stock Item` : `Add ${activeTab === 'stock' ? 'Inventory Item' : 'Used Device'}`}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-1 transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Item Name / Model</label>
                 <input 
                    required 
                    autoFocus
                    placeholder="e.g. iPhone 13 Screen Replacement" 
                    className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">SKU / Code</label>
                    <input 
                       required 
                       placeholder="e.g. SCR-IP13" 
                       className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono bg-white text-slate-900"
                       value={formData.sku || ''} 
                       onChange={e => setFormData({...formData, sku: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Barcode</label>
                    <div className="flex gap-2">
                       <input 
                          placeholder="Scan or Enter" 
                          className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono bg-white text-slate-900"
                          value={formData.barcode || ''} 
                          onChange={e => setFormData({...formData, barcode: e.target.value})} 
                       />
                       <button 
                          type="button" 
                          onClick={generateBarcode}
                          className="bg-slate-100 border p-2.5 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          title="Generate Random Barcode"
                       >
                          <Wand2 size={20} />
                       </button>
                    </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                    <select 
                       className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all text-slate-900"
                       value={formData.category} 
                       onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                       {settings.inventoryCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Low Stock Alert Level</label>
                    <input 
                       type="number" 
                       placeholder="5" 
                       className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                       value={formData.lowStockThreshold || 0} 
                       onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})} 
                    />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Current Quantity</label>
                    <input 
                       type="number" 
                       className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white text-slate-900"
                       value={formData.quantity || 0} 
                       onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} 
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Cost Price</label>
                    <div className="relative">
                       <span className="absolute left-2 top-2.5 text-slate-400 text-xs">{settings.currency}</span>
                       <input 
                          type="number" 
                          step="0.01"
                          className="w-full pl-6 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                          value={formData.costPrice || 0} 
                          onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} 
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Selling Price</label>
                    <div className="relative">
                       <span className="absolute left-2 top-2.5 text-slate-400 text-xs">{settings.currency}</span>
                       <input 
                          type="number" 
                          step="0.01"
                          className="w-full pl-6 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600 bg-white"
                          value={formData.sellingPrice || 0} 
                          onChange={e => setFormData({...formData, sellingPrice: parseFloat(e.target.value)})} 
                       />
                    </div>
                 </div>
              </div>
              
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <div>
                   {editingItem && canDelete && (
                      <button 
                         type="button" 
                         onClick={() => handleDelete(editingItem.id)} 
                         className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100 shadow-sm"
                      >
                         <Trash2 size={18}/> Delete Item
                      </button>
                   )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all">Cancel</button>
                  <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                     {editingItem ? 'Save Changes' : 'Add to Inventory'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewBarcodeItem && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center relative shadow-2xl">
               <button onClick={() => setViewBarcodeItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
               <div className="p-3 bg-blue-50 w-fit mx-auto rounded-2xl mb-4">
                  <Barcode size={32} className="text-blue-600" />
               </div>
               <h3 className="font-black text-xl mb-1 text-slate-800">{viewBarcodeItem.name}</h3>
               <p className="text-sm text-slate-400 mb-6 font-mono">{viewBarcodeItem.sku}</p>
               
               <div className="bg-white p-6 border-2 border-slate-100 rounded-2xl inline-block mb-6 shadow-sm w-full">
                  <img 
                     src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${viewBarcodeItem.barcode}&scale=3`} 
                     alt="Barcode" 
                     className="w-full h-auto object-contain max-h-24"
                  />
                  <p className="font-mono text-lg mt-4 tracking-[0.3em] font-bold text-slate-600">{viewBarcodeItem.barcode}</p>
               </div>
               
               <div className="flex gap-3 justify-center">
                  <button onClick={() => setViewBarcodeItem(null)} className="flex-1 px-4 py-3 border-2 border-slate-100 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition-all">Close</button>
                  <button onClick={() => handlePrintBarcode(viewBarcodeItem.barcode || '', viewBarcodeItem.name, viewBarcodeItem.sellingPrice)} className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-black flex items-center justify-center gap-2 font-black shadow-lg transition-all active:scale-95">
                     <Printer size={18} /> Print Label
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

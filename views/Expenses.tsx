
import React, { useState, useRef, useEffect } from 'react';
import { ExpenseDocument, ExpenseCategory, AppSettings } from '../types';
import { Plus, Search, Upload, Camera, X, FileText, DollarSign, Calendar, Eye, Pencil, Trash2 } from 'lucide-react';

interface ExpensesProps {
  settings: AppSettings;
  documents: ExpenseDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ExpenseDocument[]>>;
}

const CATEGORIES: ExpenseCategory[] = [
  'Bank Statement',
  'Sales Invoice',
  'Purchase Invoice',
  'Payment Voucher',
  'Cash Voucher',
  'Other'
];

export const Expenses: React.FC<ExpensesProps> = ({ settings, documents, setDocuments }) => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState<ExpenseDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<ExpenseDocument | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ExpenseDocument>>({
    category: 'Payment Voucher',
    date: new Date().toISOString().split('T')[0],
    imageUrl: ''
  });

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filteredDocs = documents.filter(doc => 
    (activeTab === 'All' || doc.category === activeTab) &&
    (doc.description.toLowerCase().includes(searchTerm.toLowerCase()) || doc.amount.toString().includes(searchTerm))
  );

  const handleOpenNew = () => {
    setEditingDoc(null);
    setFormData({ 
      category: 'Payment Voucher', 
      date: new Date().toISOString().split('T')[0], 
      imageUrl: '',
      description: '',
      amount: undefined
    });
    setShowModal(true);
  };

  const handleEdit = (doc: ExpenseDocument) => {
    setEditingDoc(doc);
    setFormData({
      ...doc,
      date: doc.date.split('T')[0] // Ensure date input format
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure permissions are granted.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFormData(prev => ({ ...prev, imageUrl: ev.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.category) return;

    if (editingDoc) {
      // Update existing
      setDocuments(prev => prev.map(d => d.id === editingDoc.id ? {
        ...editingDoc,
        description: formData.description!,
        amount: Number(formData.amount),
        date: formData.date || new Date().toISOString(),
        category: formData.category as ExpenseCategory,
        imageUrl: formData.imageUrl || ''
      } : d));
    } else {
      // Add new
      const newDoc: ExpenseDocument = {
        id: `EXP-${Date.now()}`,
        description: formData.description!,
        amount: Number(formData.amount),
        date: formData.date || new Date().toISOString(),
        category: formData.category as ExpenseCategory,
        imageUrl: formData.imageUrl || ''
      };
      setDocuments(prev => [newDoc, ...prev]);
    }

    setShowModal(false);
    stopCamera();
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Expense Filing System</h2>
        <button 
          onClick={handleOpenNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold shadow-sm"
        >
          <Plus size={20} /> New Entry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg shadow-sm border p-1 overflow-x-auto">
         <button 
           onClick={() => setActiveTab('All')}
           className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === 'All' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
         >
           All Files
         </button>
         {CATEGORIES.map(cat => (
           <button 
             key={cat}
             onClick={() => setActiveTab(cat)}
             className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${activeTab === cat ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             {cat}
           </button>
         ))}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search expenses by description or amount..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
            <div className="h-40 bg-slate-100 relative flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setShowPreview(doc)}>
              {doc.imageUrl ? (
                 doc.imageUrl.startsWith('data:application/pdf') ? (
                    <div className="text-slate-500 flex flex-col items-center p-4 bg-white h-full w-full justify-center">
                       <FileText size={40} className="text-red-500 mb-2"/>
                       <span className="text-xs font-bold text-red-600">PDF Document</span>
                    </div>
                 ) : (
                    <img src={doc.imageUrl} alt="Receipt" className="w-full h-full object-cover" />
                 )
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <FileText size={32} />
                  <span className="text-xs mt-2">No Image</span>
                </div>
              )}
              {doc.imageUrl?.startsWith('data:application/pdf') && (
                 <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">PDF</div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-4">
                <button onClick={(e) => { e.stopPropagation(); setShowPreview(doc); }} className="p-2 bg-white/20 rounded-full hover:bg-white/40"><Eye size={20} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(doc); }} className="p-2 bg-white/20 rounded-full hover:bg-white/40"><Pencil size={20} /></button>
              </div>
            </div>
            <div className="p-4 flex-1">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">
                     {doc.category}
                  </span>
                  <span className="text-slate-400 text-xs">{new Date(doc.date).toLocaleDateString()}</span>
               </div>
               <h3 className="font-bold text-slate-800 truncate mb-1" title={doc.description}>{doc.description}</h3>
               <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-lg font-bold text-red-600">
                     <span className="text-xs text-red-400">{settings.currency}</span>
                     {doc.amount.toFixed(2)}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed">
            <FileText size={48} className="mx-auto mb-2 opacity-20"/>
            <p>No expense documents found.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-auto animate-fadeIn">
            <div className="flex justify-between items-center p-6 border-b bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold">{editingDoc ? 'Edit Expense' : 'File Expense Document'}</h3>
              <button onClick={() => { setShowModal(false); stopCamera(); }} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1 font-bold">Document Type</label>
                 <select 
                    className="w-full border p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                 >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1 font-bold">Description / Title</label>
                 <input 
                    required 
                    placeholder="e.g. Office Rent, Supplier X Invoice" 
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-bold">Amount</label>
                    <div className="relative">
                       <DollarSign size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                       <input 
                          type="number" 
                          step="0.01"
                          required 
                          className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-red-600 bg-white"
                          value={formData.amount || ''}
                          onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                       />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 font-bold">Date</label>
                    <input 
                       type="date" 
                       required 
                       className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                       value={formData.date || ''}
                       onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-2 pt-2">
                 <label className="block text-sm font-medium text-slate-700 font-bold">Document Image / Receipt</label>
                 
                 {isCameraOpen ? (
                   <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                     <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                     <canvas ref={canvasRef} className="hidden" />
                     <button 
                        type="button"
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-slate-100 transition-transform active:scale-95"
                     >
                        <div className="w-6 h-6 rounded-full bg-red-500 ring-4 ring-slate-200"></div>
                     </button>
                     <button 
                        type="button"
                        onClick={stopCamera}
                        className="absolute top-2 right-2 text-white bg-black/50 p-1.5 rounded-full hover:bg-black/70"
                     >
                        <X size={20}/>
                     </button>
                   </div>
                 ) : formData.imageUrl ? (
                   <div className="relative h-48 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group">
                      {formData.imageUrl.startsWith('data:application/pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4">
                             <FileText size={48} className="text-red-500 mb-2"/>
                             <p className="text-xs font-bold">PDF Attached</p>
                          </div>
                      ) : (
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                      )}
                     <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            type="button" 
                            onClick={() => setFormData({...formData, imageUrl: ''})}
                            className="bg-white p-1.5 rounded-full shadow-md hover:bg-red-50 text-red-500"
                            title="Remove image"
                        >
                            <Trash2 size={16}/>
                        </button>
                     </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 gap-4">
                      <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <Upload size={24} className="text-slate-400 mb-2"/>
                        <span className="text-sm font-medium text-slate-600">Upload File</span>
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                      </label>
                      <button 
                        type="button"
                        onClick={startCamera}
                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Camera size={24} className="text-slate-400 mb-2"/>
                        <span className="text-sm font-medium text-slate-600">Take Picture</span>
                      </button>
                   </div>
                 )}
               </div>

               <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                  <button type="button" onClick={() => { setShowModal(false); stopCamera(); }} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-200">
                    {editingDoc ? 'Update Document' : 'Save Document'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreview && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={() => setShowPreview(null)}>
            <div className="max-w-4xl w-full max-h-[90vh] relative flex flex-col items-center animate-fadeIn" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowPreview(null)} className="absolute -top-12 right-0 text-white hover:text-slate-300 flex items-center gap-2 font-bold">
                    <X size={24}/> Close
                </button>
                {showPreview.imageUrl.startsWith('data:application/pdf') ? (
                    <iframe src={showPreview.imageUrl} className="w-full h-[80vh] bg-white rounded-lg shadow-2xl" title="PDF View"></iframe>
                ) : (
                    <img src={showPreview.imageUrl} alt="Full View" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl bg-white p-2" />
                )}
               <div className="bg-black/60 backdrop-blur-md text-white text-center mt-4 p-4 rounded-xl w-full flex justify-between items-center shadow-lg border border-white/10">
                  <div className="text-left">
                    <p className="font-bold text-lg">{showPreview.description}</p>
                    <p className="text-xs text-slate-300">{showPreview.category} • {new Date(showPreview.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-400">{settings.currency}{showPreview.amount.toFixed(2)}</p>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

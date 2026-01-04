import React, { useState, useEffect, useRef } from 'react';
import { JobSheet, Staff, AppSettings, InventoryItem, Customer, JobStatus, TCTemplate, SaleItem, DiagnosisResult } from '../types';
import { 
  Plus, Search, Wrench, User, Smartphone, FileText, 
  Save, X, ChevronDown, ChevronUp, Tag, MessageCircle, 
  Printer, CheckCircle, Clock, AlertCircle, Trash2, XCircle, DollarSign, Loader2, Lock, Grid3x3, KeyRound,
  Camera, Upload, Image as ImageIcon, PenTool, Package, RefreshCw, Zap, Sparkles, HandCoins, Mail,
  Activity, ExternalLink, Lightbulb
} from 'lucide-react';
import { summarizeJobNotes, getAIDiagnosis } from '../services/gemini';

// --- Signature Pad Component ---
const SignaturePad = ({ onChange, initialValue }: { onChange: (sig: string) => void, initialValue?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);

  useEffect(() => {
    if (initialValue && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => { ctx?.drawImage(img, 0, 0); };
        img.src = initialValue;
    }
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
      return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
          const { x, y } = getCoords(e);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
      }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) { const { x, y } = getCoords(e); ctx.lineTo(x, y); ctx.stroke(); }
  };

  const stopDrawing = () => {
      if (isDrawing && canvasRef.current) {
          setIsDrawing(false);
          const dataUrl = canvasRef.current.toDataURL('image/png');
          onChange(dataUrl); setHasSignature(true);
      }
  };

  const clear = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          onChange(''); setHasSignature(false);
      }
  };

  return (
      <div className="w-full">
          <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden relative touch-none">
              <canvas 
                  ref={canvasRef} width={500} height={150}
                  className="w-full h-32 cursor-crosshair block"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
              />
              {!hasSignature && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"><p className="text-xl font-bold text-slate-400">Sign Here</p></div>}
          </div>
          <div className="flex justify-end mt-1"><button type="button" onClick={clear} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"><Trash2 size={12}/> Clear Signature</button></div>
      </div>
  );
};

// --- Job Invoice Component ---
const JobInvoice = ({ job, settings }: { job: JobSheet, settings: AppSettings }) => {
  const template = settings.termsTemplates?.find(t => t.id === job.selectedTCTemplateId) || settings.termsTemplates?.find(t => t.id === settings.defaultTCTemplateId);
  const terms = template?.content || settings.termsAndConditions;

  return (
    <div className="bg-white text-slate-900 font-sans p-12 max-w-[210mm] mx-auto min-h-[297mm] relative shadow-none border-0">
      <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-slate-800">
        <div>
           {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 mb-4 object-contain" />}
           <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-800">{settings.storeName}</h1>
           <div className="text-sm text-slate-500 mt-2 space-y-1">
              <p>{settings.address}</p>
              <p>{settings.phone}</p>
              <p>{settings.email}</p>
           </div>
        </div>
        <div className="text-right">
           <h2 className="text-4xl font-light text-slate-300 mb-2">INVOICE</h2>
           <p className="font-bold text-xl text-slate-800">#{job.id}</p>
           <p className="text-sm text-slate-500">Date: {new Date(job.createdAt).toLocaleDateString()}</p>
           <p className="text-sm text-slate-500">Status: <span className="uppercase font-bold text-slate-700">{job.status}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-12">
         <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Customer</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
               <p className="font-bold text-lg text-slate-800">{job.customer.name}</p>
               <p className="text-slate-600">{job.customer.phone}</p>
               {job.customer.email && <p className="text-slate-600">{job.customer.email}</p>}
            </div>
         </div>
         <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Device Details</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
               <p className="font-bold text-lg text-slate-800">{job.device.brand} {job.device.model}</p>
               <p className="text-sm text-slate-600"><span className="font-semibold">SN/IMEI:</span> {job.device.serialNumber || 'N/A'}</p>
               <p className="text-sm text-slate-600"><span className="font-semibold">Condition:</span> {job.device.condition}</p>
               <p className="text-sm text-slate-600"><span className="font-semibold">Accessories:</span> {job.device.accessories}</p>
            </div>
         </div>
      </div>

      <div className="mb-12">
         <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Service & Parts Details</h3>
         <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
               <thead className="bg-slate-50 border-b">
                  <tr>
                     <th className="px-6 py-3 text-left font-bold text-slate-600">Description</th>
                     <th className="px-6 py-3 text-center font-bold text-slate-600 w-24">Qty</th>
                     <th className="px-6 py-3 text-right font-bold text-slate-600 w-32">Amount</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {job.parts && job.parts.length > 0 ? (
                     <>
                        {job.parts.map((part, i) => (
                           <tr key={i}>
                              <td className="px-6 py-4">
                                 <p className="font-medium text-slate-800">{part.name}</p>
                                 <p className="text-[10px] text-slate-400 font-mono">{part.sku}</p>
                              </td>
                              <td className="px-6 py-4 text-center">{part.quantity}</td>
                              <td className="px-6 py-4 text-right font-medium text-slate-800">
                                 {settings.currency}{(part.price * part.quantity).toFixed(2)}
                              </td>
                           </tr>
                        ))}
                        {(() => {
                           const partsSum = job.parts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
                           const totalTarget = job.finalCost || job.estimatedCost;
                           const labor = totalTarget - partsSum;
                           if (labor > 0.01) {
                              return (
                                 <tr>
                                    <td className="px-6 py-4">
                                       <p className="font-medium text-slate-800">Service / Labor Charges</p>
                                       <p className="text-xs text-slate-500">Expert repair service fee</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">1</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                                       {settings.currency}{labor.toFixed(2)}
                                    </td>
                                 </tr>
                              );
                           }
                           return null;
                        })()}
                     </>
                  ) : (
                     <tr>
                        <td className="px-6 py-4">
                           <p className="font-bold text-slate-800">Repair Service</p>
                           <p className="text-slate-600 mt-1">Issue Reported: {job.issueDescription}</p>
                           {job.technicianNotes && <p className="text-slate-500 mt-2 italic text-xs bg-slate-50 p-2 rounded border border-slate-100 inline-block">Tech Note: {job.technicianNotes}</p>}
                        </td>
                        <td className="px-6 py-4 text-center">1</td>
                        <td className="px-6 py-4 text-right align-top font-bold text-slate-800">
                           {settings.currency}{(job.finalCost || job.estimatedCost).toFixed(2)}
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <div className="flex justify-end mb-16">
         <div className="w-72 space-y-3">
            <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
               <span>Total Amount</span>
               <span className="font-medium">{settings.currency}{(job.finalCost || job.estimatedCost).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
               <span>Advance Paid</span>
               <span className="text-green-600">- {settings.currency}{job.advanceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl pt-2">
               <span>Balance Due</span>
               <span className="text-blue-600">{settings.currency}{((job.finalCost || job.estimatedCost) - job.advanceAmount).toFixed(2)}</span>
            </div>
         </div>
      </div>

      <div className="border-t-2 border-slate-100 pt-8 mt-auto">
         <div className="grid grid-cols-2 gap-12">
            <div>
               <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Terms & Conditions</h4>
               <p className="text-[10px] text-slate-500 leading-relaxed text-justify whitespace-pre-wrap">{terms}</p>
            </div>
            <div className="flex flex-col justify-end">
               <div className="border-b border-slate-300 mb-2 h-16 flex items-end justify-center">
                  {job.customerSignature && <img src={job.customerSignature} alt="Customer Signature" className="max-h-full max-w-full object-contain mb-1" />}
               </div>
               <p className="text-center text-xs font-bold text-slate-400 uppercase">Customer Signature</p>
            </div>
         </div>
         <div className="mt-8 text-center text-[10px] text-slate-300">Generated by {settings.storeName} Management System</div>
      </div>
    </div>
  );
};

// --- Pattern Lock Component ---
interface PatternLockProps { onChange: (pattern: string) => void; initialValue?: string; }
const PatternLock: React.FC<PatternLockProps> = ({ onChange, initialValue }) => {
  const [path, setPath] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (initialValue && initialValue.startsWith('Pattern: ')) {
      const nums = initialValue.replace('Pattern: ', '').split('-').map(Number).filter(n => !isNaN(n)); setPath(nums);
    } else if (!initialValue) { setPath([]); }
  }, [initialValue]);
  const getCoordinates = (index: number) => {
    const row = Math.floor(index / 3); const col = index % 3; return { x: col * 50 + 25, y: row * 50 + 25 };
  };
  const handleStart = (index: number) => { setPath([index]); setIsDrawing(true); };
  const handleMove = (index: number) => {
    if (isDrawing && !path.includes(index)) {
      const last = path[path.length - 1]; const lastRow = Math.floor(last / 3); const lastCol = last % 3;
      const currRow = Math.floor(index / 3); const currCol = index % 3;
      if (Math.abs(lastRow - currRow) === 0 && Math.abs(lastCol - currCol) === 2) { const mid = last + (index > last ? 1 : -1); if (!path.includes(mid)) setPath(prev => [...prev, mid]); }
      else if (Math.abs(lastRow - currRow) === 2 && Math.abs(lastCol - currCol) === 0) { const mid = last + (index > last ? 3 : -3); if (!path.includes(mid)) setPath(prev => [...prev, mid]); }
      else if (Math.abs(lastRow - currRow) === 2 && Math.abs(lastCol - currCol) === 2) { const mid = (last + index) / 2; if (!path.includes(mid)) setPath(prev => [...prev, mid]); }
      setPath(prev => [...prev, index]);
    }
  };
  const handleEnd = () => { setIsDrawing(false); if (path.length > 0) { onChange(`Pattern: ${path.join('-')}`); } else { onChange(''); } };
  useEffect(() => {
    const endDrawing = () => { if(isDrawing) handleEnd(); };
    window.addEventListener('mouseup', endDrawing); return () => window.removeEventListener('mouseup', endDrawing);
  }, [isDrawing, path]);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[200px] bg-slate-50 rounded-xl border border-slate-200 shadow-inner touch-none select-none" onMouseLeave={handleEnd}>
        <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 150 150" className="absolute inset-0 pointer-events-none">
            {path.map((node, i) => {
                if (i === 0) return null; const prev = getCoordinates(path[i-1]); const curr = getCoordinates(node);
                return <line key={i} x1={prev.x} y1={prev.y} x2={curr.x} y2={curr.y} stroke="#2563eb" strokeWidth="4" strokeLinecap="round" className="animate-fadeIn" />;
            })}
        </svg>
        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="flex items-center justify-center">
                    <div onPointerDown={(e) => { e.preventDefault(); handleStart(i); }} onPointerEnter={(e) => { e.preventDefault(); handleMove(i); }}
                        className={`w-4 h-4 rounded-full transition-all duration-200 cursor-pointer z-10 ${path.includes(i) ? 'bg-blue-600 scale-125 ring-4 ring-blue-100' : 'bg-slate-300 hover:bg-slate-400'}`} />
                </div>
            ))}
        </div>
      </div>
      <button type="button" onClick={() => { setPath([]); onChange(''); }} className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"><Trash2 size={12}/> Clear Pattern</button>
    </div>
  );
};

const Accordion = ({ title, icon: Icon, children, defaultOpen = false, summary }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
           <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-500'}`}><Icon size={20} /></div>
           <div className="text-left"><span className="font-bold text-slate-700 block">{title}</span>{summary && !isOpen && <span className="text-xs text-slate-500">{summary}</span>}</div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
      </button>
      {isOpen && <div className="p-4 border-t border-slate-100 animate-fadeIn">{children}</div>}
    </div>
  );
};

interface JobsProps {
  jobs: JobSheet[];
  setJobs: React.Dispatch<React.SetStateAction<JobSheet[]>>;
  staff: Staff[];
  settings: AppSettings;
  addSale: (sale: any) => void;
  inventory: InventoryItem[];
  autoOpenNew?: boolean;
  customers: Customer[];
  preselectedCustomerId?: string | null;
  onJobCreationHandled?: () => void;
  setView?: (view: string) => void;
  currentUser: Staff | null;
}

export const Jobs: React.FC<JobsProps> = ({ jobs, setJobs, staff, settings, addSale, inventory, autoOpenNew, customers, preselectedCustomerId, onJobCreationHandled, setView, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobSheet | null>(null);
  const [formData, setFormData] = useState<Partial<JobSheet>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [printingJob, setPrintingJob] = useState<JobSheet | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizingJobId, setSummarizingJobId] = useState<string | null>(null);
  
  const [accessoryInput, setAccessoryInput] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  
  const [conditionInput, setConditionInput] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  // AI Diagnosis State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [aiResult, setAiResult] = useState<DiagnosisResult | null>(null);

  const [jobParts, setJobParts] = useState<SaleItem[]>([]);
  const [partSearch, setPartSearch] = useState('');
  const [quickPart, setQuickPart] = useState({ name: '', price: '', qty: '1' });

  const [passcodeMode, setPasscodeMode] = useState<'text' | 'pattern'>('text');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canDelete = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  useEffect(() => { if (autoOpenNew) handleNewJob(); }, [autoOpenNew]);
  useEffect(() => {
     if (preselectedCustomerId && showModal) {
         const cust = customers.find(c => c.id === preselectedCustomerId);
         if (cust) setFormData(prev => ({ ...prev, customer: cust }));
         if (onJobCreationHandled) onJobCreationHandled();
     }
  }, [preselectedCustomerId, showModal, customers]);

  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) { videoRef.current.srcObject = streamRef.current; }
  }, [isCameraOpen]);

  useEffect(() => { return () => { if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; } }; }, []);

  const handleNewJob = () => {
    setEditingJob(null);
    setFormData({
      status: JobStatus.PENDING,
      customer: { id: `NEW-${Date.now()}`, name: '', phone: '', email: '', createdAt: new Date().toISOString() },
      device: { type: 'Smartphone', brand: '', model: '', serialNumber: '', condition: '', accessories: '', password: '' },
      estimatedCost: 0, advanceAmount: 0, createdAt: new Date().toISOString(), images: [], customerSignature: '',
      selectedTCTemplateId: settings.defaultTCTemplateId || ''
    });
    setSelectedAccessories([]); setSelectedConditions([]); setJobParts([]);
    setPasscodeMode('text'); setAiResult(null); setShowModal(true);
  };

  const handleEditJob = (job: JobSheet) => {
    setEditingJob(job);
    setFormData(JSON.parse(JSON.stringify(job)));
    const accString = job.device.accessories || '';
    setSelectedAccessories(accString ? accString.split(',').map(s => s.trim()).filter(s => s) : []);
    const condString = job.device.condition || '';
    setSelectedConditions(condString ? condString.split(',').map(s => s.trim()).filter(s => s) : []);
    setJobParts(job.parts || []);
    setAiResult(job.aiDiagnosis || null);
    if (job.device.password?.startsWith('Pattern:')) setPasscodeMode('pattern');
    else setPasscodeMode('text');
    setShowModal(true);
  };

  const handleDiagnose = async () => {
    if (!formData.device?.model || !formData.issueDescription) {
      alert("Please enter device model and problem description first.");
      return;
    }
    setIsDiagnosing(true);
    const result = await getAIDiagnosis(formData.device.model, formData.issueDescription);
    if (result) {
       setAiResult(result);
       setFormData(prev => ({ ...prev, aiDiagnosis: result }));
    } else {
       alert("AI could not provide a diagnosis at this time.");
    }
    setIsDiagnosing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer?.name || !formData.device?.model) return;

    if (!formData.customerSignature || formData.customerSignature.trim() === '') {
        alert('Customer authorization is required. Please have the customer sign the authorization box in the "Costing & Authorization" section.');
        return;
    }

    const updatedDevice = { 
        ...formData.device!, 
        accessories: selectedAccessories.join(', '),
        condition: selectedConditions.join(', ')
    };
    if (editingJob) {
       const updatedJob = { ...formData, device: updatedDevice, parts: jobParts, aiDiagnosis: aiResult || undefined } as JobSheet;
       if (updatedJob.status !== editingJob.status) {
           updatedJob.history = [...(updatedJob.history || []), { status: updatedJob.status, date: new Date().toISOString(), note: `Status updated to ${updatedJob.status}` }];
       }
       setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    } else {
       const newJob: JobSheet = {
          ...formData as JobSheet, id: `JOB-${Date.now().toString().slice(-4)}`,
          createdAt: new Date().toISOString(), expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          device: updatedDevice, parts: jobParts, history: [{ status: JobStatus.PENDING, date: new Date().toISOString(), note: 'Job Created' }],
          images: formData.images || [], aiDiagnosis: aiResult || undefined
       };
       setJobs(prev => [newJob, ...prev]);
    }
    setShowModal(false);
  };

  const handleDeleteJob = (id: string) => {
    if (!canDelete) {
       alert("Access Denied: Only Admin or Manager can delete repair tickets.");
       return;
    }
    if (window.confirm("Are you sure you want to delete this repair ticket? This action cannot be undone.")) {
       setJobs(prev => prev.filter(j => String(j.id) !== String(id)));
       setShowModal(false);
       setEditingJob(null);
    }
  };

  const addPart = (invItem: InventoryItem) => {
     setJobParts(prev => {
        const existing = prev.find(p => p.inventoryItemId === invItem.id);
        if (existing) return prev.map(p => p.inventoryItemId === invItem.id ? { ...p, quantity: p.quantity + 1 } : p);
        return [...prev, { inventoryItemId: invItem.id, sku: invItem.sku, name: invItem.name, quantity: 1, price: invItem.sellingPrice }];
     });
     setPartSearch('');
  };

  const addQuickPart = () => {
    if (!quickPart.name || !quickPart.price) return;
    const price = parseFloat(quickPart.price);
    const qty = parseInt(quickPart.qty) || 1;
    setJobParts(prev => [...prev, { inventoryItemId: `QUICK-${Date.now()}`, sku: 'LABOR', name: quickPart.name, quantity: qty, price }]);
    setQuickPart({ name: '', price: '', qty: '1' });
  };

  const removePart = (idx: number) => setJobParts(prev => prev.filter((_, i) => i !== idx));

  const applyPartsToEstimate = () => {
      const partsSum = jobParts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
      const labor = 50; 
      setFormData(prev => ({ ...prev, estimatedCost: partsSum + labor }));
  };

  const toggleAccessory = (acc: string) => {
      if (selectedAccessories.includes(acc)) setSelectedAccessories(prev => prev.filter(a => a !== acc));
      else setSelectedAccessories(prev => [...prev, acc]);
  };

  const toggleCondition = (cond: string) => {
      if (selectedConditions.includes(cond)) setSelectedConditions(prev => prev.filter(c => c !== cond));
      else setSelectedConditions(prev => [...prev, cond]);
  };

  const startCamera = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); streamRef.current = stream; setIsCameraOpen(true); }
    catch (err) { alert("Could not access camera."); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
            canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0); const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setFormData(prev => ({ ...prev, images: [...(prev.images || []), dataUrl] }));
            if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
            setIsCameraOpen(false);
        }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFormData(prev => ({ ...prev, images: [...(prev.images || []), ev.target!.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (idx: number) => {
    setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }));
  };

  const formatWhatsAppMessage = (data: Partial<JobSheet>, template: string) => {
      if (!data.customer || !data.device) return "";
      let msg = template.replace('{customer}', data.customer.name).replace('{device}', `${data.device.brand} ${data.device.model}`).replace('{ticket}', data.id || 'New').replace('{status}', data.status || 'Pending').replace('{total}', `${settings.currency}${data.finalCost || data.estimatedCost}`).replace('{link}', `${window.location.origin}?view=tracking&jobId=${data.id}`);
      return encodeURIComponent(msg);
  };

  const handleSendWhatsApp = (phone: string, message: string) => {
     let p = phone.replace(/\D/g, ''); if (p.startsWith('0')) p = '60' + p.slice(1);
     const finalMsg = message.includes('%') ? message : encodeURIComponent(message);
     window.open(`https://wa.me/${p}?text=${finalMsg}`, '_blank');
  };

  const generateAndSendAISummary = async (job: Partial<JobSheet>) => {
    if (!job.technicianNotes) {
        alert("Please enter technician notes first to generate an AI summary.");
        return;
    }
    setSummarizingJobId(job.id || 'current');
    setIsSummarizing(true);
    try {
        const summary = await summarizeJobNotes(job.technicianNotes);
        const header = `Hello ${job.customer?.name},\n\nUpdate for your ${job.device?.brand} ${job.device?.model} (Ticket: ${job.id}):\n\n`;
        const footer = `\n\nTrack status: ${window.location.origin}?view=tracking&jobId=${job.id}`;
        const finalMessage = header + summary + footer;
        if (job.customer?.phone) { handleSendWhatsApp(job.customer.phone, finalMessage); }
        else { alert("Customer phone number is missing."); }
    } catch (error) {
        alert("Failed to generate AI summary. Please try again.");
    } finally {
        setIsSummarizing(false);
        setSummarizingJobId(null);
    }
  };

  const filteredJobs = jobs.filter(j => j.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || j.id.toLowerCase().includes(searchTerm.toLowerCase()) || j.device.model.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredInventory = inventory.filter(i => (i.name.toLowerCase().includes(partSearch.toLowerCase()) || i.sku.toLowerCase().includes(partSearch.toLowerCase())) && partSearch.length > 1);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div><h2 className="text-2xl font-bold text-slate-800">Repair Tickets</h2><p className="text-sm text-slate-500">Intake, diagnosis, and workflow management.</p></div>
         <button onClick={handleNewJob} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold shadow-sm"><Plus size={20} /> New Repair Job</button>
       </div>
       <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
         <div className="relative">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
           <input type="text" placeholder="Search by name, model or ticket #" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
         </div>
       </div>
      <div className="grid grid-cols-1 gap-4">
         {filteredJobs.map(job => (
            <div key={job.id} onClick={() => handleEditJob(job)} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm">{job.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase animate-fadeIn ${job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-700' : job.status === JobStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{job.status}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600">{job.customer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500">{job.customer.phone}</p>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleSendWhatsApp(job.customer.phone, formatWhatsAppMessage(job, settings.whatsappTemplates.statusUpdate)); }} className="text-green-600 hover:bg-green-50 p-1 rounded-full transition-colors"><MessageCircle size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPrintingJob(job); }} className="p-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg transition-all"><Printer size={16}/></button>
                      {canDelete && <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteJob(job.id); }} className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-400">Created</p><p className="text-sm font-medium text-slate-700">{new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
               </div>
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-4"><div className="bg-white p-3 rounded-full shadow-sm text-slate-400"><Smartphone size={24} /></div><div className="flex-1"><p className="font-bold text-slate-700">{job.device.brand} {job.device.model}</p><p className="text-sm text-slate-500 line-clamp-1">{job.issueDescription}</p></div><div className="text-right"><p className="text-xs text-slate-400">Est. Cost</p><p className="font-bold text-lg text-slate-800">{settings.currency}{job.estimatedCost}</p></div></div>
            </div>
         ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10"><div><h3 className="text-xl font-bold text-slate-800">{editingJob ? `Edit Ticket ${editingJob.id}` : 'New Repair Job'}</h3><p className="text-sm text-slate-500">Comprehensive device intake and diagnosis</p></div><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button></div>
              <div className="p-6 overflow-y-auto space-y-6 bg-slate-50"><form id="jobForm" onSubmit={handleSave}>
                      <Accordion title="Customer Details" icon={User} defaultOpen={!editingJob} summary={formData.customer?.name}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Existing Client</label>
                             <select className="w-full border p-2 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={customers.some(c => c.id === formData.customer?.id) ? formData.customer?.id : ''} onChange={(e) => { const cust = customers.find(c => c.id === e.target.value); if (cust) setFormData(prev => ({ ...prev, customer: { ...cust } })); }}><option value="">+ Create New Customer</option>{customers.map(c => (<option key={c.id} value={c.id}>{c.name} - {c.phone}</option>))}</select>
                           </div>
                           <div className="md:col-span-2">
                             <label className="text-sm font-medium text-slate-700">Customer Name</label>
                             <input required className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={formData.customer?.name || ''} onChange={e => setFormData(prev => ({...prev, customer: { ...prev.customer!, name: e.target.value }}))} />
                           </div>
                           <div><label className="text-sm font-medium text-slate-700">Phone</label><input required className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={formData.customer?.phone || ''} onChange={e => setFormData(prev => ({...prev, customer: { ...prev.customer!, phone: e.target.value }}))} /></div>
                           <div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={formData.customer?.email || ''} onChange={e => setFormData(prev => ({...prev, customer: { ...prev.customer!, email: e.target.value }}))} /></div>
                         </div>
                      </Accordion>

                      <Accordion title="Device Information" icon={Smartphone} defaultOpen={true} summary={`${formData.device?.brand || ''} ${formData.device?.model || ''}`}>
                          <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-sm font-medium text-slate-700">Brand</label><input list="brands" className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={formData.device?.brand || ''} onChange={e => setFormData(prev => ({...prev, device: { ...prev.device!, brand: e.target.value }}))} /><datalist id="brands">{settings.deviceBrands.map(b => <option key={b} value={b} />)}</datalist></div>
                             <div><label className="text-sm font-medium text-slate-700">Model</label><input className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={formData.device?.model || ''} onChange={e => setFormData(prev => ({...prev, device: { ...prev.device!, model: e.target.value }}))} /></div>
                             <div><label className="text-sm font-medium text-slate-700">Serial / IMEI</label><input className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm bg-white text-slate-900" value={formData.device?.serialNumber || ''} onChange={e => setFormData(prev => ({...prev, device: { ...prev.device!, serialNumber: e.target.value }}))} /></div>
                             <div>
                               <label className="text-sm font-medium text-slate-700 mb-1 block">Unlock Method</label>
                               <div className="bg-slate-100 p-1 rounded-lg flex mb-2">
                                  <button type="button" onClick={() => setPasscodeMode('text')} className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${passcodeMode === 'text' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>PIN/Text</button>
                                  <button type="button" onClick={() => setPasscodeMode('pattern')} className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${passcodeMode === 'pattern' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Pattern</button>
                               </div>
                               {passcodeMode === 'text' ? <input className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" placeholder="PIN or Password" value={formData.device?.password || ''} onChange={e => setFormData(prev => ({...prev, device: { ...prev.device!, password: e.target.value }}))} /> : <div className="flex justify-center p-2 border rounded-lg bg-white border-slate-200"><PatternLock initialValue={formData.device?.password} onChange={(pattern) => setFormData(prev => ({...prev, device: { ...prev.device!, password: pattern }}))} /></div>}
                             </div>
                             
                             <div className="col-span-2 mt-4">
                                <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2"><AlertCircle size={16} className="text-indigo-500"/> Device Intake Condition</label>
                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
                                   <div className="flex items-center gap-2 mb-3">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                         {settings.commonConditions.map(cond => (
                                            <button 
                                              key={cond} 
                                              type="button" 
                                              onClick={() => toggleCondition(cond)} 
                                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border-2 transition-all ${selectedConditions.includes(cond) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300'}`}
                                            >
                                              {cond}
                                            </button>
                                         ))}
                                      </div>
                                   </div>
                                   <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border-2 border-slate-200 min-h-[60px] shadow-inner items-center">
                                      {selectedConditions.map((cond, idx) => (
                                         <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight flex items-center gap-2 border border-indigo-100 animate-fadeIn">
                                            {cond}
                                            <button type="button" onClick={() => toggleCondition(cond)} className="text-indigo-300 hover:text-red-500 transition-colors">
                                               <XCircle size={14} />
                                            </button>
                                         </span>
                                      ))}
                                      <input 
                                         className="flex-1 min-w-[150px] outline-none text-sm bg-transparent placeholder:text-slate-300 font-medium text-slate-900" 
                                         placeholder="Type other conditions..." 
                                         value={conditionInput} 
                                         onChange={e => setConditionInput(e.target.value)} 
                                         onKeyDown={e => { 
                                            if (e.key === 'Enter' && conditionInput.trim()) { 
                                               e.preventDefault(); 
                                               if (!selectedConditions.includes(conditionInput.trim())) setSelectedConditions(p => [...p, conditionInput.trim()]); 
                                               setConditionInput(''); 
                                            } 
                                         }} 
                                      />
                                   </div>
                                </div>
                             </div>

                             <div className="col-span-2 mt-4">
                                <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2"><Zap size={16} className="text-blue-500"/> Accessories Included</label>
                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
                                   <div className="flex items-center gap-2 mb-3">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Add:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                         {settings.commonAccessories.map(acc => (
                                            <button 
                                              key={acc} 
                                              type="button" 
                                              onClick={() => toggleAccessory(acc)} 
                                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border-2 transition-all ${selectedAccessories.includes(acc) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-300'}`}
                                            >
                                              {acc}
                                            </button>
                                         ))}
                                      </div>
                                   </div>
                                   <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border-2 border-slate-200 min-h-[60px] shadow-inner items-center">
                                      {selectedAccessories.map((acc, idx) => (
                                         <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight flex items-center gap-2 border border-blue-100 animate-fadeIn">
                                            {acc}
                                            <button type="button" onClick={() => toggleAccessory(acc)} className="text-blue-300 hover:text-red-500 transition-colors">
                                               <XCircle size={14} />
                                            </button>
                                         </span>
                                      ))}
                                      <input 
                                         className="flex-1 min-w-[150px] outline-none text-sm bg-transparent placeholder:text-slate-300 font-medium text-slate-900" 
                                         placeholder="Type other accessories..." 
                                         value={accessoryInput} 
                                         onChange={e => setAccessoryInput(e.target.value)} 
                                         onKeyDown={e => { 
                                            if (e.key === 'Enter' && accessoryInput.trim()) { 
                                               e.preventDefault(); 
                                               if (!selectedAccessories.includes(accessoryInput.trim())) setSelectedAccessories(p => [...p, accessoryInput.trim()]); 
                                               setAccessoryInput(''); 
                                            } 
                                         }} 
                                      />
                                   </div>
                                </div>
                             </div>

                             <div className="col-span-2 mt-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Device Photos (Before Repair)</label>
                                <div className="flex flex-wrap gap-3 mb-3">
                                   {formData.images?.map((img, idx) => (
                                      <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 group shadow-sm">
                                         <img src={img} alt={`Device ${idx}`} className="w-full h-full object-cover" />
                                         <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 size={20}/></button>
                                      </div>
                                   ))}
                                   <button type="button" onClick={startCamera} className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
                                      <Camera size={24} />
                                      <span className="text-[10px] mt-1 font-black uppercase tracking-tight">Snap</span>
                                   </button>
                                   <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                                      <Upload size={24} />
                                      <span className="text-[10px] mt-1 font-black uppercase tracking-tight">Upload</span>
                                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                   </label>
                                </div>
                             </div>
                          </div>
                      </Accordion>

                      <Accordion title="Diagnosis & Repair Details" icon={Zap} defaultOpen={true}>
                          <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm font-medium text-slate-700">Problem Description</label>
                                  <button 
                                      type="button"
                                      onClick={handleDiagnose}
                                      disabled={isDiagnosing || !formData.device?.model || !formData.issueDescription}
                                      className="text-xs flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-full font-bold hover:bg-purple-700 transition-all disabled:opacity-50 shadow-sm"
                                  >
                                      {isDiagnosing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                      {isDiagnosing ? "Analyzing..." : "Diagnose with AI"}
                                  </button>
                                </div>
                                <textarea required className="w-full border p-2 rounded-lg mt-1 h-24 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" placeholder="Customer reported issues..." value={formData.issueDescription || ''} onChange={e => setFormData(prev => ({...prev, issueDescription: e.target.value}))} />
                            </div>

                            {/* AI Diagnosis Result Area */}
                            {aiResult && (
                               <div className="bg-white border-2 border-purple-100 rounded-xl p-5 shadow-sm animate-fadeIn">
                                  <div className="flex items-center justify-between mb-4 border-b border-purple-50 pb-2">
                                     <div className="flex items-center gap-2 text-purple-700">
                                        <Activity size={20} />
                                        <h4 className="font-bold uppercase tracking-wider text-xs">AI Diagnostic Insight</h4>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400">DIFF: {aiResult.difficulty}/10</span>
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                           <div className={`h-full ${aiResult.difficulty > 7 ? 'bg-red-500' : 'bg-purple-500'}`} style={{width: `${aiResult.difficulty * 10}%`}} />
                                        </div>
                                     </div>
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed mb-4">{aiResult.summary}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Potential Causes</p>
                                        <ul className="space-y-1">
                                           {aiResult.causes.map((c, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span> {c}</li>)}
                                        </ul>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Recommended Steps</p>
                                        <ul className="space-y-1">
                                           {aiResult.steps.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-2"><span className="text-blue-400 mt-0.5">{i+1}.</span> {s}</li>)}
                                        </ul>
                                     </div>
                                  </div>
                                  {aiResult.sources && aiResult.sources.length > 0 && (
                                     <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 mr-2">SOURCES:</span>
                                        {aiResult.sources.map((s, i) => (
                                           <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded">
                                              {s.title} <ExternalLink size={8}/>
                                           </a>
                                        ))}
                                     </div>
                                  )}
                               </div>
                            )}
                            
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm font-medium text-slate-700">Technician Internal Notes</label>
                                    <button 
                                        type="button"
                                        onClick={() => generateAndSendAISummary(formData)}
                                        disabled={isSummarizing || !formData.technicianNotes}
                                        className="text-xs flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 font-bold hover:bg-green-100 transition-all disabled:opacity-50"
                                    >
                                        {isSummarizing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                        {isSummarizing ? "Summarizing..." : "WhatsApp AI Update"}
                                    </button>
                                </div>
                                <textarea 
                                    className="w-full border p-2 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900" 
                                    placeholder="Work performed, parts used, test results..."
                                    value={formData.technicianNotes || ''} 
                                    onChange={e => setFormData(prev => ({...prev, technicianNotes: e.target.value}))} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium text-slate-700">Assigned Technician</label><select className="w-full border p-2 rounded-lg mt-1 bg-white text-slate-900" value={formData.assignedTechnicianId || ''} onChange={e => setFormData(prev => ({...prev, assignedTechnicianId: e.target.value}))}><option value="">Unassigned</option>{staff.filter(s => s.role === 'Technician' || s.role === 'Admin').map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
                                <div><label className="text-sm font-medium text-slate-700">Workflow Status</label><select className="w-full border p-2 rounded-lg mt-1 bg-white text-slate-900" value={formData.status || JobStatus.PENDING} onChange={e => setFormData(prev => ({...prev, status: e.target.value as JobStatus}))}>{Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            </div>
                          </div>
                      </Accordion>

                      <Accordion title="Parts, Costing & Authorization" icon={HandCoins} defaultOpen={false}>
                          <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase mb-3"><Zap size={14} /> Spare Parts Selection</div>
                                <div className="relative mb-4">
                                   <Search className="absolute left-3 top-3 text-slate-400" size={16}/>
                                   <input placeholder="Search and add parts from inventory..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" value={partSearch} onChange={e => setPartSearch(e.target.value)} />
                                   {filteredInventory.length > 0 && (
                                      <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl mt-1 z-20 max-h-48 overflow-y-auto">
                                         {filteredInventory.map(item => (
                                            <button key={item.id} type="button" onClick={() => addPart(item)} className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b flex justify-between items-center"><div className="flex-1"><p className="font-bold text-sm text-slate-800">{item.name}</p><p className="text-[10px] text-slate-400 uppercase font-mono">{item.sku} | Stock: {item.quantity}</p></div><span className="font-bold text-blue-600">{settings.currency}{item.sellingPrice}</span></button>
                                         ))}
                                      </div>
                                   )}
                                </div>
                                {jobParts.length > 0 && (
                                   <div className="space-y-2 mb-4">
                                      {jobParts.map((p, i) => (
                                         <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border shadow-sm"><div className="flex items-center gap-2"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">{p.quantity}x</span><p className="text-sm font-medium text-slate-800">{p.name}</p></div><div className="flex items-center gap-3"><span className="font-bold text-sm text-slate-800">{settings.currency}{(p.price * p.quantity).toFixed(2)}</span><button type="button" onClick={() => removePart(i)} className="text-red-400 hover:text-red-600"><X size={16}/></button></div></div>
                                      ))}
                                      <button type="button" onClick={applyPartsToEstimate} className="w-full mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 border border-blue-200 py-2 rounded-lg bg-white/50 hover:bg-white transition-all"><RefreshCw size={12}/> Apply Parts Total to Estimate</button>
                                   </div>
                                )}
                                <div className="grid grid-cols-3 gap-2">
                                   <input placeholder="Manual Charge" className="col-span-1 border p-2 rounded-lg text-sm bg-white text-slate-900" value={quickPart.name} onChange={e => setQuickPart({...quickPart, name: e.target.value})} />
                                   <input placeholder="Price" type="number" className="border p-2 rounded-lg text-sm bg-white text-slate-900" value={quickPart.price} onChange={e => setQuickPart({...quickPart, price: e.target.value})} />
                                   <button type="button" onClick={addQuickPart} className="bg-blue-600 text-white rounded-lg flex items-center justify-center"><Plus size={20}/></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                 <div><label className="text-sm font-medium text-slate-700">Grand Total (Estimated)</label><div className="relative mt-1"><span className="absolute left-3 top-2 text-slate-400">{settings.currency}</span><input type="number" className="w-full pl-8 p-2 border rounded-lg font-bold text-blue-600 text-lg bg-white" value={formData.estimatedCost || ''} onChange={e => setFormData(prev => ({...prev, estimatedCost: parseFloat(e.target.value)}))} /></div></div>
                                 <div><label className="text-sm font-medium text-slate-700">Advance Paid</label><div className="relative mt-1"><span className="absolute left-3 top-2 text-slate-400">{settings.currency}</span><input type="number" className="w-full pl-8 p-2 border rounded-lg text-lg bg-white text-slate-900" value={formData.advanceAmount || ''} onChange={e => setFormData(prev => ({...prev, advanceAmount: parseFloat(e.target.value)}))} /></div></div>
                                 
                                 <div className="col-span-2 pt-4 border-t">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Terms & Conditions Template</label>
                                    <select className="w-full border p-2 rounded-lg bg-white text-slate-900" value={formData.selectedTCTemplateId || ''} onChange={e => setFormData(prev => ({...prev, selectedTCTemplateId: e.target.value}))}><option value="">System Default</option>{settings.termsTemplates?.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</select>
                                 </div>

                                 <div className="col-span-2 pt-4"><label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><PenTool size={16}/> Intake Authorization (Sign Below) <span className="text-red-500">*</span></label><SignaturePad initialValue={formData.customerSignature} onChange={(sig) => setFormData(prev => ({...prev, customerSignature: sig}))} /><p className="text-[10px] text-slate-400 mt-2 italic text-center uppercase font-bold tracking-widest">Client Signature Confirms Agreement to T&C</p></div>
                          </div>
                      </Accordion>
                  </form></div>
              <div className="p-6 border-t bg-white rounded-b-xl flex justify-end gap-3 sticky bottom-0 items-center">
                 {editingJob && canDelete && (
                    <button type="button" onClick={() => handleDeleteJob(editingJob.id)} className="px-6 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold flex items-center gap-2 transition-all mr-auto">
                       <Trash2 size={18} /> Delete Ticket
                    </button>
                 )}
                 {editingJob && (<button type="button" onClick={() => setPrintingJob(formData as JobSheet)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-bold shadow-md flex items-center gap-2 transition-all"><Printer size={18} /> Print Invoice</button>)}
                 <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg text-slate-600">Cancel</button>
                 <button type="submit" form="jobForm" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md">Save Ticket</button>
              </div>
           </div>
        </div>
      )}
      {printingJob && (
        <div className="fixed inset-0 z-[100] bg-slate-100 overflow-y-auto py-10 printable-container">
          <div className="max-w-[210mm] mx-auto min-h-screen bg-white shadow-2xl relative printable">
            <div className="flex justify-end p-4 gap-4 no-print sticky top-0 bg-white/95 border-b z-[110] shadow-sm">
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"><Printer size={18}/> Print / Save PDF</button>
              <button onClick={() => setPrintingJob(null)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-300 active:scale-95 transition-all">Close Preview</button>
            </div>
            <div className="bg-white">
              <JobInvoice job={printingJob} settings={settings} />
            </div>
          </div>
        </div>
      )}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center no-print"><div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10"><h3 className="text-white font-bold text-lg">Intake Photo</h3><button onClick={() => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); }} className="p-2 bg-white/20 rounded-full text-white"><X size={24}/></button></div><div className="w-full h-full relative flex items-center justify-center bg-black"><video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full object-contain shadow-2xl" /><canvas ref={canvasRef} className="hidden" /></div><div className="absolute bottom-0 left-0 w-full p-8 flex justify-center pb-12"><button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center transition-transform active:scale-90"><div className="w-16 h-16 rounded-full bg-white border-2 border-black"></div></button></div></div>
      )}
    </div>
  );
};

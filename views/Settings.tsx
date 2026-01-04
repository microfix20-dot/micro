
import React, { useState } from 'react';
import { AppSettings, Staff, PrintSettings, WhatsAppTemplates, StaffRole, TCTemplate, MyInvoisSettings, PaymentGatewayConfig } from '../types';
import { 
  Save, Upload, UserPlus, Trash2, Check, X, Plus, Printer, Database, Download, 
  MessageCircle, AlertCircle, LogOut, KeyRound, Globe, Cloud, CloudOff, RefreshCw, 
  CreditCard, LayoutTemplate, AlertTriangle, FileText, User, Settings as SettingsIcon, 
  MapPin, Phone, Mail, DollarSign, Percent, Building, Smartphone, Tag, Layers, 
  UserCheck, Palette, Lock, Pencil, Zap, Briefcase, Hash, Info, Coins, Receipt, ShieldCheck, CheckCircle
} from 'lucide-react';
import { handleAuthClick, handleSignOut, initializeGoogleDrive } from '../services/googleDrive';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  onBackup: () => string;
  onRestore: (json: string) => void;
  onReset: () => void;
  currentUser: Staff | null;
  onLogout: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Slate', value: '#475569' },
  { name: 'Black', value: '#0f172a' },
];

const ListEditor = ({ title, items, onAdd, onRemove, icon: Icon }: { title: string, items: string[], onAdd: (val: string) => void, onRemove: (val: string) => void, icon: any }) => {
  const [val, setVal] = useState('');
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full group hover:border-blue-200 transition-all">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
           <Icon size={18} />
        </div>
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
      <div className="flex gap-2 mb-4">
        <input 
          className="border-2 border-slate-100 p-2 rounded-xl flex-1 text-sm focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white" 
          value={val} 
          onChange={e => setVal(e.target.value)} 
          placeholder={`Tambah ${title.toLowerCase()}...`} 
          onKeyDown={e => {
             if (e.key === 'Enter' && val.trim()) {
                onAdd(val.trim());
                setVal('');
             }
          }}
        />
        <button 
          onClick={() => { if(val.trim()) { onAdd(val.trim()); setVal(''); } }} 
          className="bg-slate-900 text-white px-4 rounded-xl hover:bg-black transition-all active:scale-95 shadow-md"
        >
          <Plus size={18}/>
        </button>
      </div>
      <div className="flex flex-wrap gap-2 overflow-y-auto max-h-40 pr-2 scrollbar-hide">
        {items.map((item, i) => (
          <span key={i} className="bg-white border-2 border-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all">
            {item} 
            <button onClick={() => onRemove(item)} className="text-slate-300 hover:text-red-500 transition-colors">
              <X size={14}/>
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-slate-400 italic py-4 w-full text-center">Tiada item ditetapkan</span>}
      </div>
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ settings, setSettings, staff, setStaff, onBackup, onRestore, onReset, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'General' | 'Finance' | 'Templates' | 'E-Invoice' | 'Staff' | 'My Profile' | 'Lists' | 'Printing' | 'Notifications' | 'Backup & Restore' | 'Payments'>('General');
  const [newStaff, setNewStaff] = useState({ name: '', username: '', email: '', role: 'Technician' as StaffRole, pin: '' });
  const [profileData, setProfileData] = useState({ 
    name: currentUser?.name || '', 
    email: currentUser?.email || '', 
    pin: currentUser?.pin || '' 
  });

  const [newTemplateName, setNewTemplateName] = useState('');

  const handleChange = (key: keyof AppSettings, value: any) => {
     setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePrintChange = (key: keyof PrintSettings, value: any) => {
     setSettings(prev => ({
        ...prev,
        printSettings: { ...prev.printSettings, [key]: value }
     }));
  };

  const handleWhatsAppChange = (key: keyof WhatsAppTemplates, value: string) => {
     setSettings(prev => ({
        ...prev,
        whatsappTemplates: { ...prev.whatsappTemplates, [key]: value }
     }));
  };

  const handleMyInvoisChange = (key: keyof MyInvoisSettings, value: any) => {
     setSettings(prev => ({
        ...prev,
        myInvois: { ...(prev.myInvois || { environment: 'Sandbox', clientId: '', clientSecret: '', digitalCertPass: '', isConfigured: false }), [key]: value }
     }));
  };

  const handlePaymentGatewayChange = (provider: string, key: keyof PaymentGatewayConfig, value: any) => {
    setSettings(prev => ({
      ...prev,
      paymentGateways: prev.paymentGateways.map(pg => pg.provider === provider ? { ...pg, [key]: value } : pg)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          handleChange('logoUrl', ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addTCTemplate = () => {
    if (!newTemplateName) return;
    const newT: TCTemplate = {
       id: `TC-${Date.now()}`,
       name: newTemplateName,
       content: 'Masukkan terma dan syarat di sini...'
    };
    setSettings(prev => ({
       ...prev,
       termsTemplates: [...(prev.termsTemplates || []), newT]
    }));
    setNewTemplateName('');
 };

 const updateTCTemplate = (id: string, content: string) => {
    setSettings(prev => ({
       ...prev,
       termsTemplates: prev.termsTemplates.map(t => t.id === id ? { ...t, content } : t)
    }));
 };

 const deleteTCTemplate = (id: string) => {
    if (settings.defaultTCTemplateId === id) {
       alert("Tidak boleh padam template laluan (default). Tukar default dahulu.");
       return;
    }
    setSettings(prev => ({
       ...prev,
       termsTemplates: prev.termsTemplates.filter(t => t.id !== id)
    }));
 };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.pin) return;
    const staffObj: Staff = {
      id: `STAFF-${Date.now()}`,
      ...newStaff,
      username: newStaff.email.split('@')[0],
      active: true
    };
    setStaff([...staff, staffObj]);
    setNewStaff({ name: '', username: '', email: '', role: 'Technician', pin: '' });
  };

  const toggleStaffActive = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteStaff = (id: string) => {
    if (id === currentUser?.id) {
       alert("Anda tidak boleh memadam akaun sendiri.");
       return;
    }
    if (window.confirm("Padam kakitangan ini?")) {
       setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setStaff(prev => prev.map(s => s.id === currentUser.id ? { ...s, ...profileData } : s));
    alert("Profil berjaya dikemaskini!");
  };

  const handleDownloadBackup = () => {
    const data = onBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FixMaster_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sistem Konfigurasi</h2>
            <p className="text-slate-500 font-medium">Uruskan identiti perniagaan, kewangan, dan e-invois LHDN.</p>
         </div>
         <button onClick={onLogout} className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
            <LogOut size={20}/> Logout
         </button>
      </div>
      
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full overflow-x-auto scrollbar-hide">
         {[
           { id: 'General', icon: Globe },
           { id: 'Finance', icon: DollarSign },
           { id: 'Lists', icon: Layers },
           { id: 'Templates', icon: LayoutTemplate },
           { id: 'Printing', icon: Printer },
           { id: 'Notifications', icon: MessageCircle },
           { id: 'Staff', icon: UserCheck },
           { id: 'My Profile', icon: User },
           { id: 'E-Invoice', icon: Building },
           { id: 'Backup & Restore', icon: Database },
           { id: 'Payments', icon: CreditCard }
         ].map((tab) => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
           >
             <tab.icon size={16}/> {tab.id}
           </button>
         ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] overflow-hidden">
         
         {/* NOTIFICATIONS TAB */}
         {activeTab === 'Notifications' && (
            <div className="p-8 space-y-10 animate-fadeIn">
               <div className="bg-green-600 text-white p-8 rounded-3xl shadow-xl flex items-center gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md relative z-10"><MessageCircle size={32}/></div>
                  <div className="relative z-10">
                     <h3 className="text-2xl font-black italic">Template Notifikasi WhatsApp</h3>
                     <p className="text-green-100 font-medium">Uruskan template mesej automatik untuk dihantar kepada pelanggan.</p>
                  </div>
               </div>

               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <Info className="text-blue-500 shrink-0 mt-1" size={24}/>
                  <div>
                     <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest mb-1">Panduan Variabel</h4>
                     <p className="text-sm text-blue-700 leading-relaxed">
                        Gunakan tag berikut untuk mengisi data secara automatik: <br/>
                        <code className="bg-white px-1.5 py-0.5 rounded border font-bold text-blue-600">{"{customer}"}</code> - Nama Pelanggan | 
                        <code className="bg-white px-1.5 py-0.5 rounded border font-bold text-blue-600">{"{device}"}</code> - Model Peranti | 
                        <code className="bg-white px-1.5 py-0.5 rounded border font-bold text-blue-600">{"{ticket}"}</code> - No Tiket | 
                        <code className="bg-white px-1.5 py-0.5 rounded border font-bold text-blue-600">{"{status}"}</code> - Status Semasa | 
                        <code className="bg-white px-1.5 py-0.5 rounded border font-bold text-blue-600">{"{total}"}</code> - Jumlah Bayaran | 
                        <code className="bg-white px-1.5 py-0.5 rounded border font-bold text-blue-600">{"{link}"}</code> - Pautan Jejak
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Tiket Baru Dibuat</label>
                     <textarea 
                        className="w-full border-2 border-slate-100 p-4 rounded-2xl h-32 focus:border-blue-500 outline-none text-sm leading-relaxed" 
                        value={settings.whatsappTemplates.jobCreated} 
                        onChange={e => handleWhatsAppChange('jobCreated', e.target.value)}
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Kemaskini Status</label>
                     <textarea 
                        className="w-full border-2 border-slate-100 p-4 rounded-2xl h-32 focus:border-blue-500 outline-none text-sm leading-relaxed" 
                        value={settings.whatsappTemplates.statusUpdate} 
                        onChange={e => handleWhatsAppChange('statusUpdate', e.target.value)}
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Siap Dibaikpulih</label>
                     <textarea 
                        className="w-full border-2 border-slate-100 p-4 rounded-2xl h-32 focus:border-blue-500 outline-none text-sm leading-relaxed" 
                        value={settings.whatsappTemplates.jobCompleted} 
                        onChange={e => handleWhatsAppChange('jobCompleted', e.target.value)}
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Invois / Resit</label>
                     <textarea 
                        className="w-full border-2 border-slate-100 p-4 rounded-2xl h-32 focus:border-blue-500 outline-none text-sm leading-relaxed" 
                        value={settings.whatsappTemplates.invoice} 
                        onChange={e => handleWhatsAppChange('invoice', e.target.value)}
                     />
                  </div>
               </div>
            </div>
         )}

         {/* E-INVOICE TAB (LHDN MyInvois) */}
         {activeTab === 'E-Invoice' && (
            <div className="p-8 space-y-8 animate-fadeIn">
               <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex items-center gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md relative z-10"><Building size={32}/></div>
                  <div className="relative z-10">
                     <h3 className="text-2xl font-black italic">Integrasi LHDN MyInvois</h3>
                     <p className="text-slate-400">Hubungkan sistem anda dengan portal e-Invois Malaysia.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                     <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><KeyRound size={20} className="text-blue-500"/> API Credentials</h4>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Environment</label>
                           <div className="bg-white p-1 rounded-xl border-2 border-slate-100 flex">
                              <button onClick={() => handleMyInvoisChange('environment', 'Sandbox')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.myInvois?.environment === 'Sandbox' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>Sandbox (Testing)</button>
                              <button onClick={() => handleMyInvoisChange('environment', 'Production')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.myInvois?.environment === 'Production' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>Production (Live)</button>
                           </div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client ID</label>
                           <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-mono text-sm" value={settings.myInvois?.clientId || ''} onChange={e => handleMyInvoisChange('clientId', e.target.value)} placeholder="Masukkan Client ID dari LHDN" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Secret</label>
                           <input type="password" title="Client Secret" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-mono text-sm" value={settings.myInvois?.clientSecret || ''} onChange={e => handleMyInvoisChange('clientSecret', e.target.value)} placeholder="••••••••••••••••" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                     <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><ShieldCheck size={20} className="text-green-500"/> Sijil Digital & Status</h4>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kata Laluan Sijil Digital (.p12)</label>
                           <input type="password" title="Digital Cert Password" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-mono text-sm" value={settings.myInvois?.digitalCertPass || ''} onChange={e => handleMyInvoisChange('digitalCertPass', e.target.value)} placeholder="Kata laluan sijil" />
                        </div>
                        <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center space-y-2 ${settings.myInvois?.isConfigured ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                           {settings.myInvois?.isConfigured ? <CheckCircle size={32}/> : <AlertTriangle size={32}/>}
                           <p className="font-black text-sm uppercase tracking-widest">{settings.myInvois?.isConfigured ? 'Sedia Berhubung' : 'Belum Dikonfigurasi'}</p>
                           <button onClick={() => handleMyInvoisChange('isConfigured', !settings.myInvois?.isConfigured)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${settings.myInvois?.isConfigured ? 'bg-green-600 text-white' : 'bg-slate-900 text-white'}`}>
                              {settings.myInvois?.isConfigured ? 'Nyahaktif' : 'Aktifkan Integrasi'}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* PAYMENTS TAB */}
         {activeTab === 'Payments' && (
            <div className="p-8 space-y-8 animate-fadeIn">
               <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-xl flex items-center gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md relative z-10"><CreditCard size={32}/></div>
                  <div className="relative z-10">
                     <h3 className="text-2xl font-black italic">Gerbang Pembayaran</h3>
                     <p className="text-indigo-100">Uruskan bagaimana anda menerima bayaran dari pelanggan.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {settings.paymentGateways.map(pg => (
                     <div key={pg.provider} className={`p-6 rounded-3xl border-2 transition-all space-y-4 ${pg.enabled ? 'bg-white border-indigo-500 shadow-lg' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center">
                           <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{pg.provider}</h4>
                           <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600" checked={pg.enabled} onChange={e => handlePaymentGatewayChange(pg.provider, 'enabled', e.target.checked)} />
                        </div>
                        {pg.provider !== 'Manual' && pg.enabled && (
                           <div className="space-y-3 animate-fadeIn">
                              <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">API Key / Client ID</label>
                                 <input type="text" className="w-full border-2 border-slate-100 p-2 rounded-xl text-xs font-mono" value={pg.apiKey} onChange={e => handlePaymentGatewayChange(pg.provider, 'apiKey', e.target.value)} />
                              </div>
                              <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Secret Key</label>
                                 <input type="password" title="Secret Key" className="w-full border-2 border-slate-100 p-2 rounded-xl text-xs font-mono" value={pg.secretKey} onChange={e => handlePaymentGatewayChange(pg.provider, 'secretKey', e.target.value)} />
                              </div>
                           </div>
                        )}
                        {!pg.enabled && <p className="text-xs text-slate-400 italic">Provider ini dinyahaktifkan</p>}
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* TEMPLATES TAB */}
         {activeTab === 'Templates' && (
            <div className="p-8 space-y-8 animate-fadeIn">
               <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100 flex items-center justify-between">
                  <div>
                     <h3 className="text-xl font-black text-purple-900 flex items-center gap-2 uppercase">
                        <LayoutTemplate size={24}/> Terma & Syarat (T&C)
                     </h3>
                     <p className="text-purple-700 text-sm mt-1">Buat template garansi yang berbeza untuk setiap jenis pembaikan.</p>
                  </div>
                  <div className="flex gap-2">
                     <input 
                        className="border-2 border-purple-200 p-2.5 rounded-xl outline-none focus:border-purple-500 w-64 bg-white font-bold" 
                        placeholder="Nama Template Baru..."
                        value={newTemplateName}
                        onChange={e => setNewTemplateName(e.target.value)}
                     />
                     <button onClick={addTCTemplate} className="bg-purple-600 text-white px-6 rounded-xl font-black hover:bg-purple-700 shadow-lg">Tambah</button>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {settings.termsTemplates?.map(template => (
                     <div key={template.id} className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm group hover:border-blue-300 transition-all">
                        <div className="bg-slate-50 p-4 flex justify-between items-center border-b-2 border-slate-100">
                           <div className="flex items-center gap-3">
                              <span className="font-black text-slate-800 uppercase tracking-tight">{template.name}</span>
                              {settings.defaultTCTemplateId === template.id && (
                                 <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">Utama (Default)</span>
                              )}
                           </div>
                           <div className="flex gap-2">
                              {settings.defaultTCTemplateId !== template.id && (
                                 <button onClick={() => handleChange('defaultTCTemplateId', template.id)} className="text-xs font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all">Set Sebagai Utama</button>
                              )}
                              <button onClick={() => deleteTCTemplate(template.id)} className="text-red-400 hover:text-red-600 p-2 transition-colors"><Trash2 size={20}/></button>
                           </div>
                        </div>
                        <textarea 
                           className="w-full p-6 text-sm h-40 focus:ring-0 outline-none border-none resize-none text-slate-600 bg-white font-medium"
                           value={template.content}
                           onChange={e => updateTCTemplate(template.id, e.target.value)}
                           placeholder="Tuliskan terma garansi anda di sini..."
                        />
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* PRINTING TAB */}
         {activeTab === 'Printing' && (
            <div className="p-8 space-y-10 animate-fadeIn">
               <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex items-center gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md relative z-10"><Printer size={32}/></div>
                  <div className="relative z-10">
                     <h3 className="text-2xl font-black italic">Konfigurasi Percetakan</h3>
                     <p className="text-slate-400">Tetapkan saiz kertas dan format resit rasmi anda.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                     <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><Receipt size={20} className="text-blue-500"/> Tetapan Kertas Resit</h4>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saiz Kertas</label>
                           <select className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-bold" value={settings.printSettings.receiptPaperSize} onChange={e => handlePrintChange('receiptPaperSize', e.target.value)}>
                              <option value="58mm">58mm (Kecil - Bluetooth)</option>
                              <option value="80mm">80mm (Standard - Thermal)</option>
                              <option value="A4">A4 (Invois Penuh)</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Layout Resit</label>
                           <select className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-bold" value={settings.printSettings.receiptLayout} onChange={e => handlePrintChange('receiptLayout', e.target.value)}>
                              <option value="Standard">Standard (Logo + Item)</option>
                              <option value="Compact">Kompak (Sesuai 58mm)</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                     <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><Zap size={20} className="text-orange-500"/> Automasi</h4>
                     <div className="space-y-4">
                        <label className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer shadow-sm">
                           <input type="checkbox" className="w-6 h-6 rounded-lg text-blue-600" checked={settings.printSettings.autoPrint} onChange={e => handlePrintChange('autoPrint', e.target.checked)} />
                           <div>
                              <p className="font-black text-slate-800 text-sm">Cetak Automatik</p>
                              <p className="text-xs text-slate-500">Cetak resit sejurus selepas bayaran selesai.</p>
                           </div>
                        </label>
                        <label className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer shadow-sm">
                           <input type="checkbox" className="w-6 h-6 rounded-lg text-blue-600" checked={settings.printSettings.showLogo} onChange={e => handlePrintChange('showLogo', e.target.checked)} />
                           <div>
                              <p className="font-black text-slate-800 text-sm">Papar Logo Bisnes</p>
                              <p className="text-xs text-slate-500">Letakkan logo syarikat di bahagian atas resit.</p>
                           </div>
                        </label>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* FINANCE TAB */}
         {activeTab === 'Finance' && (
            <div className="p-8 space-y-10 animate-fadeIn">
               <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="relative z-10 flex items-center gap-4">
                     <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><DollarSign size={32}/></div>
                     <div>
                        <h3 className="text-2xl font-black italic">Konfigurasi Kewangan & Cukai</h3>
                        <p className="text-blue-100 font-medium">Tetapkan mata wang dan maklumat percukaian Malaysia.</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                     <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight"><Coins size={20} className="text-blue-500"/> Mata Wang & Cukai</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Simbol Mata Wang</label>
                           <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-bold" value={settings.currency} onChange={e => handleChange('currency', e.target.value)} />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Cukai</label>
                           <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-bold" value={settings.taxName} onChange={e => handleChange('taxName', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kadar Cukai (%)</label>
                           <div className="relative">
                              <input type="number" step="0.01" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-bold pr-12" value={settings.taxRate * 100} onChange={e => handleChange('taxRate', parseFloat(e.target.value) / 100)} />
                              <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                     <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight"><Building size={20} className="text-green-500"/> Identiti LHDN</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TIN (Tax Identification Number)</label>
                           <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-mono" value={settings.tin} onChange={e => handleChange('tin', e.target.value)} />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">No. Pendaftaran SST</label>
                           <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-mono" value={settings.sstNumber} onChange={e => handleChange('sstNumber', e.target.value)} />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kod MSIC</label>
                           <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none font-mono" value={settings.msicCode} onChange={e => handleChange('msicCode', e.target.value)} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* GENERAL TAB */}
         {activeTab === 'General' && (
           <div className="p-8 space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                 <div className="w-full md:w-1/3 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Logo Bisnes</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-3xl h-48 flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative group hover:border-blue-400 transition-all shadow-inner">
                        {settings.logoUrl ? (
                            <>
                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                                <button onClick={() => handleChange('logoUrl', undefined)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </>
                        ) : (
                            <div className="text-center text-slate-400 p-4"><Upload size={32} className="mx-auto mb-2 opacity-50" /><span className="text-xs font-bold uppercase">Klik Muat Naik</span></div>
                        )}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Warna Tema Utama</label>
                        <div className="grid grid-cols-4 gap-3">
                           {PRESET_COLORS.map(c => (
                              <button 
                                 key={c.value} 
                                 onClick={() => handleChange('primaryColor', c.value)}
                                 className={`w-full aspect-square rounded-xl border-2 transition-all relative ${settings.primaryColor === c.value ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                 style={{ backgroundColor: c.value }}
                              >
                                 {settings.primaryColor === c.value && <div className="absolute inset-0 flex items-center justify-center"><Check size={20} className="text-white drop-shadow-md"/></div>}
                              </button>
                           ))}
                        </div>
                    </div>
                 </div>

                 <div className="flex-1 space-y-6">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
                       <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight"><Building size={20} className="text-blue-500"/> Informasi Syarikat</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Kedai / Syarikat</label>
                             <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all font-bold text-slate-800" value={settings.storeName} onChange={e => handleChange('storeName', e.target.value)} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">No. SSM / Reg No</label>
                             <input type="text" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all" value={settings.companyRegNo || ''} onChange={e => handleChange('companyRegNo', e.target.value)} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bahasa Sistem / System Language</label>
                             <select 
                                className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                                value={settings.language || 'en'}
                                onChange={e => handleChange('language', e.target.value)}
                             >
                                <option value="en">English (US)</option>
                                <option value="ms">Bahasa Melayu (MY)</option>
                             </select>
                          </div>
                          <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Perniagaan</label>
                             <textarea className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none h-24 text-sm resize-none" value={settings.address} onChange={e => handleChange('address', e.target.value)} />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {/* LISTS TAB */}
         {activeTab === 'Lists' && (
            <div className="p-8 space-y-8 animate-fadeIn">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ListEditor 
                    title="Jenama Peranti" 
                    items={settings.deviceBrands} 
                    onAdd={(v) => handleChange('deviceBrands', [...settings.deviceBrands, v])} 
                    onRemove={(v) => handleChange('deviceBrands', settings.deviceBrands.filter(x => x !== v))}
                    icon={Tag}
                  />
                  <ListEditor 
                    title="Jenis Peranti" 
                    items={settings.deviceTypes} 
                    onAdd={(v) => handleChange('deviceTypes', [...settings.deviceTypes, v])} 
                    onRemove={(v) => handleChange('deviceTypes', settings.deviceTypes.filter(x => x !== v))}
                    icon={Smartphone}
                  />
                  <ListEditor 
                    title="Aksesori Lazim" 
                    items={settings.commonAccessories} 
                    onAdd={(v) => handleChange('commonAccessories', [...settings.commonAccessories, v])} 
                    onRemove={(v) => handleChange('commonAccessories', settings.commonAccessories.filter(x => x !== v))}
                    icon={Zap}
                  />
                  <ListEditor 
                    title="Keadaan Peranti" 
                    items={settings.commonConditions} 
                    onAdd={(v) => handleChange('commonConditions', [...settings.commonConditions, v])} 
                    onRemove={(v) => handleChange('commonConditions', settings.commonConditions.filter(x => x !== v))}
                    icon={AlertCircle}
                  />
                  <ListEditor 
                    title="Kategori Inventori" 
                    items={settings.inventoryCategories} 
                    onAdd={(v) => handleChange('inventoryCategories', [...settings.inventoryCategories, v])} 
                    onRemove={(v) => handleChange('inventoryCategories', settings.inventoryCategories.filter(x => x !== v))}
                    icon={Layers}
                  />
               </div>
            </div>
         )}

         {/* STAFF TAB */}
         {activeTab === 'Staff' && (
            <div className="p-8 space-y-10 animate-fadeIn">
               <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                  <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-2">
                     <UserPlus size={24} className="text-blue-600"/> Daftar Staff Baru
                  </h3>
                  <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Penuh</label>
                        <input required className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all font-bold" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Kerja</label>
                        <input required type="email" className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peranan</label>
                        <select className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all font-bold" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as StaffRole})}>
                           <option value="Admin">Admin</option>
                           <option value="Manager">Manager</option>
                           <option value="Technician">Technician</option>
                           <option value="Cashier">Cashier</option>
                        </select>
                     </div>
                     <div className="flex gap-2 items-end">
                        <div className="flex-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Security PIN</label>
                           <input required maxLength={6} className="w-full border-2 border-white p-3 rounded-xl bg-white shadow-sm focus:border-blue-500 outline-none transition-all text-center font-mono tracking-widest font-black" value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g, '')})} placeholder="123456" />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg h-[52px] w-[52px] flex items-center justify-center transition-all">
                           <Plus size={24}/>
                        </button>
                     </div>
                  </form>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staff.map(s => (
                     <div key={s.id} className="bg-white border-2 border-slate-100 p-6 rounded-3xl group hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {s.name.charAt(0)}
                           </div>
                           <div className="flex gap-1">
                              <button onClick={() => deleteStaff(s.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                           </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-lg">{s.name}</h4>
                        <p className="text-sm text-slate-500 mb-4">{s.email}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                           <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600">{s.role}</span>
                           <button onClick={() => toggleStaffActive(s.id)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${s.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                              {s.active ? 'Aktif' : 'Digantung'}
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* BACKUP TAB */}
         {activeTab === 'Backup & Restore' && (
            <div className="p-8 space-y-8 animate-fadeIn">
               <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 flex items-center gap-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><Database size={32}/></div>
                  <div>
                     <h3 className="text-xl font-black text-blue-900 uppercase">Keselematan Data</h3>
                     <p className="text-blue-700 text-sm">Eksport pangkalan data anda secara berkala untuk tujuan simpanan selamat.</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <button onClick={handleDownloadBackup} className="flex items-center justify-center gap-3 p-6 bg-slate-900 text-white rounded-3xl font-black hover:bg-black transition-all shadow-xl">
                     <Download size={24}/> Muat Turun Fail Backup (.json)
                  </button>
                  <label className="flex items-center justify-center gap-3 p-6 bg-white border-4 border-dashed border-slate-200 text-slate-600 rounded-3xl font-black hover:border-blue-500 hover:text-blue-500 transition-all cursor-pointer">
                     <Upload size={24}/> Pulihkan Data (Restore)
                     <input type="file" accept=".json" className="hidden" />
                  </label>
               </div>
            </div>
         )}

         {/* MY PROFILE TAB */}
         {activeTab === 'My Profile' && (
           <div className="p-8 space-y-8 animate-fadeIn">
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex items-center gap-6 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center font-black text-4xl border-4 border-white/30 backdrop-blur-md relative z-10">
                    {currentUser?.name.charAt(0)}
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-3xl font-black">{currentUser?.name}</h3>
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-sm">{currentUser?.role}</p>
                 </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-6">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nama Penuh</label>
                    <input required className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Login Email</label>
                       <input required type="email" className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Security PIN (6 Digits)</label>
                       <input required maxLength={6} className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-center tracking-[0.5em] font-bold" value={profileData.pin} onChange={e => setProfileData({...profileData, pin: e.target.value})} />
                    </div>
                 </div>
                 <div className="pt-4">
                    <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl transition-all flex items-center gap-3">
                       <Save size={20}/> Kemaskini Profil
                    </button>
                 </div>
              </form>
           </div>
         )}

      </div>
    </div>
  );
};
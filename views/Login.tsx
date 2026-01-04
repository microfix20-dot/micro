
import React, { useState } from 'react';
import { Staff, AppSettings } from '../types';
import { Lock, Delete, AlertCircle, Home, User, ChevronLeft } from 'lucide-react';

interface LoginProps {
  staff: Staff[];
  onLogin: (user: Staff) => void;
  settings: AppSettings;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ staff, onLogin, settings, onBack }) => {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const activeStaff = staff.filter(s => s.active);

  const handlePinInput = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      // Auto-submit when 6 digits are reached
      if (newPin.length === 6 && selectedStaff) {
        if (selectedStaff.pin === newPin) {
          onLogin(selectedStaff);
        } else {
          setError('PIN Keselamatan Salah');
          setTimeout(() => setPin(''), 500); // Visual feedback pause
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleBackToSelection = () => {
    setSelectedStaff(null);
    setPin('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      {onBack && !selectedStaff && (
         <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 z-10 transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20"
         >
            <Home size={18} /> Kembali ke Home
         </button>
      )}

      <div className="bg-white w-full max-w-4xl min-h-[550px] rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Branding Sidebar */}
        <div className="w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-16 mb-6 object-contain bg-white/10 rounded p-2" />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                   <Lock size={24} />
                </div>
              )}
              <h1 className="text-4xl font-bold mb-2">{settings.storeName}</h1>
              <p className="text-blue-100 font-medium opacity-90">{settings.tagline || 'All-in-one Repair Shop Management'}</p>
           </div>
           <div className="relative z-10 text-sm opacity-60">
              <p>© {new Date().getFullYear()} FixMaster Pro v2.5</p>
           </div>
        </div>

        {/* Content Area */}
        <div className="w-full md:w-1/2 bg-slate-50 p-8 md:p-12 flex flex-col items-center justify-center">
            {!selectedStaff ? (
               <div className="animate-fadeIn w-full flex-1 flex flex-col">
                  <div className="text-center mb-8">
                     <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Staff Check-in</h3>
                     <p className="text-sm text-slate-500">Pilih profil anda untuk mula bekerja</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
                    {activeStaff.map(s => (
                       <button 
                         key={s.id}
                         onClick={() => setSelectedStaff(s)}
                         className="flex flex-col items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group shadow-sm hover:shadow-md"
                       >
                          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                             <User size={32} />
                          </div>
                          <span className="font-bold text-slate-700 group-hover:text-blue-700 truncate w-full text-center">{s.name}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider group-hover:text-blue-500">{s.role}</span>
                       </button>
                    ))}
                  </div>
               </div>
            ) : (
               <div className="animate-fadeIn w-full max-w-xs mx-auto flex-1 flex flex-col justify-center">
                  <button 
                    onClick={handleBackToSelection}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase mb-6 transition-colors"
                  >
                    <ChevronLeft size={14}/> Tukar Staff
                  </button>

                  <div className="text-center mb-8">
                     <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mx-auto mb-4 shadow-xl border-4 border-white">
                        <Lock size={36}/>
                     </div>
                     <h3 className="font-bold text-xl text-slate-800">{selectedStaff.name}</h3>
                     <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Sila Masukkan PIN</p>
                  </div>

                  <div className="mb-6">
                     <div className="flex justify-center gap-3 h-4 mb-2">
                        {[0,1,2,3,4,5].map(i => (
                           <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-transparent border-slate-300'}`} />
                        ))}
                     </div>
                  </div>
                  
                  {error && (
                     <div className="text-red-500 text-sm text-center mb-4 flex items-center justify-center gap-2 bg-red-50 py-2 rounded-lg font-medium border border-red-100 animate-pulse">
                        <AlertCircle size={14}/> {error}
                     </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-6">
                     {[1,2,3,4,5,6,7,8,9].map(num => (
                        <button 
                          key={num} 
                          onClick={() => handlePinInput(num.toString())}
                          className="h-14 rounded-xl bg-white border border-slate-200 text-xl font-bold text-slate-700 hover:bg-white hover:border-blue-500 hover:text-blue-600 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                          type="button"
                        >
                        {num}
                        </button>
                     ))}
                     <div className="col-start-2">
                        <button 
                        onClick={() => handlePinInput('0')}
                        className="w-full h-14 rounded-xl bg-white border border-slate-200 text-xl font-bold text-slate-700 hover:bg-white hover:border-blue-500 hover:text-blue-600 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                        type="button"
                        >
                        0
                        </button>
                     </div>
                     <div className="col-start-3">
                        <button 
                        onClick={handleDelete}
                        className="w-full h-14 rounded-xl bg-slate-100 border border-transparent text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all flex items-center justify-center"
                        type="button"
                        >
                        <Delete size={20}/>
                        </button>
                     </div>
                  </div>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Search, Wrench, ShieldCheck, Clock, User, Award, Star, MessageCircle, Phone, MapPin } from 'lucide-react';

interface LandingPageProps {
  settings: AppSettings;
  onTrackClick: () => void;
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ settings, onTrackClick, onLoginClick }) => {
  const getWhatsAppUrl = () => {
    let p = settings.phone.replace(/\D/g, '');
    if(p.startsWith('0')) p = '60' + p.slice(1);
    return `https://wa.me/${p}`;
  };

  const getMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
              ) : (
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Wrench size={20} />
                </div>
              )}
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{settings.storeName}</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onTrackClick}
                className="hidden md:flex text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors items-center gap-1"
              >
                <Search size={16} /> Semak Status
              </button>
              <button 
                onClick={onLoginClick}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
              >
                <User size={16} /> Log Masuk Staf
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden bg-slate-50 flex-1 flex items-center">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fadeIn order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} /> Pusat Servis Dipercayai
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
                Pakar Pembaikan <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Gajet & Digital</span>
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onTrackClick}
                  className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 group"
                >
                  Jejak Status Baiki 
                  <Search size={20} />
                </button>
              </div>
            </div>
            
            <div className="relative hidden lg:block order-1 lg:order-2">
               <div className="relative bg-white p-2 rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border border-slate-100 h-[500px]">
                  <img 
                    src={settings.heroImageUrl || "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80"} 
                    alt="Technician" 
                    className="rounded-2xl w-full object-cover h-full object-top bg-slate-200"
                  />
                  <div className="absolute bottom-8 -left-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4">
                     <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Award size={28} />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pakar Teknikal</p>
                        <p className="text-xl font-bold text-slate-800">Verified Pro</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 text-white py-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <div>
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                     <Wrench size={20} className="text-blue-400" /> {settings.storeName}
                  </h4>
                  <p className="text-slate-400 text-sm">Penyelesaian pembaikan digital dipercayai.</p>
               </div>
               <div>
                  <h4 className="font-bold text-lg mb-4">Hubungi Kami</h4>
                  <div className="space-y-3 text-slate-400 text-sm">
                     <p className="flex items-center gap-2"><Phone size={16} /> {settings.phone}</p>
                     <p className="flex items-center gap-2"><MapPin size={16} /> {settings.address}</p>
                  </div>
               </div>
               <div className="text-right">
                  <button onClick={onLoginClick} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 ml-auto">
                     <User size={14}/> Portal Staf
                  </button>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

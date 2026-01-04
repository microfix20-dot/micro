
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobStatus, RepairJob, Customer, Profile } from '../types';
import { Plus, Search, Smartphone, User, DollarSign, X, Filter, MoreHorizontal, MessageSquare, Check, Loader2 } from 'lucide-react';

export const XtraJobs = ({ profile }: { profile: Profile | null }) => {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [newJob, setNewJob] = useState({
     customer_id: '',
     device_model: '',
     problem_description: '',
     estimated_price: ''
  });

  useEffect(() => {
    fetchJobs();
    fetchCustomers();

    const channel = supabase.channel('xtra_jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_jobs' }, () => {
        fetchJobs();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('repair_jobs')
      .select('*, customers(*)')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching jobs:", error);
    else setJobs(data || []);
    setIsLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*');
    if (data) setCustomers(data);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('repair_jobs').insert({
       customer_id: parseInt(newJob.customer_id),
       device_model: newJob.device_model,
       problem_description: newJob.problem_description,
       estimated_price: parseFloat(newJob.estimated_price),
       status: 'pending',
       technician_id: profile?.id
    });

    if (!error) {
       setIsModalOpen(false);
       setNewJob({ customer_id: '', device_model: '', problem_description: '', estimated_price: '' });
    } else {
       alert("Gagal membuat tiket: " + error.message);
    }
  };

  const updateStatus = async (jobId: number, status: JobStatus) => {
     await supabase.from('repair_jobs').update({ status }).eq('id', jobId);
  };

  const filteredJobs = jobs.filter(j => 
     j.device_model.toLowerCase().includes(searchTerm.toLowerCase()) || 
     j.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black text-white">Tiket Baiki</h2>
           <p className="text-slate-500 font-medium">Uruskan peranti pelanggan secara efisien.</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all"
        >
           <Plus size={20} /> Tambah Kerja Baru
        </button>
      </div>

      <div className="flex gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 text-slate-500" size={20} />
            <input 
               className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white outline-none focus:border-cyan-500 transition-all" 
               placeholder="Cari peranti atau nama pelanggan..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
         {isLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>
         ) : (
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                     <th className="px-6 py-4">Peranti & Pelanggan</th>
                     <th className="px-6 py-4">Masalah</th>
                     <th className="px-6 py-4">Harga Anggaran</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Tindakan</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {filteredJobs.map(job => (
                     <tr key={job.id} className="group hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-6">
                           <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{job.device_model}</p>
                           <p className="text-xs text-slate-500">{job.customers?.full_name}</p>
                        </td>
                        <td className="px-6 py-6">
                           <p className="text-sm text-slate-400 line-clamp-1">{job.problem_description}</p>
                        </td>
                        <td className="px-6 py-6 font-mono text-cyan-400 font-bold">
                           RM{job.estimated_price}
                        </td>
                        <td className="px-6 py-6">
                           <select 
                              className="bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-black uppercase p-2 outline-none focus:border-cyan-500 text-cyan-500"
                              value={job.status}
                              onChange={e => updateStatus(job.id, e.target.value as JobStatus)}
                           >
                              <option value="pending">PENDING</option>
                              <option value="checking">CHECKING</option>
                              <option value="waiting_part">WAITING PART</option>
                              <option value="done">DONE</option>
                              <option value="collected">COLLECTED</option>
                              <option value="cancelled">CANCELLED</option>
                           </select>
                        </td>
                        <td className="px-6 py-6 text-right">
                           <button className="text-slate-600 hover:text-white transition-colors">
                              <MoreHorizontal size={20} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl animate-fadeIn overflow-hidden">
               <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-white">Tiket Baru</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
               </div>
               <form onSubmit={handleCreateJob} className="p-8 space-y-6">
                  <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Pilih Pelanggan</label>
                     <select 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-cyan-500"
                        value={newJob.customer_id}
                        onChange={e => setNewJob({...newJob, customer_id: e.target.value})}
                     >
                        <option value="">-- Sila Pilih --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Model Peranti</label>
                     <input required className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white" placeholder="Cth: iPhone 13" value={newJob.device_model} onChange={e => setNewJob({...newJob, device_model: e.target.value})} />
                  </div>
                  <button className="w-full bg-cyan-600 text-white font-bold py-4 rounded-2xl shadow-xl">Buka Tiket Baiki</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

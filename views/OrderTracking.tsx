import React, { useState, useEffect } from 'react';
import { JobSheet, AppSettings, JobStatus } from '../types';
import { Search, CheckCircle, Clock, Package, Wrench, ArrowLeft, Smartphone, Calendar } from 'lucide-react';

interface OrderTrackingProps {
  jobs: JobSheet[];
  settings: AppSettings;
  onBack?: () => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ jobs, settings, onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [foundJob, setFoundJob] = useState<JobSheet | null>(null);

  useEffect(() => {
    // Auto-search from URL params
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    if (jobId) {
      setSearchId(jobId);
      const job = jobs.find(j => j.id === jobId);
      if (job) setFoundJob(job);
    }
  }, [jobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const job = jobs.find(j => j.id.toLowerCase() === searchId.toLowerCase());
    setFoundJob(job || null);
    if (!job) alert('Job not found. Please check the ID.');
  };

  const getStepStatus = (step: string, currentStatus: JobStatus) => {
    const steps = [JobStatus.PENDING, JobStatus.DIAGNOSING, JobStatus.WAITING_PARTS, JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.DELIVERED];
    const currentIndex = steps.indexOf(currentStatus);
    const stepIndex = steps.indexOf(step as JobStatus);
    
    if (currentIndex >= stepIndex) return 'completed';
    return 'pending';
  };

  const statusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return <CheckCircle className="text-green-500" size={32} />;
      case JobStatus.PENDING: return <Clock className="text-yellow-500" size={32} />;
      default: return <Wrench className="text-blue-500" size={32} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          {onBack && (
             <button onClick={onBack} className="absolute left-4 top-6 text-slate-400 hover:text-white">
                <ArrowLeft size={24} />
             </button>
          )}
          {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 mx-auto mb-3 object-contain" />}
          <h1 className="text-xl font-bold">{settings.storeName}</h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Repair Status Tracker</p>
        </div>

        <div className="p-6">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Enter Job / Ticket ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="e.g. JOB-1001"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono uppercase"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700"
              >
                Track
              </button>
            </div>
          </form>

          {foundJob ? (
            <div className="animate-fadeIn">
              {/* Status Banner */}
              <div className="flex flex-col items-center justify-center py-6 border-b border-slate-100 mb-6">
                {statusIcon(foundJob.status)}
                <h2 className="text-2xl font-bold text-slate-800 mt-2">{foundJob.status}</h2>
                <p className="text-sm text-slate-500">Last updated: {new Date(foundJob.history[foundJob.history.length - 1]?.date || foundJob.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Device Info */}
              <div className="bg-slate-50 p-4 rounded-xl mb-6 flex items-start gap-4">
                 <div className="p-3 bg-white rounded-full shadow-sm text-slate-600">
                    <Smartphone size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800">{foundJob.device.brand} {foundJob.device.model}</h3>
                    <p className="text-sm text-slate-600">Issue: {foundJob.issueDescription}</p>
                    <p className="text-xs text-slate-400 mt-1">Est. Completion: {new Date(foundJob.expectedDelivery).toLocaleDateString()}</p>
                 </div>
              </div>

              {/* Timeline */}
              <div className="space-y-6 relative pl-4 border-l-2 border-slate-100 ml-4">
                 {foundJob.history.slice().reverse().map((event, idx) => (
                    <div key={idx} className="relative pl-6">
                       <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                       <p className="font-bold text-sm text-slate-800">{event.status}</p>
                       <p className="text-xs text-slate-500 mb-1">{new Date(event.date).toLocaleString()}</p>
                       <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{event.note}</p>
                    </div>
                 ))}
              </div>

              {/* Cost Summary */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Estimated Total</span>
                    <span className="font-bold text-lg">{settings.currency}{foundJob.finalCost || foundJob.estimatedCost}</span>
                 </div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Advance Paid</span>
                    <span className="font-medium text-green-600">-{settings.currency}{foundJob.advanceAmount}</span>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-dashed">
                    <span className="font-bold text-slate-800">Balance Due</span>
                    <span className="font-bold text-xl text-blue-600">{settings.currency}{(foundJob.finalCost || foundJob.estimatedCost) - foundJob.advanceAmount}</span>
                 </div>
              </div>

              <div className="mt-8 text-center">
                 <a href={`tel:${settings.phone}`} className="block w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    Contact Support
                 </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p>Enter your Job ID to see repair status.</p>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t">
           &copy; {new Date().getFullYear()} {settings.storeName}
        </div>
      </div>
    </div>
  );
};
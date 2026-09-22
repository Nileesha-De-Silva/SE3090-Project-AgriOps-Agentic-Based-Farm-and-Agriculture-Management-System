import { useState, useEffect } from 'react';
import { workerApi } from '../../services/workerApi';
import { Phone, RefreshCw, ExternalLink } from 'lucide-react';

export default function WorkerManagementView() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await workerApi.getAllWorkers();
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Field Worker Directory</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Field Operations Personnel
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personnel certification tracking, availability status, and task allocation rosters.
          </p>
        </div>
        <button
          onClick={loadWorkers}
          className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-100/80 hover:bg-emerald-200/90 text-emerald-950 text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-700' : 'text-emerald-700'}`} />
          <span>Sync Workers</span>
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 p-5 sm:p-6 rounded-2xl border border-emerald-200/90 shadow-card-green hover:shadow-card-green-hover hover:border-emerald-300 transition-all duration-200 space-y-4"
          >
            {/* Header: Name, Availability, and New Tab Link */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{worker.name}</h3>
                <span className="text-xs text-slate-500 font-medium">{worker.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                {worker.isAvailable ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Available
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Assigned
                  </span>
                )}
                <a
                  href={`/workers/${worker.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center space-x-1 text-xs font-bold shadow-2xs"
                  title="Open Worker Profile & Schedule in New Tab"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Skills */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950/70 block mb-1.5">
                Skills & Certifications
              </span>
              <div className="flex flex-wrap gap-1.5">
                {worker.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100/70 text-emerald-900 border border-emerald-200/90"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-emerald-200/60 text-xs">
              <div>
                <span className="text-emerald-900/60 block text-[10px] uppercase font-bold">Active Tasks</span>
                <span className="font-bold text-emerald-950">{worker.activeTasksCount} In Progress</span>
              </div>
              <div>
                <span className="text-emerald-900/60 block text-[10px] uppercase font-bold">Rate</span>
                <span className="font-bold text-slate-800">${worker.hourlyRate} / hr</span>
              </div>
            </div>

            {worker.contactNumber && (
              <div className="pt-2 text-xs text-slate-600 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-mono">{worker.contactNumber}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { workerApi } from '../../services/workerApi';
import { Users, Award, Clock, DollarSign, CheckCircle2, AlertCircle, Phone, RefreshCw } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Field Worker Coordination
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage worker skills, certifications, hourly rates, and current active task allocations.
          </p>
        </div>

        <button
          onClick={loadWorkers}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Workers</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">{worker.name}</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">ID: {worker.id}</span>
              </div>

              {worker.isAvailable ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Available
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Assigned
                </span>
              )}
            </div>

            {/* Skills */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Skills & Certifications
              </span>
              <div className="flex flex-wrap gap-1.5">
                {worker.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Active Tasks</span>
                <span className="font-bold text-slate-800">{worker.activeTasksCount} In Progress</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Rate</span>
                <span className="font-bold text-slate-800">${worker.hourlyRate} / hr</span>
              </div>
            </div>

            {worker.contactNumber && (
              <div className="pt-2 text-xs text-slate-500 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{worker.contactNumber}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

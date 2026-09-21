import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { workerApi } from '../services/workerApi';
import { 
  ArrowLeft, 
  ExternalLink, 
  Phone, 
  MapPin, 
  ChevronRight
} from 'lucide-react';

export default function WorkerProfilePage() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const tasks = useSelector((state) => state.tasks.items);
  const workerTasks = tasks.filter((t) => t.assignedWorkerId === id);

  useEffect(() => {
    async function loadWorker() {
      setLoading(true);
      try {
        const all = await workerApi.getAllWorkers();
        const found = all.find((w) => w.id === id);
        setWorker(found);
      } catch (err) {
        console.error('Failed to load worker:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorker();
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto py-16 text-center text-xs text-slate-400">Loading profile...</div>;
  }

  if (!worker) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-emerald-950">Worker Not Found</h2>
        <Link to="/workers" className="text-xs text-emerald-700 font-bold hover:underline">
          Return to Worker Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/workers"
          className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-200/90 hover:text-emerald-950 transition-colors shadow-2xs"
          title="Back to Directory"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to="/workers" className="hover:text-emerald-700 font-semibold">Workers</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-emerald-800 font-semibold">{worker.id}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-950 leading-tight">
            Field Personnel Profile (Dedicated Tab)
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Worker Details (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-6 shadow-card-green space-y-5">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white text-2xl font-black flex items-center justify-center mx-auto shadow-md shadow-emerald-700/20">
              {worker.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">{worker.name}</h2>
            <div className="flex items-center justify-center space-x-1.5">
              {worker.isAvailable ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Available for Assignment
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  On Duty
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-200/60 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-900/60 font-medium">Hourly Rate</span>
              <span className="font-bold text-slate-800">${worker.hourlyRate} / hr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-900/60 font-medium">Active Workload</span>
              <span className="font-bold text-emerald-950">{worker.activeTasksCount} Operations</span>
            </div>
            {worker.contactNumber && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-900/60 font-medium">Contact</span>
                <span className="font-mono text-emerald-800 font-semibold">{worker.contactNumber}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-emerald-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900/60 block mb-2">
              Verified Certifications
            </span>
            <div className="flex flex-wrap gap-1.5">
              {worker.skills?.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-900 border border-emerald-200/90"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Assigned Operations (8 cols) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-6 shadow-card-green space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
            <h3 className="text-base font-bold text-emerald-950">
              Assigned Field Tasks ({workerTasks.length})
            </h3>
            <span className="text-xs text-emerald-900 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">Live Status Feed</span>
          </div>

          {workerTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No active or historical tasks linked to this worker ID.
            </div>
          ) : (
            <div className="space-y-3">
              {workerTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-emerald-200 hover:border-emerald-400 transition-all bg-emerald-50/50 hover:bg-emerald-50/80 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{t.title}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center space-x-2">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span className="font-mono">{t.fieldId}</span>
                      </span>
                      <span>•</span>
                      <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <Link
                    to={`/tasks/${t.id}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

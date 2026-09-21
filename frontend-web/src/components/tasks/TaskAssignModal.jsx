import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { assignWorkerToTask } from '../../store/slices/taskSlice';
import { workerApi } from '../../services/workerApi';
import { X, UserCheck, Award, ExternalLink } from 'lucide-react';

export default function TaskAssignModal({ task, onClose }) {
  const dispatch = useDispatch();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    async function loadWorkers() {
      setLoading(true);
      try {
        const data = await workerApi.getAllWorkers();
        setWorkers(data);
      } catch (err) {
        console.error('Failed to load workers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkers();
  }, []);

  const handleAssign = () => {
    if (!selectedWorker) return;
    dispatch(
      assignWorkerToTask({
        taskId: task.id,
        workerId: selectedWorker.id,
        workerName: selectedWorker.name,
      })
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/50 backdrop-blur-xs">
      <div className="bg-gradient-to-b from-emerald-50/95 via-white/95 to-teal-50/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
          <div>
            <h3 className="text-lg font-bold text-emerald-950">Assign Field Worker</h3>
            <p className="text-xs text-slate-500">
              Task: <span className="font-semibold text-emerald-900">{task.title}</span> ({task.taskType})
            </p>
          </div>
          <div className="flex items-center space-x-1.5">
            <a
              href={`/tasks/${task.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 text-xs font-bold shadow-2xs transition-colors shrink-0"
              title="Expand to Dedicated Full Page Tab"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Worker Selection List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading worker pool...</div>
          ) : workers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No workers available.</div>
          ) : (
            workers.map((worker) => {
              const matchScore = workerApi.calculateMatchScore(worker, task.taskType);
              const isSelected = selectedWorker?.id === worker.id;

              return (
                <div
                  key={worker.id}
                  onClick={() => worker.isAvailable && setSelectedWorker(worker)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !worker.isAvailable
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-100/90 shadow-xs ring-2 ring-emerald-500'
                      : 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{worker.name}</span>
                        {worker.isAvailable ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Available
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Busy ({worker.activeTasksCount} active)
                          </span>
                        )}
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {worker.skills?.map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-semibold border border-emerald-200/90"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Skill Match Badge */}
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{matchScore}% Match</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                        ${worker.hourlyRate}/hr
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-emerald-200/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedWorker}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm shadow-emerald-700/20 transition-all active:scale-[0.98] ${
              selectedWorker
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Confirm Assignment</span>
          </button>
        </div>

      </div>
    </div>
  );
}

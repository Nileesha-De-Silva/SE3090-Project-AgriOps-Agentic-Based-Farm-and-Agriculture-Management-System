import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { assignWorkerToTask } from '../../store/slices/taskSlice';
import { workerApi } from '../../services/workerApi';
import { X, UserCheck, Award, Clock, DollarSign, Check, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Assign Field Worker</h3>
            <p className="text-xs text-slate-500">
              Task: <span className="font-semibold text-slate-800">{task.title}</span> ({task.taskType})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
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
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900">{worker.name}</span>
                        {worker.isAvailable ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            Busy ({worker.activeTasksCount} active)
                          </span>
                        )}
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {worker.skills?.map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Skill Match Badge */}
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-xs font-bold text-emerald-700">
                        <Award className="w-3.5 h-3.5" />
                        <span>{matchScore}% Match</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
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
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedWorker}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors ${
              selectedWorker
                ? 'bg-emerald-600 hover:bg-emerald-700'
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

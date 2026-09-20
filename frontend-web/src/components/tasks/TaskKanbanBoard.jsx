import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTasks, 
  updateTaskStatus, 
  setPriorityFilter, 
  setFieldFilter,
  setSearchQuery 
} from '../../store/slices/taskSlice';
import TaskCard from './TaskCard';
import TaskAssignModal from './TaskAssignModal';
import EvidenceVerificationModal from './EvidenceVerificationModal';
import CreateTaskModal from './CreateTaskModal';
import { 
  Plus, 
  Filter, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Layers
} from 'lucide-react';

const COLUMNS = [
  { id: 'Pending', label: 'Pending', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  { id: 'Assigned', label: 'Assigned', bg: 'bg-indigo-50/70', dot: 'bg-indigo-500' },
  { id: 'InProgress', label: 'In Progress', bg: 'bg-amber-50/70', dot: 'bg-amber-500' },
  { id: 'PendingVerification', label: 'Pending Verification', bg: 'bg-blue-50/70', dot: 'bg-blue-500' },
  { id: 'Completed', label: 'Completed', bg: 'bg-emerald-50/70', dot: 'bg-emerald-500' },
];

export default function TaskKanbanBoard() {
  const dispatch = useDispatch();
  const { items: tasks, status, filters } = useSelector((state) => state.tasks);

  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [selectedTaskForVerify, setSelectedTaskForVerify] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Filtering
  const filteredTasks = tasks.filter((task) => {
    if (filters.priority !== 'all' && task.priority?.toLowerCase() !== filters.priority.toLowerCase()) {
      return false;
    }
    if (filters.fieldId !== 'all' && task.fieldId !== filters.fieldId) {
      return false;
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      const workerMatch = task.assignedWorkerName?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !workerMatch) return false;
    }
    return true;
  });

  const handleStatusChange = (taskId, newStatus) => {
    dispatch(updateTaskStatus({ taskId, newStatus }));
  };

  // Distinct field IDs for filter dropdown
  const uniqueFields = Array.from(new Set(tasks.map((t) => t.fieldId).filter(Boolean)));

  return (
    <div className="space-y-6">
      
      {/* Top Controls: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Farm Task Board
          </h1>
          <p className="text-sm text-slate-500">
            Monitor, assign, and track field operations generated autonomously or scheduled manually.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => dispatch(fetchTasks())}
            className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, worker, or description..."
            value={filters.searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
          </div>
          <select
            value={filters.priority}
            onChange={(e) => dispatch(setPriorityFilter(e.target.value))}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
            <span>Field:</span>
          </div>
          <select
            value={filters.fieldId}
            onChange={(e) => dispatch(setFieldFilter(e.target.value))}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Fields</option>
            {uniqueFields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((column) => {
          const colTasks = filteredTasks.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              className={`rounded-xl p-3 border border-slate-200/80 ${column.bg} flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`}></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {column.label}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/80 shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onAssignClick={(t) => setSelectedTaskForAssign(t)}
                      onVerifyClick={(t) => setSelectedTaskForVerify(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Task Assignment Modal */}
      {selectedTaskForAssign && (
        <TaskAssignModal
          task={selectedTaskForAssign}
          onClose={() => setSelectedTaskForAssign(null)}
        />
      )}

      {/* Evidence Verification Modal */}
      {selectedTaskForVerify && (
        <EvidenceVerificationModal
          task={selectedTaskForVerify}
          onClose={() => setSelectedTaskForVerify(null)}
        />
      )}

      {/* Manual Task Creation Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} />
      )}

    </div>
  );
}

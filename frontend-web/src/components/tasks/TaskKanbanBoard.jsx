import { useState, useEffect } from 'react';
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
  ExternalLink,
  Layers,
  Sparkles,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

const COLUMNS = [
  { 
    id: 'Pending', 
    label: 'Pending', 
    bg: 'bg-emerald-50/50 border border-emerald-200/80', 
    headerBg: 'bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-100/80 border border-emerald-200/80 text-emerald-950', 
    dot: 'bg-emerald-600',
    countBadge: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold',
    accentLine: 'from-emerald-400 to-teal-400'
  },
  { 
    id: 'Assigned', 
    label: 'Assigned', 
    bg: 'bg-teal-50/60 border border-teal-200/80', 
    headerBg: 'bg-gradient-to-r from-teal-100/90 via-emerald-100/80 to-teal-50 border border-teal-200/80 text-teal-950', 
    dot: 'bg-teal-600',
    countBadge: 'bg-teal-700 text-white font-bold',
    accentLine: 'from-teal-500 to-emerald-400'
  },
  { 
    id: 'InProgress', 
    label: 'In Progress', 
    bg: 'bg-lime-50/50 border border-lime-200/80', 
    headerBg: 'bg-gradient-to-r from-lime-100/80 via-emerald-100/70 to-lime-50 border border-lime-200/80 text-emerald-950', 
    dot: 'bg-lime-600',
    countBadge: 'bg-lime-700 text-white font-bold',
    accentLine: 'from-lime-500 to-emerald-400'
  },
  { 
    id: 'PendingVerification', 
    label: 'Verification Gate', 
    bg: 'bg-emerald-100/50 border border-emerald-300/90 ring-1 ring-emerald-300/40', 
    headerBg: 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-xs', 
    dot: 'bg-white animate-pulse',
    countBadge: 'bg-emerald-950 text-white font-bold shadow-xs border border-emerald-700',
    accentLine: 'from-emerald-600 to-teal-600'
  },
  { 
    id: 'Completed', 
    label: 'Completed', 
    bg: 'bg-green-50/60 border border-green-200/80', 
    headerBg: 'bg-gradient-to-r from-green-200/80 via-emerald-100 to-green-100 border border-green-300/80 text-green-950', 
    dot: 'bg-green-700',
    countBadge: 'bg-green-700 text-white font-bold',
    accentLine: 'from-green-600 to-emerald-500'
  },
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

  // KPI calculations
  const totalCount = tasks.length;
  const verificationCount = tasks.filter((t) => t.status === 'PendingVerification').length;
  const aiDispatchedCount = tasks.filter((t) => t.sourceCropAnalysisId).length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header: Title & Studio Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
              Farm Task Board
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-500 shadow-xs">
              Live Operations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900/80 font-medium mt-0.5">
            Monitor, assign, and verify field operations scheduled manually or autonomously by Agent 2.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => dispatch(fetchTasks())}
            className="p-2.5 rounded-xl border border-emerald-300/80 bg-white/90 text-emerald-900 hover:bg-emerald-100 transition-all shadow-xs"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <a
            href="/tasks/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 font-bold text-xs shadow-xs transition-all"
            title="Open Task Creation in New Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-800" />
            <span>Full Studio</span>
          </a>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Agronomic KPI Strip with Rich Botanical Green Surfaces */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-emerald-950 via-forest-900 to-teal-950 rounded-2xl border border-emerald-800/80 p-4 shadow-md text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              Total Operations
            </span>
            <span className="text-2xl font-black text-white">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-800/60 text-emerald-200 flex items-center justify-center border border-emerald-700/50">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-2xl border border-emerald-400/40 p-4 shadow-md shadow-emerald-700/25 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
              Verification Gate
            </span>
            <span className="text-2xl font-black text-white">{verificationCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-900 via-emerald-900 to-teal-950 rounded-2xl border border-teal-700/60 p-4 shadow-md text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
              AI Dispatched
            </span>
            <span className="text-2xl font-black text-white">{aiDispatchedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-800/60 text-teal-200 flex items-center justify-center border border-teal-700/50">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900 via-emerald-900 to-forest-950 rounded-2xl border border-green-700/60 p-4 shadow-md text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-green-300 uppercase tracking-wider block">
              Completed Tasks
            </span>
            <span className="text-2xl font-black text-white">{completedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-800/60 text-green-200 flex items-center justify-center border border-green-700/50">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar with Mint-Tinted Glass */}
      <div className="bg-emerald-50/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-200/90 shadow-card-green flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by task title, field worker, or diagnosis..."
            value={filters.searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-emerald-300/80 bg-emerald-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-emerald-50 transition-all placeholder:text-emerald-900/40 text-emerald-950 font-medium"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-900 font-bold">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>Priority:</span>
          </div>
          <select
            value={filters.priority}
            onChange={(e) => dispatch(setPriorityFilter(e.target.value))}
            className="text-xs py-2 px-3 rounded-xl border border-emerald-300/80 bg-emerald-50/80 text-emerald-950 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-emerald-900 font-bold pl-2 border-l border-emerald-300">
            <span>Field:</span>
          </div>
          <select
            value={filters.fieldId}
            onChange={(e) => dispatch(setFieldFilter(e.target.value))}
            className="text-xs py-2 px-3 rounded-xl border border-emerald-300/80 bg-emerald-50/80 text-emerald-950 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className={`rounded-2xl p-3 ${column.bg} flex flex-col min-h-[500px] shadow-sm`}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl ${column.headerBg} mb-3`}>
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`}></span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">
                    {column.label}
                  </h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${column.countBadge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-emerald-300/70 rounded-xl flex flex-col items-center justify-center text-xs text-emerald-800/60 p-2 text-center bg-emerald-50/30">
                    <span>No operations</span>
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

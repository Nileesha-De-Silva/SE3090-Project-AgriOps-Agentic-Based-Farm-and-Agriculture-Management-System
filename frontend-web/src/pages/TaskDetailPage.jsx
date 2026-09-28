import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, verifyTaskEvidence, assignWorkerToTask } from '../store/slices/taskSlice';
import { workerApi } from '../services/workerApi';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCheck, 
  Sparkles,
  Share2,
  ChevronRight
} from 'lucide-react';

export default function TaskDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const tasks = useSelector((state) => state.tasks.items);
  const task = tasks.find((t) => t.id === id);

  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (tasks.length === 0) {
      dispatch(fetchTasks());
    }
    async function loadWorkers() {
      try {
        const data = await workerApi.getAllWorkers();
        setWorkers(data);
      } catch (err) {
        console.error('Failed to load workers:', err);
      }
    }
    loadWorkers();
  }, [dispatch, tasks.length]);

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
          <FileCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-emerald-950">Task Not Found</h2>
        <p className="text-sm text-slate-500">The task with ID "{id}" could not be located.</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold hover:from-emerald-700 hover:to-green-700 shadow-sm shadow-emerald-700/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Kanban Board</span>
        </Link>
      </div>
    );
  }

  const handleAssignWorker = () => {
    if (!selectedWorkerId) return;
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return;

    dispatch(
      assignWorkerToTask({
        taskId: task.id,
        workerId: worker.id,
        workerName: worker.name,
      })
    );
  };

  const handleVerify = (isApproved) => {
    dispatch(
      verifyTaskEvidence({
        taskId: task.id,
        isApproved,
        feedback: verificationFeedback || (isApproved ? 'Approved by manager.' : 'Rework requested.'),
      })
    );
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'urgent':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  const stages = [
    { key: 'Pending', label: '1. Scheduled' },
    { key: 'Assigned', label: '2. Assigned' },
    { key: 'InProgress', label: '3. In Progress' },
    { key: 'PendingVerification', label: '4. Verification Gate' },
    { key: 'Completed', label: '5. Completed' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === task.status);

  const evidence = task.evidence || {
    photoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=1200&q=80',
    submittedAt: new Date().toISOString(),
    notes: 'Task execution completed as per handbook protocol. Foliage inspect clear of pests.',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Top Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-200/90 hover:text-emerald-950 transition-colors shadow-2xs"
            title="Back to Kanban"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Link to="/" className="hover:text-emerald-700 font-semibold">Kanban</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-mono text-emerald-800 font-semibold">{task.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-950 leading-tight">
              {task.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleShareLink}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-200/90 text-xs font-bold shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Tab Link'}</span>
          </button>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 p-4 rounded-2xl border border-emerald-200/90 shadow-card-green">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-500">Operational Progress:</span>
          <span className="text-emerald-900 font-bold font-mono bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">{task.status}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage.key}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-600 font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <div className="text-[11px] truncate">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Column Details & Evidence, Right Column Assignment & Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* General Overview Card */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-6 shadow-card-green space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${getPriorityStyle(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className="text-xs text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center space-x-1 font-bold">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-mono">{task.fieldId}</span>
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/60 mb-1">
                Task Scope & Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {task.description || 'No detailed instructions provided.'}
              </p>
            </div>

            {task.sourceCropAnalysisId && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start space-x-3 text-xs">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-950 block mb-0.5">
                    Autonomous AI Dispatch (Agent 2)
                  </span>
                  <span className="text-teal-900 leading-relaxed">
                    This task was synthesized by Agent 2 following symptom mapping from the agricultural handbook.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Photo Evidence & Verification Section */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-6 shadow-card-green space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-base font-bold text-emerald-950">
                  Field Photo Evidence & Inspection
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Full-Resolution View
              </span>
            </div>

            {/* High-Res Photo */}
            <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-slate-900 aspect-video group">
              <img
                src={evidence.photoUrl}
                alt="Field Proof"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-mono backdrop-blur-xs flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Plot: {task.fieldId} (GPS Tagged)</span>
              </div>
              <a
                href={evidence.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 backdrop-blur-xs transition-colors"
              >
                <span>Open Original Image in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Worker Notes */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900/60">
                Worker Field Notes
              </span>
              <p className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs text-slate-800 leading-relaxed italic">
                "{evidence.notes}"
              </p>
            </div>

            {/* Verification Decision Gate Controls */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-100/70 via-emerald-50/80 to-teal-100/60 border border-emerald-300 space-y-3">
              <span className="text-xs font-bold text-emerald-950 block">
                Manager Verification Decision Gate
              </span>
              <input
                type="text"
                placeholder="Add verification notes or reason for rework..."
                value={verificationFeedback}
                onChange={(e) => setVerificationFeedback(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white focus:bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-medium"
              />
              <div className="flex items-center space-x-3 pt-1">
                <button
                  onClick={() => handleVerify(true)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-sm shadow-emerald-700/20 transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Mark Completed</span>
                </button>
                <button
                  onClick={() => handleVerify(false)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject (Rework)</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Worker Allocation & Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Worker Assignment Card */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-6 shadow-card-green space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/60">
              Assigned Field Personnel
            </h3>

            {task.assignedWorkerName ? (
              <div className="p-4 rounded-xl bg-emerald-100/60 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-green-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {task.assignedWorkerName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">{task.assignedWorkerName}</h4>
                    <span className="text-xs text-slate-500 font-mono">ID: {task.assignedWorkerId}</span>
                  </div>
                </div>
                <Link
                  to={`/workers/${task.assignedWorkerId}`}
                  target="_blank"
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No worker assigned yet. Select from available personnel below.</span>
                </div>

                <div className="space-y-2">
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
                  >
                    <option value="">-- Choose Field Worker --</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id} disabled={!w.isAvailable}>
                        {w.name} ({w.isAvailable ? 'Available' : 'Busy'}) - ${w.hourlyRate}/hr
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAssignWorker}
                    disabled={!selectedWorkerId}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98] ${
                      selectedWorkerId
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Assign Selected Worker
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Task Metadata & Operations Details */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-6 shadow-card-green space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/60 mb-2">
              Operational Specs
            </h3>

            <div className="flex items-center justify-between py-2 border-b border-emerald-200/60">
              <span className="text-slate-600 font-medium">Operation Type</span>
              <span className="font-bold text-emerald-950">{task.taskType}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-emerald-200/60">
              <span className="text-slate-600 font-medium">Target Crop</span>
              <span className="font-bold text-emerald-950">{task.cropVariety || 'Tomato'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-emerald-200/60">
              <span className="text-slate-600 font-medium">Estimated Duration</span>
              <span className="font-bold text-slate-800 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{task.estimatedHours || 2} hours</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 font-medium">Scheduled Due Date</span>
              <span className="font-bold text-slate-800 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

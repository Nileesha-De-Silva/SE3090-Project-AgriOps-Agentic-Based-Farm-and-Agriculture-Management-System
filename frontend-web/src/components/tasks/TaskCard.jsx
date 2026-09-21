import { 
  User, 
  UserCheck, 
  FileCheck, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';

export default function TaskCard({ 
  task, 
  onAssignClick, 
  onVerifyClick, 
  onStatusChange 
}) {
  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'urgent':
        return 'bg-rose-50 text-rose-800 border-rose-200/80';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'medium':
        return 'bg-teal-50 text-teal-800 border-teal-200/80';
      case 'low':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'PesticideApplication':
        return '🧪';
      case 'PestInspection':
        return '🔍';
      case 'CropMonitoring':
        return '🌱';
      case 'Irrigation':
        return '💧';
      case 'Harvesting':
        return '🌾';
      default:
        return '📋';
    }
  };

  return (
    <div className="bg-gradient-to-b from-white via-white to-emerald-50/60 p-4 rounded-2xl border border-emerald-200/90 hover:border-emerald-400 shadow-card-green hover:shadow-card-green-hover transition-all duration-200 space-y-3 group hover:-translate-y-0.5">
      
      {/* Header: Priority & Field */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityStyle(task.priority)}`}>
          {task.priority || 'Normal'}
        </span>
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300/70 flex items-center space-x-1 font-bold">
            <MapPin className="w-3 h-3 text-emerald-700" />
            <span className="font-mono">{task.fieldId}</span>
          </span>
          <a
            href={`/tasks/${task.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-950 transition-colors p-1 rounded-lg hover:bg-emerald-100/80"
            title="Open Task in New Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Title & Task Type */}
      <div>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-800/80 mb-1">
          <span>{getTaskTypeIcon(task.taskType)}</span>
          <span className="font-bold text-emerald-900">{task.taskType}</span>
          {task.sourceCropAnalysisId && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
              <Sparkles className="w-2.5 h-2.5 mr-1 text-teal-700" /> AI Dispatched
            </span>
          )}
        </div>
        <h4 className="text-sm font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors leading-snug">
          {task.title}
        </h4>
      </div>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Assigned Worker / Action */}
      <div className="pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
        {task.assignedWorkerName ? (
          <div className="flex items-center space-x-1.5 text-emerald-950 font-bold">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[120px]">{task.assignedWorkerName}</span>
          </div>
        ) : (
          <button
            onClick={() => onAssignClick(task)}
            className="flex items-center space-x-1 text-emerald-900 hover:text-emerald-950 font-bold text-xs py-1 px-2.5 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300/80 transition-colors"
          >
            <User className="w-3 h-3 text-emerald-700" />
            <span>Assign Worker</span>
          </button>
        )}

        {/* Due Date or Est Hours */}
        <div className="flex items-center space-x-1 text-emerald-800/60 font-semibold">
          <Clock className="w-3 h-3 text-emerald-600" />
          <span>{task.estimatedHours || 2}h</span>
        </div>
      </div>

      {/* Verification Gate Action for PendingVerification column */}
      {task.status === 'PendingVerification' && (
        <button
          onClick={() => onVerifyClick(task)}
          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Review Task Evidence</span>
        </button>
      )}

      {/* Quick Status Forwarder */}
      {task.status !== 'Completed' && task.status !== 'PendingVerification' && (
        <div className="flex justify-end pt-1">
          {task.status === 'Pending' && task.assignedWorkerId && (
            <button
              onClick={() => onStatusChange(task.id, 'InProgress')}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 transition-colors"
            >
              <span>Start Task</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {task.status === 'InProgress' && (
            <button
              onClick={() => onStatusChange(task.id, 'PendingVerification')}
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 transition-colors"
            >
              <span>Submit for Verification</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

    </div>
  );
}

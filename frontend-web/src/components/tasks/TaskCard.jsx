import React from 'react';
import { 
  AlertCircle, 
  Calendar, 
  User, 
  UserCheck, 
  FileCheck, 
  Clock, 
  ArrowRight,
  Sparkles,
  MapPin
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
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3 group">
      
      {/* Header: Priority & Field */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getPriorityStyle(task.priority)}`}>
          {task.priority || 'Normal'}
        </span>
        <span className="text-[11px] text-slate-500 flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="font-mono">{task.fieldId}</span>
        </span>
      </div>

      {/* Title & Task Type */}
      <div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
          <span>{getTaskTypeIcon(task.taskType)}</span>
          <span className="font-medium text-slate-600">{task.taskType}</span>
          {task.sourceCropAnalysisId && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI Dispatched
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
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
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        {task.assignedWorkerName ? (
          <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[120px]">{task.assignedWorkerName}</span>
          </div>
        ) : (
          <button
            onClick={() => onAssignClick(task)}
            className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-semibold text-xs py-1 px-2 rounded-md bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <User className="w-3 h-3" />
            <span>Assign Worker</span>
          </button>
        )}

        {/* Due Date or Est Hours */}
        <div className="flex items-center space-x-1 text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{task.estimatedHours || 2}h</span>
        </div>
      </div>

      {/* Verification Gate Action for PendingVerification column */}
      {task.status === 'PendingVerification' && (
        <button
          onClick={() => onVerifyClick(task)}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
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
              className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>Start Task</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {task.status === 'InProgress' && (
            <button
              onClick={() => onStatusChange(task.id, 'PendingVerification')}
              className="text-[11px] text-slate-500 hover:text-blue-700 flex items-center space-x-1"
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

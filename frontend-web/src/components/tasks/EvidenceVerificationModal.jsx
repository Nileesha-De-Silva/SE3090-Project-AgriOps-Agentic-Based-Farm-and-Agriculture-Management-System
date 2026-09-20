import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { verifyTaskEvidence } from '../../store/slices/taskSlice';
import { X, CheckCircle2, XCircle, FileText, Image as ImageIcon } from 'lucide-react';

export default function EvidenceVerificationModal({ task, onClose }) {
  const dispatch = useDispatch();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDecision = (isApproved) => {
    setIsSubmitting(true);
    dispatch(
      verifyTaskEvidence({
        taskId: task.id,
        isApproved,
        feedback: feedback || (isApproved ? 'Task verified and approved.' : 'Rework requested.'),
      })
    );
    setIsSubmitting(false);
    onClose();
  };

  const evidence = task.evidence || {
    photoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80',
    submittedAt: new Date().toISOString(),
    notes: 'Task execution completed as per handbook protocol. Foliage inspect clear of pests.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900">Task Evidence Verification</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Gatekeeper
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Field Worker submitted completion proof for: <span className="font-semibold text-slate-700">{task.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Metadata Overview */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Worker:</span>
            <span className="font-semibold text-slate-800">{task.assignedWorkerName || 'Field Team'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Field ID:</span>
            <span className="font-semibold text-slate-800 font-mono">{task.fieldId}</span>
          </div>
        </div>

        {/* Photo Evidence Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Field Photographic Proof</span>
          </label>
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
            <img
              src={evidence.photoUrl}
              alt="Field Evidence"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-900/80 text-white text-[10px] font-mono backdrop-blur-xs">
              GPS Verified • Plot: {task.fieldId}
            </div>
          </div>
        </div>

        {/* Worker Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Worker Field Notes</span>
          </label>
          <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
            "{evidence.notes}"
          </p>
        </div>

        {/* Manager Verification Feedback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Manager Review Comments
          </label>
          <input
            type="text"
            placeholder="e.g. Verified emitter pressure restored. Excellent work."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Decision Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => handleDecision(false)}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject / Request Rework</span>
          </button>
          <button
            onClick={() => handleDecision(true)}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify & Mark Completed</span>
          </button>
        </div>

      </div>
    </div>
  );
}

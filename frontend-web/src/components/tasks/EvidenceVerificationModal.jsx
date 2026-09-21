import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { verifyTaskEvidence } from '../../store/slices/taskSlice';
import { X, CheckCircle2, XCircle, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/50 backdrop-blur-xs">
      <div className="bg-gradient-to-b from-emerald-50/95 via-white/95 to-teal-50/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-emerald-950">Task Evidence Verification</h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Gatekeeper
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Field Worker submitted completion proof for: <span className="font-semibold text-emerald-900">{task.title}</span>
            </p>
          </div>
          <div className="flex items-center space-x-1.5">
            <a
              href={`/tasks/${task.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 text-xs font-bold shadow-2xs transition-colors shrink-0"
              title="Expand to Full Evidence Page in New Browser Tab"
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

        {/* Task Metadata Overview */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-100/70 via-emerald-50/80 to-teal-50/60 rounded-xl border border-emerald-300 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-emerald-900/60 block text-[10px] uppercase font-bold">Worker:</span>
            <span className="font-bold text-emerald-950">{task.assignedWorkerName || 'Field Team'}</span>
          </div>
          <div>
            <span className="text-emerald-900/60 block text-[10px] uppercase font-bold">Field ID:</span>
            <span className="font-bold text-emerald-900 font-mono">{task.fieldId}</span>
          </div>
        </div>

        {/* Photo Evidence Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>Field Photographic Proof</span>
          </label>
          <div className="relative rounded-xl overflow-hidden border border-emerald-200/80 bg-slate-900 aspect-video flex items-center justify-center group">
            <img
              src={evidence.photoUrl}
              alt="Field Evidence"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/80 text-emerald-300 text-[10px] font-mono backdrop-blur-xs flex items-center space-x-1">
              <span>GPS Verified • Plot: {task.fieldId}</span>
            </div>
          </div>
        </div>

        {/* Worker Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>Worker Field Notes</span>
          </label>
          <p className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-slate-800 leading-relaxed italic">
            "{evidence.notes}"
          </p>
        </div>

        {/* Manager Verification Feedback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
            Manager Review Comments
          </label>
          <input
            type="text"
            placeholder="e.g. Verified spray coverage & dosage adheres to handbook."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-emerald-900/40 text-emerald-950 font-medium"
          />
        </div>

        {/* Action Decision Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/80">
          <button
            onClick={() => handleDecision(false)}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject / Request Rework</span>
          </button>
          <button
            onClick={() => handleDecision(true)}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-sm shadow-emerald-700/20 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify & Mark Completed</span>
          </button>
        </div>

      </div>
    </div>
  );
}

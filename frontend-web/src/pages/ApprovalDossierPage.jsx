import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPendingApprovals, approveAlert, rejectAlert } from '../store/slices/cropAnalysisSlice';
import { 
  ArrowLeft, 
  Share2, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  MapPin, 
  ChevronRight,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function ApprovalDossierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { pendingApprovals } = useSelector((state) => state.cropAnalysis);
  const alert = pendingApprovals.find((a) => a.id === id);

  const [reviewComments, setReviewComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (pendingApprovals.length === 0) {
      dispatch(fetchPendingApprovals());
    }
  }, [dispatch, pendingApprovals.length]);

  if (!alert) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-emerald-950">Alert Dossier Not Found</h2>
        <p className="text-sm text-slate-500">
          Alert "{id}" may have already been approved or rejected.
        </p>
        <Link
          to="/approvals"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold hover:from-emerald-700 hover:to-green-700 shadow-sm shadow-emerald-700/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Approval Inbox</span>
        </Link>
      </div>
    );
  }

  const handleApprove = async () => {
    setIsProcessing(true);
    await dispatch(
      approveAlert({
        analysisId: alert.id,
        threadId: alert.threadId,
        comments: reviewComments || 'Approved by Farm Manager from Dossier view.',
      })
    );
    setIsProcessing(false);
    navigate('/');
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await dispatch(
      rejectAlert({
        analysisId: alert.id,
        threadId: alert.threadId,
        reason: reviewComments || 'Rejected by Farm Manager from Dossier view.',
      })
    );
    setIsProcessing(false);
    navigate('/approvals');
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isCritical = alert.riskLevel === 'Critical';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/approvals"
            className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-200/90 hover:text-emerald-950 transition-colors shadow-2xs"
            title="Back to Inbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Link to="/approvals" className="hover:text-emerald-700 font-semibold">Approval Inbox</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-mono text-emerald-800 font-semibold">{alert.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-950 leading-tight">
              Agronomic Diagnostic Dossier & Human Gate
            </h1>
          </div>
        </div>

        <button
          onClick={handleShareLink}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-200/90 text-xs font-bold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Copy Dossier Link'}</span>
        </button>
      </div>

      {/* Main Alert Card */}
      <div
        className={`bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border p-6 shadow-card-green space-y-5 ${
          isCritical ? 'border-rose-300 ring-1 ring-rose-100' : 'border-emerald-300/80 ring-1 ring-emerald-200/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                isCritical
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {alert.riskLevel} Risk Alert
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              Category: {alert.category}
            </span>
          </div>

          <span className="text-xs font-mono text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center space-x-1 font-bold">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>Plot: {alert.fieldId}</span>
          </span>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900/60 block mb-1">
            Identified Pathogen / Pest
          </span>
          <h2 className="text-xl font-bold text-slate-900 leading-snug">
            {alert.primaryIndicator}
          </h2>
          <div className="mt-2 p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 text-xs text-slate-800 leading-relaxed italic">
            "{alert.observation}"
          </div>
        </div>

        {/* Agronomic Handbook Protocol */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-100/60 via-emerald-50/80 to-teal-50/60 border border-emerald-300 space-y-2.5 text-xs">
          <div className="flex items-center space-x-2 text-emerald-950 font-bold text-sm">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>Recommended Agricultural Treatment Protocol</span>
          </div>
          <p className="text-emerald-900 leading-relaxed font-medium">
            {alert.recommendedProtocol}
          </p>
          <div className="pt-2 border-t border-emerald-200/70 flex items-center space-x-3 text-[11px] text-emerald-900">
            <span>Authoritative Source: <strong className="text-emerald-950">{alert.sourceHandbook}</strong></span>
            <span>•</span>
            <span>Diagnosis Confidence: <strong className="text-emerald-950">{Math.round(alert.confidenceScore * 100)}%</strong></span>
          </div>
        </div>

        {/* LangGraph Trajectory Info */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-emerald-950 font-bold">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agent 2 Trajectory Execution</span>
          </div>
          <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-emerald-100/40 border border-emerald-200/90 text-[11px] font-mono overflow-x-auto">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold">input_guard</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 font-bold" />
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold">retrieve</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 font-bold" />
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold">grade</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 font-bold" />
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold">generate_diagnosis</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 font-bold" />
            <span className="font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300 shrink-0">human_gate (paused)</span>
          </div>
        </div>

        {/* Manager Decision & Review Comments */}
        <div className="pt-4 border-t border-emerald-200/70 space-y-3 text-xs">
          <label className="block font-bold text-emerald-950">
            Farm Manager Authorization Notes
          </label>
          <textarea
            rows="3"
            placeholder="Specify safety directives, spray nozzle calibration, or reasoning for approval/rejection..."
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            className="w-full text-xs p-3.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-emerald-900/40 text-emerald-950 font-medium"
          ></textarea>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Proposal</span>
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Auto-Dispatch Task to Kanban</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

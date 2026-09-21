import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPendingApprovals, 
  approveAlert, 
  rejectAlert 
} from '../../store/slices/cropAnalysisSlice';
import { 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  RefreshCw, 
  MapPin,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function PendingApprovalsInbox() {
  const dispatch = useDispatch();
  const { pendingApprovals, status } = useSelector((state) => state.cropAnalysis);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    dispatch(fetchPendingApprovals());
  }, [dispatch]);

  const handleApprove = async (alert) => {
    setActionInProgress(true);
    await dispatch(
      approveAlert({
        analysisId: alert.id,
        threadId: alert.threadId,
        comments: reviewNote || 'Approved by Farm Manager. Immediate task dispatch authorized.',
      })
    );
    setActionInProgress(false);
    setSelectedAlert(null);
    setReviewNote('');
  };

  const handleReject = async (alert) => {
    setActionInProgress(true);
    await dispatch(
      rejectAlert({
        analysisId: alert.id,
        threadId: alert.threadId,
        reason: reviewNote || 'Rejected by Farm Manager. Alternative protocol scheduled.',
      })
    );
    setActionInProgress(false);
    setSelectedAlert(null);
    setReviewNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
              Human-in-the-Loop Approval Inbox
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Agent 2 Gatekeeper</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Agent 2 pauses execution on High or Critical risk crop alerts. Review diagnostics and authorize automated task creation.
          </p>
        </div>

        <button
          onClick={() => dispatch(fetchPendingApprovals())}
          className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-100/80 text-emerald-950 hover:bg-emerald-200/90 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin text-emerald-700' : 'text-emerald-700'}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Inbox Grid */}
      {pendingApprovals.length === 0 ? (
        <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/80 rounded-2xl border border-emerald-200 p-12 text-center space-y-3 shadow-card-green">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-700/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-extrabold text-emerald-950">Inbox Zero: All High-Risk Alerts Cleared</h3>
          <p className="text-xs text-emerald-800/80 font-medium max-w-md mx-auto">
            No pending crop analyses are awaiting manager sign-off. Low-risk routine observations are automatically handled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pendingApprovals.map((alert) => {
            const isCritical = alert.riskLevel === 'Critical';

            return (
              <div
                key={alert.id}
                className={`bg-gradient-to-br from-emerald-50/80 via-white/80 to-green-50/70 rounded-2xl border p-5 sm:p-6 shadow-card-green hover:shadow-card-green-hover space-y-4 transition-all duration-200 ${
                  isCritical
                    ? 'border-rose-300 ring-1 ring-rose-200/70'
                    : 'border-emerald-300 ring-1 ring-emerald-200/70'
                }`}
              >
                {/* Alert Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border ${
                        isCritical
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {alert.riskLevel} Risk
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {alert.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center space-x-1 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{alert.fieldId}</span>
                    </span>
                    <a
                      href={`/approvals/${alert.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 transition-colors flex items-center space-x-1.5 text-xs font-bold shadow-2xs"
                      title="Open Full Diagnostic Dossier in a New Browser Tab"
                    >
                      <span>Full Dossier</span>
                      <ExternalLink className="w-3 h-3 text-emerald-800" />
                    </a>
                  </div>
                </div>

                {/* Primary Issue & Observation */}
                <div>
                  <h3 className="text-base font-bold text-emerald-950 leading-snug">
                    {alert.primaryIndicator}
                  </h3>
                  <p className="text-xs text-slate-800 mt-1.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 italic leading-relaxed">
                    "{alert.observation}"
                  </p>
                </div>

                {/* AI Reasoning & Handbook Citations */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/70 border border-emerald-300/80 space-y-2.5 text-xs">
                  <div className="flex items-start space-x-2">
                    <BookOpen className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-950">Handbook Protocol: </span>
                      <span className="text-emerald-900 leading-relaxed font-medium">{alert.recommendedProtocol}</span>
                      <div className="mt-1">
                        <span className="font-mono text-[10px] text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                          Source: {alert.sourceHandbook}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Bar Meter */}
                  <div className="pt-2 border-t border-emerald-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-900 font-bold">Diagnostic Confidence:</span>
                      <span className="font-extrabold text-emerald-950 font-mono">
                        {Math.round(alert.confidenceScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-emerald-100/80 rounded-full h-2 overflow-hidden border border-emerald-300">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full" 
                        style={{ width: `${Math.round(alert.confidenceScore * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-emerald-900 font-semibold border-t border-emerald-200/80">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Suggested Dispatch: <strong className="text-emerald-950">{alert.suggestedTaskType}</strong></span>
                    </span>
                  </div>
                </div>

                {/* Inline Review Note Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Optional manager notes for automated task dispatch..."
                    value={selectedAlert === alert.id ? reviewNote : ''}
                    onFocus={() => setSelectedAlert(alert.id)}
                    onChange={(e) => {
                      setSelectedAlert(alert.id);
                      setReviewNote(e.target.value);
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-emerald-900/40 text-emerald-950 font-medium"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleReject(alert)}
                    disabled={actionInProgress}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 hover:text-rose-900 text-rose-800 font-bold text-xs transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Proposal</span>
                  </button>

                  <button
                    onClick={() => handleApprove(alert)}
                    disabled={actionInProgress}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-sm shadow-emerald-700/20 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Dispatch</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

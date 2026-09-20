import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPendingApprovals, 
  approveAlert, 
  rejectAlert 
} from '../../store/slices/cropAnalysisSlice';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  BookOpen, 
  ShieldAlert, 
  RefreshCw, 
  ArrowRight,
  Clock,
  Layers,
  MapPin
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
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Human-in-the-Loop Approval Inbox
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Agent 2 Gatekeeper
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Agent 2 pauses execution on High or Critical risk crop alerts. Review diagnostics and authorize automated task creation.
          </p>
        </div>

        <button
          onClick={() => dispatch(fetchPendingApprovals())}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Inbox Grid */}
      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Inbox Zero: All High-Risk Alerts Cleared</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
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
                className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${
                  isCritical
                    ? 'border-red-200 ring-1 ring-red-100 bg-gradient-to-br from-white to-red-50/20'
                    : 'border-amber-200 ring-1 ring-amber-100 bg-gradient-to-br from-white to-amber-50/20'
                }`}
              >
                {/* Alert Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {alert.riskLevel} Risk
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {alert.category}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{alert.fieldId}</span>
                  </span>
                </div>

                {/* Primary Issue & Observation */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {alert.primaryIndicator}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 italic">
                    "{alert.observation}"
                  </p>
                </div>

                {/* AI Reasoning & Handbook Citations */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start space-x-2">
                    <BookOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Handbook Protocol: </span>
                      <span className="text-slate-600">{alert.recommendedProtocol}</span>
                      <span className="ml-1.5 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                        {alert.sourceHandbook}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
                    <span>
                      Proposed Action: <strong className="text-slate-800">{alert.suggestedTaskType}</strong>
                    </span>
                    <span>
                      Confidence: <strong className="text-slate-800">{Math.round(alert.confidenceScore * 100)}%</strong>
                    </span>
                  </div>
                </div>

                {/* Inline Review Note Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Optional manager notes for task dispatch..."
                    value={selectedAlert === alert.id ? reviewNote : ''}
                    onFocus={() => setSelectedAlert(alert.id)}
                    onChange={(e) => {
                      setSelectedAlert(alert.id);
                      setReviewNote(e.target.value);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleReject(alert)}
                    disabled={actionInProgress}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600 font-semibold text-xs transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Proposal</span>
                  </button>

                  <button
                    onClick={() => handleApprove(alert)}
                    disabled={actionInProgress}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-700/20 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Dispatch Task</span>
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

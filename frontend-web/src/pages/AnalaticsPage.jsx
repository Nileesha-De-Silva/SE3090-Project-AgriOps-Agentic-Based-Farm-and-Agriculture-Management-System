import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHarvestYields } from "../api/adminApi";
import {
  runSentinelAnalysis,
  approveSentinelIntervention,
  rejectSentinelIntervention,
} from "../services/sentinelApi";

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export default function AnalyticsPage() {
  const [rows, setRows] = useState([]);
  const [cropFilter, setCropFilter] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sentinel Agent State
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [sentinelError, setSentinelError] = useState(null);
  const [sentinelRun, setSentinelRun] = useState(null);
  const [managerNotes, setManagerNotes] = useState("");
  const [decisionProcessing, setDecisionProcessing] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    getHarvestYields()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const crops = useMemo(() => [...new Set(rows.map((r) => r.cropName))].sort(), [rows]);

  const filtered = useMemo(
    () => (cropFilter ? rows.filter((r) => r.cropName === cropFilter) : rows),
    [rows, cropFilter]
  );

  const byField = useMemo(() => {
    const totals = new Map();
    for (const r of filtered) {
      const existing = totals.get(r.fieldId) ?? { fieldName: r.fieldName, total: 0 };
      existing.total += r.totalYield;
      totals.set(r.fieldId, existing);
    }
    return [...totals.entries()]
      .map(([fieldId, v]) => ({ fieldId, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const grandTotal = byField.reduce((sum, f) => sum + f.total, 0);
  const maxTotal = byField.length ? byField[0].total : 0;

  const handleRunSentinel = async () => {
    setSentinelLoading(true);
    setSentinelError(null);
    try {
      const result = await runSentinelAnalysis({
        cropName: cropFilter || undefined,
        sensitivityThreshold: 0.20,
        auditLookbackCount: 50,
      });
      setSentinelRun(result);
    } catch (err) {
      setSentinelError(err.message);
    } finally {
      setSentinelLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!sentinelRun?.run_id) return;
    setDecisionProcessing(true);
    try {
      const updated = await approveSentinelIntervention(sentinelRun.run_id, managerNotes);
      setSentinelRun(updated);
      setManagerNotes("");
    } catch (err) {
      setSentinelError(err.message);
    } finally {
      setDecisionProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!sentinelRun?.run_id) return;
    setDecisionProcessing(true);
    try {
      const updated = await rejectSentinelIntervention(sentinelRun.run_id, managerNotes);
      setSentinelRun(updated);
      setManagerNotes("");
    } catch (err) {
      setSentinelError(err.message);
    } finally {
      setDecisionProcessing(false);
    }
  };

  if (loading) return <p>Loading analytics...</p>;

  return (
    <div className="analytics-page" style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem 0" }}>Production Analytics & Sentinel</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Component 4 • Historical Harvest Yields & AI Operations Sentinel
          </p>
        </div>
        <button
          onClick={handleRunSentinel}
          disabled={sentinelLoading}
          style={{
            backgroundColor: "#059669",
            color: "white",
            padding: "0.6rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            fontWeight: 600,
            cursor: sentinelLoading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {sentinelLoading ? "Evaluating Farm Operations..." : "🛡️ Run AI Sentinel Audit"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "1rem", marginBottom: "1.5rem", borderRadius: "0.5rem", backgroundColor: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{error}</p>
          {(error.includes("401") || error.includes("403") || error.includes("failed with status") || error.includes("token")) && (
            <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>
              Administrator or Farm Manager permissions are required to view production analytics. Please{" "}
              <Link to="/login" style={{ fontWeight: 700, color: "#065f46", textDecoration: "underline" }}>
                Sign In
              </Link>{" "}
              (Default: <strong>admin</strong> / <strong>ChangeMe123!</strong>).
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI OPERATIONS & YIELD SENTINEL CONSOLE (AGENT 4) */}
      {/* ========================================================================= */}
      {sentinelError && (
        <div style={{ padding: "1rem", marginBottom: "1.5rem", borderRadius: "6px", backgroundColor: "#fee2e2", border: "1px solid #ef4444", color: "#991b1b" }}>
          <strong>Sentinel Error:</strong> {sentinelError}
        </div>
      )}

      {sentinelRun && (
        <div style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1.25rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                Autonomous Agent 4 Output
              </span>
              <h2 style={{ margin: "0.2rem 0", color: "#0f172a" }}>AI Operations Sentinel Report</h2>
              <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                Run ID: <code>{sentinelRun.run_id}</code> • Status: <strong>{sentinelRun.status.toUpperCase()}</strong>
              </span>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ textAlign: "center", padding: "0.5rem 1rem", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>YIELD SCORE</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: sentinelRun.yield_performance_score >= 70 ? "#16a34a" : "#dc2626" }}>
                  {sentinelRun.yield_performance_score}/100
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "0.5rem 1rem", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>RISK LEVEL</div>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: sentinelRun.overall_risk_level === "CRITICAL" ? "#b91c1c" : sentinelRun.overall_risk_level === "HIGH" ? "#ea580c" : sentinelRun.overall_risk_level === "MEDIUM" ? "#ca8a04" : "#16a34a"
                }}>
                  {sentinelRun.overall_risk_level}
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Agronomic Commentary */}
          {sentinelRun.strategic_commentary && (
            <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "6px", borderLeft: "4px solid #059669", marginBottom: "1rem" }}>
              <strong style={{ color: "#065f46", display: "block", marginBottom: "0.25rem" }}>Strategic Assessment:</strong>
              <p style={{ margin: 0, color: "#334155", fontStyle: "italic" }}>"{sentinelRun.strategic_commentary}"</p>
            </div>
          )}

          {/* Detected Anomalies */}
          {sentinelRun.anomalies?.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem 0", color: "#1e293b" }}>Detected Operational & Yield Anomalies</h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {sentinelRun.anomalies.map((a, idx) => (
                  <div key={idx} style={{ backgroundColor: "#ffffff", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{
                        display: "inline-block",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        marginRight: "0.5rem",
                        backgroundColor: a.severity === "CRITICAL" ? "#fecaca" : a.severity === "HIGH" ? "#fed7aa" : "#fef08a",
                        color: a.severity === "CRITICAL" ? "#991b1b" : a.severity === "HIGH" ? "#9a3412" : "#854d0e",
                      }}>
                        {a.severity}
                      </span>
                      <strong>{a.anomaly_type}:</strong> {a.description}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "0.85rem", color: "#64748b" }}>
                      Variance: <strong style={{ color: a.variance_percent < 0 ? "#dc2626" : "#16a34a" }}>{a.variance_percent}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposed Remediation & Human-in-the-Loop Approval Gate */}
          {sentinelRun.remediation && (
            <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#0f172a" }}>Proposed Remediation Plan</h3>
                <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 600 }}>
                  Priority: {sentinelRun.remediation.priority}
                </span>
              </div>
              <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600, color: "#1e293b" }}>
                {sentinelRun.remediation.action_summary}
              </p>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#475569" }}>
                <strong>Justification:</strong> {sentinelRun.remediation.justification}
              </p>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "#475569" }}>
                <strong>Estimated Impact:</strong> {sentinelRun.remediation.estimated_impact}
              </p>

              {/* Human Approval Gate Controls */}
              {sentinelRun.status === "awaiting_approval" && (
                <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", padding: "1rem", borderRadius: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "#92400e", fontWeight: 700 }}>
                    <span>⚠️ Human-in-the-Loop Gate:</span> This high-impact intervention requires Manager approval.
                  </div>
                  <input
                    type="text"
                    placeholder="Enter manager remarks or instructions (optional)..."
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", marginBottom: "0.75rem", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={handleApprove}
                      disabled={decisionProcessing}
                      style={{ backgroundColor: "#16a34a", color: "white", padding: "0.5rem 1rem", borderRadius: "4px", border: "none", fontWeight: 600, cursor: "pointer" }}
                    >
                      {decisionProcessing ? "Processing..." : "✓ Approve & Schedule Task"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={decisionProcessing}
                      style={{ backgroundColor: "#dc2626", color: "white", padding: "0.5rem 1rem", borderRadius: "4px", border: "none", fontWeight: 600, cursor: "pointer" }}
                    >
                      {decisionProcessing ? "Processing..." : "✗ Reject Intervention"}
                    </button>
                  </div>
                </div>
              )}

              {sentinelRun.status === "approved" && (
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem", borderRadius: "6px", color: "#166534", fontWeight: 600 }}>
                  ✓ {sentinelRun.final_outcome || "Remediation approved and scheduled in Farm Task Kanban."}
                </div>
              )}

              {sentinelRun.status === "rejected" && (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "0.75rem", borderRadius: "6px", color: "#991b1b", fontWeight: 600 }}>
                  ✗ {sentinelRun.final_outcome || "Remediation rejected by manager."}
                </div>
              )}
            </div>
          )}

          {/* Audit Trace Toggle */}
          <div>
            <button
              onClick={() => setShowTrace(!showTrace)}
              style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", textDecoration: "underline", fontSize: "0.85rem", padding: 0 }}
            >
              {showTrace ? "Hide Audit Trace" : `View Execution Trace (${sentinelRun.trace?.length || 0} steps)`}
            </button>
            {showTrace && (
              <div style={{ marginTop: "0.5rem", backgroundColor: "#0f172a", color: "#e2e8f0", padding: "0.75rem", borderRadius: "6px", fontSize: "0.8rem", maxHeight: "200px", overflowY: "auto" }}>
                <pre style={{ margin: 0 }}>{JSON.stringify(sentinelRun.trace, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTORICAL PRODUCTION TRENDS TABLE & CHARTS */}
      {/* ========================================================================= */}
      {!error && rows.length === 0 && (
        <p>No harvest data recorded yet. Once harvests are logged, yields will appear here.</p>
      )}

      {rows.length > 0 && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Crop{" "}
              <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
                <option value="">All crops</option>
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Total yield</div>
              <strong style={{ fontSize: "1.5rem" }}>{numberFormat.format(grandTotal)}</strong>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Harvested seasons</div>
              <strong style={{ fontSize: "1.5rem" }}>{filtered.length}</strong>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Top field</div>
              <strong style={{ fontSize: "1.5rem" }}>{byField[0]?.fieldName ?? "-"}</strong>
            </div>
          </div>

          <h2>Total yield by field</h2>
          <div style={{ maxWidth: "40rem", marginBottom: "2rem" }}>
            {byField.map((f) => (
              <div key={f.fieldId} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{f.fieldName}</span>
                  <span>{numberFormat.format(f.total)}</span>
                </div>
                <div
                  style={{
                    background: "var(--color-bg-alt)",
                    borderRadius: "4px",
                    height: "16px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: maxTotal > 0 ? `${(f.total / maxTotal) * 100}%` : "0%",
                      height: "100%",
                      background: "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h2>Yield by season</h2>
          <table>
            <thead>
              <tr>
                <th>Season</th>
                <th>Field</th>
                <th>Crop</th>
                <th>Started</th>
                <th>Total yield</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.cropSeasonId}>
                  <td>{r.seasonName}</td>
                  <td>{r.fieldName}</td>
                  <td>{r.cropName}</td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{numberFormat.format(r.totalYield)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
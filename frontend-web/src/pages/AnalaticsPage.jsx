import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHarvestYields, getResourceEfficiency, getWorkerWorkload } from "../api/adminApi";
import {
  runSentinelAnalysis,
  approveSentinelIntervention,
  rejectSentinelIntervention,
} from "../services/sentinelApi";
import {
  getLiveWeather,
  validateProposal,
  getValidationHistory,
  approveValidationProposal,
} from "../services/validationSafetyApi";
import AssessedMultiAgentWorkflowTab from "../components/analytics/AssessedMultiAgentWorkflowTab";

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const currencyFormat = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("trends"); // "trends" | "efficiency" | "workload" | "validation"

  // BI Data State
  const [rows, setRows] = useState([]);
  const [cropFilter, setCropFilter] = useState("");
  const [resourceEff, setResourceEff] = useState(null);
  const [workerWorkload, setWorkerWorkload] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sentinel Agent State
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [sentinelError, setSentinelError] = useState(null);
  const [sentinelRun, setSentinelRun] = useState(null);
  const [managerNotes, setManagerNotes] = useState("");
  const [decisionProcessing, setDecisionProcessing] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  // Agent 4: Validation & Safety Agent State
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationHistory, setValidationHistory] = useState([]);
  const [valLoading, setValLoading] = useState(false);
  const [valError, setValError] = useState(null);
  const [valManagerNotes, setValManagerNotes] = useState("");
  const [valApproving, setValApproving] = useState(false);

  // Simulator Form State
  const [valAgent, setValAgent] = useState("Agent1_FarmPlanner");
  const [valCrop, setValCrop] = useState("Tomato");
  const [valAction, setValAction] = useState("Fertilization");
  const [valInputItem, setValInputItem] = useState("NPK 20-20-20");
  const [valQty, setValQty] = useState(120);
  const [valUnit, setValUnit] = useState("kg/ha");
  const [valStage, setValStage] = useState("Vegetative");

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      getHarvestYields(),
      getResourceEfficiency(),
      getWorkerWorkload(),
    ])
      .then(([yieldsRes, effRes, workloadRes]) => {
        if (yieldsRes.status === "fulfilled") {
          setRows(yieldsRes.value || []);
        } else {
          setError(yieldsRes.reason?.message || "Failed to load harvest yields.");
        }

        if (effRes.status === "fulfilled") {
          setResourceEff(effRes.value);
        }

        if (workloadRes.status === "fulfilled") {
          setWorkerWorkload(workloadRes.value);
        }
      })
      .finally(() => setLoading(false));

    loadWeatherAndValidationHistory();
  }, []);

  async function loadWeatherAndValidationHistory() {
    setWeatherLoading(true);
    try {
      const [wx, hist] = await Promise.allSettled([getLiveWeather(), getValidationHistory(20)]);
      if (wx.status === "fulfilled") setWeatherData(wx.value);
      if (hist.status === "fulfilled") setValidationHistory(hist.value || []);
    } catch {
      // Handled gracefully
    } finally {
      setWeatherLoading(false);
    }
  }

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

  // Run Agent 4 Validation Pipeline
  const handleRunValidation = async () => {
    setValLoading(true);
    setValError(null);
    try {
      const result = await validateProposal({
        proposalId: `PROP-${Date.now().toString().slice(-6)}`,
        generatingAgent: valAgent,
        targetFieldId: "00000000-0000-0000-0000-000000000000",
        cropVariety: valCrop,
        proposedAction: valAction,
        inputItemName: valInputItem,
        proposedQuantity: parseFloat(valQty) || 0,
        unitOfMeasurement: valUnit,
        growthStage: valStage,
      });
      setValidationResult(result);
      // Reload historical audit log from PostgreSQL
      const hist = await getValidationHistory(20);
      setValidationHistory(hist || []);
    } catch (err) {
      setValError(err.message);
    } finally {
      setValLoading(false);
    }
  };

  // Human Approval Gate Handler
  const handleApproveValidation = async () => {
    if (!validationResult?.id) return;
    setValApproving(true);
    try {
      await approveValidationProposal(validationResult.id, valManagerNotes);
      setValidationResult({
        ...validationResult,
        decision: "APPROVED_BY_MANAGER",
        requiresHumanApproval: false,
        outcomeSummary: "Proposal approved for field execution and scheduled in Farm Task Kanban.",
      });
      setValManagerNotes("");
      const hist = await getValidationHistory(20);
      setValidationHistory(hist || []);
    } catch (err) {
      setValError(err.message);
    } finally {
      setValApproving(false);
    }
  };

  // Preset Scenario Loaders
  const loadPreset = (type) => {
    if (type === "safe") {
      setValAgent("Agent1_FarmPlanner");
      setValCrop("Tomato");
      setValAction("Fertilization");
      setValInputItem("NPK 20-20-20");
      setValQty(120);
      setValUnit("kg/ha");
      setValStage("Vegetative");
    } else if (type === "overdose") {
      setValAgent("Agent1_FarmPlanner");
      setValCrop("Tomato");
      setValAction("Fertilization");
      setValInputItem("Urea High Nitrogen");
      setValQty(450); // Fails Check 6: > 250 kg/ha
      setValUnit("kg/ha");
      setValStage("Vegetative");
    } else if (type === "toxic") {
      setValAgent("Agent2_CropAnalysis");
      setValCrop("Tomato");
      setValAction("PesticideSpraying");
      setValInputItem("Atrazine Herbicide"); // Fails Check 1: Incompatible
      setValQty(2.5);
      setValUnit("L/ha");
      setValStage("Fruiting");
    } else if (type === "banned") {
      setValAgent("Agent2_CropAnalysis");
      setValCrop("Chili");
      setValAction("PestControl");
      setValInputItem("Chlorpyrifos 20EC"); // Fails Check 4: Banned
      setValQty(2.0);
      setValUnit("L/ha");
      setValStage("Vegetative");
    } else if (type === "rain_irrigation") {
      setValAgent("Agent3_Inventory");
      setValCrop("Rice");
      setValAction("Irrigation");
      setValInputItem("Drip Water");
      setValQty(15000);
      setValUnit("liters");
      setValStage("Vegetative");
    }
  };

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

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        <p>Loading enterprise analytics & governance reports...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page" style={{ padding: "1.5rem", maxWidth: "1250px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem 0", color: "#091413" }}>Governance, Security & Business Intelligence</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Component 4 • Executive Reporting, Workforce Analytics & Agent 4 Validation Firewall
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => setActiveTab("validation")}
            style={{
              backgroundColor: activeTab === "validation" ? "#0284c7" : "#0f172a",
              color: "white",
              padding: "0.6rem 1.25rem",
              borderRadius: "6px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            🛡️ Agent 4: Safety Firewall
          </button>
          <button
            onClick={handleRunSentinel}
            disabled={sentinelLoading}
            style={{
              backgroundColor: "#285A48",
              color: "white",
              padding: "0.6rem 1.25rem",
              borderRadius: "6px",
              border: "none",
              fontWeight: 600,
              cursor: sentinelLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {sentinelLoading ? "Evaluating..." : "📊 Operations Sentinel"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "1rem", marginBottom: "1.5rem", borderRadius: "0.5rem", backgroundColor: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{error}</p>
          {(error.includes("401") || error.includes("403") || error.includes("failed with status") || error.includes("token")) && (
            <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>
              Administrator, Agronomist or Farm Manager credentials are required. Please{" "}
              <Link to="/login" style={{ fontWeight: 700, color: "#285A48", textDecoration: "underline" }}>
                Sign In
              </Link>{" "}
              (Default: <strong>admin</strong> / <strong>ChangeMe123!</strong>).
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPONENT 4 BI TAB NAVIGATION */}
      {/* ========================================================================= */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("validation")}
          style={{
            padding: "0.75rem 1.25rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "validation" ? "3px solid #0284c7" : "3px solid transparent",
            color: activeTab === "validation" ? "#0284c7" : "#64748b",
            fontWeight: activeTab === "validation" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          🛡️ Agent 4: Validation & Safety Agent
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          style={{
            padding: "0.75rem 1.25rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "trends" ? "3px solid #285A48" : "3px solid transparent",
            color: activeTab === "trends" ? "#285A48" : "#64748b",
            fontWeight: activeTab === "trends" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          🌾 Historical Production Trends
        </button>
        <button
          onClick={() => setActiveTab("efficiency")}
          style={{
            padding: "0.75rem 1.25rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "efficiency" ? "3px solid #285A48" : "3px solid transparent",
            color: activeTab === "efficiency" ? "#285A48" : "#64748b",
            fontWeight: activeTab === "efficiency" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          💧 Resource & Water Efficiency
        </button>
        <button
          onClick={() => setActiveTab("assessed-workflow")}
          style={{
            padding: "0.75rem 1.25rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "assessed-workflow" ? "3px solid #059669" : "3px solid transparent",
            color: activeTab === "assessed-workflow" ? "#059669" : "#64748b",
            fontWeight: activeTab === "assessed-workflow" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          🚀 9.1 Assessed Multi-Agent Workflow
        </button>
        <button
          onClick={() => setActiveTab("workload")}
          style={{
            padding: "0.75rem 1.25rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "workload" ? "3px solid #285A48" : "3px solid transparent",
            color: activeTab === "workload" ? "#285A48" : "#64748b",
            fontWeight: activeTab === "workload" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          👥 Worker Workload & Performance
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB: SECTION 9.1 ASSESSED MULTI-AGENT WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === "assessed-workflow" && <AssessedMultiAgentWorkflowTab />}

      {/* ========================================================================= */}
      {/* TAB 0: AGENT 4 - VALIDATION & SAFETY AGENT */}
      {/* ========================================================================= */}
      {activeTab === "validation" && (
        <div>
          {/* Subsystem Banner */}
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#166534", fontWeight: 700 }}>
                  SE3090 Grounded Agent Subsystem • Sahas
                </span>
                <h2 style={{ margin: "0.2rem 0", color: "#14532d", fontSize: "1.35rem" }}>
                  Agent 4: The Validation & Safety Agent
                </h2>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#166534", maxWidth: "850px" }}>
                  Deterministic security and compliance firewall. Intercepts AI proposals from Agent 1 (Planner), Agent 2 (Diagnostics), and Agent 3 (Inventory), evaluating them through a strict 6-step deterministic checklist and live 3rd-party meteorological data. Unsafe proposals are halted and revised; verified proposals pause for Human Approval.
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-block", backgroundColor: "#15803d", color: "white", padding: "0.3rem 0.75rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700 }}>
                  ● DETERMINISTIC FIREWALL ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* External Third-Party Meteorological Service Widget */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.3rem" }}>🌤️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a" }}>External Meteorological Integration (Live Weather API)</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Source: {weatherData?.locationName || "Open-Meteo REST Meteorological Gateway"} • GPS: (6.9271° N, 79.8612° E)
                  </span>
                </div>
              </div>
              <button
                onClick={loadWeatherAndValidationHistory}
                disabled={weatherLoading}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "0.3rem 0.75rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
              >
                {weatherLoading ? "Refreshing..." : "↻ Refresh Live Weather"}
              </button>
            </div>

            {weatherData && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>TEMPERATURE</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: weatherData.temperatureCelsius > 35 ? "#dc2626" : "#0284c7" }}>
                      {weatherData.temperatureCelsius.toFixed(1)}°C
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Condition: {weatherData.conditionDescription}</span>
                  </div>

                  <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>RAIN PROBABILITY</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: weatherData.rainProbabilityPercent >= 60 ? "#dc2626" : "#16a34a" }}>
                      {weatherData.rainProbabilityPercent}%
                    </div>
                    <span style={{ fontSize: "0.75rem", color: weatherData.rainProbabilityPercent >= 60 ? "#dc2626" : "#64748b" }}>
                      {weatherData.rainProbabilityPercent >= 60 ? "⚠️ Irrigation Redundancy" : "Safe for treatment"}
                    </span>
                  </div>

                  <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>WIND SPEED & DRIFT</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: weatherData.windSpeedKmh > 20 ? "#dc2626" : "#16a34a" }}>
                      {weatherData.windSpeedKmh.toFixed(1)} km/h
                    </div>
                    <span style={{ fontSize: "0.75rem", color: weatherData.windSpeedKmh > 20 ? "#dc2626" : "#64748b" }}>
                      {weatherData.windSpeedKmh > 20 ? "🚨 Chemical Spray Drift Risk" : `Dir: ${weatherData.windDirection}`}
                    </span>
                  </div>

                  <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>RELATIVE HUMIDITY</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#334155" }}>
                      {weatherData.humidityPercent}%
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Transpiration rate optimal</span>
                  </div>
                </div>

                {/* Forecast Strip */}
                {weatherData.forecastDays?.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                    {weatherData.forecastDays.map((d, i) => (
                      <div key={i} style={{ minWidth: "120px", flex: 1, backgroundColor: "#f1f5f9", padding: "0.5rem", borderRadius: "4px", fontSize: "0.8rem", textAlign: "center" }}>
                        <div style={{ fontWeight: 700, color: "#334155" }}>{d.date}</div>
                        <div style={{ fontWeight: 600 }}>{d.maxTempCelsius}° / {d.minTempCelsius}°</div>
                        <div style={{ color: d.rainProbabilityPercent >= 50 ? "#0284c7" : "#64748b" }}>Rain: {d.rainProbabilityPercent}%</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.condition}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Validation Simulator & Testing Sandbox */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1.5rem", marginBottom: "1.5rem", alignItems: "start" }}>
            {/* Form */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.05rem", color: "#091413" }}>AI Proposal Validation Simulator</h3>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#64748b" }}>
                Test deterministic safety boundaries against arbitrary inputs or load calibrated edge-case scenarios:
              </p>

              {/* Preset Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => loadPreset("safe")}
                  style={{ backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  ✓ Safe NPK Treatment
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset("overdose")}
                  style={{ backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  ⚠️ 450 kg/ha Overdose
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset("toxic")}
                  style={{ backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  🚫 Incompatible Chemical
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset("banned")}
                  style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde047", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  ⚖️ Banned Pesticide
                </button>
              </div>

              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.2rem" }}>Generating Agent</label>
                  <select
                    value={valAgent}
                    onChange={(e) => setValAgent(e.target.value)}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Agent1_FarmPlanner">Agent 1: Farm Planning Agent (LangGraph)</option>
                    <option value="Agent2_CropAnalysis">Agent 2: AI Crop Diagnostics (LangGraph)</option>
                    <option value="Agent3_Inventory">Agent 3: Inventory Reorder Agent (LangGraph)</option>
                    <option value="Mobile_FieldObservation">Mobile App Field Worker Proposal</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.2rem" }}>Crop Variety</label>
                    <input
                      type="text"
                      value={valCrop}
                      onChange={(e) => setValCrop(e.target.value)}
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.2rem" }}>Growth Stage</label>
                    <select
                      value={valStage}
                      onChange={(e) => setValStage(e.target.value)}
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Vegetative">Vegetative</option>
                      <option value="Flowering">Flowering</option>
                      <option value="Fruiting">Fruiting</option>
                      <option value="HarvestReady">HarvestReady (Pre-Harvest PHI)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.2rem" }}>Proposed Action</label>
                  <input
                    type="text"
                    value={valAction}
                    onChange={(e) => setValAction(e.target.value)}
                    placeholder="e.g. Fertilization, PesticideSpraying, Irrigation"
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.2rem" }}>Input Material / Chemical</label>
                  <input
                    type="text"
                    value={valInputItem}
                    onChange={(e) => setValInputItem(e.target.value)}
                    placeholder="e.g. NPK 20-20-20, Copper Fungicide, Atrazine"
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.2rem" }}>Proposed Quantity</label>
                    <input
                      type="number"
                      value={valQty}
                      onChange={(e) => setValQty(e.target.value)}
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.2rem" }}>Unit</label>
                    <input
                      type="text"
                      value={valUnit}
                      onChange={(e) => setValUnit(e.target.value)}
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunValidation}
                  disabled={valLoading}
                  style={{
                    marginTop: "0.5rem",
                    backgroundColor: "#0284c7",
                    color: "white",
                    padding: "0.65rem 1rem",
                    borderRadius: "6px",
                    border: "none",
                    fontWeight: 700,
                    cursor: valLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {valLoading ? "Evaluating Deterministic Rules..." : "🛡️ Submit Proposal to Safety Agent"}
                </button>
              </div>

              {valError && (
                <div style={{ marginTop: "0.75rem", padding: "0.5rem", borderRadius: "4px", backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "0.85rem" }}>
                  {valError}
                </div>
              )}
            </div>

            {/* Validation Outcome Console */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.05rem", color: "#091413" }}>Deterministic Evaluation Outcome</h3>
              
              {!validationResult ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748b" }}>
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>⚖️</span>
                  <p style={{ margin: 0, fontWeight: 500 }}>Select a preset or click "Submit Proposal" to trigger the 6-step deterministic safety pipeline.</p>
                </div>
              ) : (
                <div>
                  {/* Decision Banner */}
                  <div style={{
                    padding: "1rem",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    backgroundColor: validationResult.decision === "VALID" ? "#f0fdf4" : validationResult.decision === "APPROVED_BY_MANAGER" ? "#eff6ff" : "#fef2f2",
                    border: `1px solid ${validationResult.decision === "VALID" ? "#86efac" : validationResult.decision === "APPROVED_BY_MANAGER" ? "#93c5fd" : "#fca5a5"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        backgroundColor: validationResult.decision === "VALID" ? "#16a34a" : validationResult.decision === "APPROVED_BY_MANAGER" ? "#2563eb" : "#dc2626",
                        color: "white"
                      }}>
                        OUTCOME: {validationResult.decision}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Proposal: <code>{validationResult.proposalId}</code></span>
                    </div>
                    <p style={{ margin: "0.5rem 0 0 0", fontWeight: 600, color: "#1e293b" }}>
                      {validationResult.outcomeSummary}
                    </p>
                  </div>

                  {/* 6-Step Checklist Results */}
                  <div style={{ marginBottom: "1rem" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#475569" }}>Sequential Deterministic Rules Checklist:</h4>
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      {validationResult.checks?.map((c, idx) => (
                        <div key={idx} style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0",
                          backgroundColor: c.passed ? "#f8fafc" : "#fff5f5",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.85rem",
                        }}>
                          <div>
                            <span style={{ fontWeight: 700, color: c.passed ? "#16a34a" : "#dc2626", marginRight: "0.5rem" }}>
                              {c.passed ? "✓ PASS" : "✗ FAIL"}
                            </span>
                            <strong>{c.checkName}:</strong> <span style={{ color: "#334155" }}>{c.message}</span>
                          </div>
                          <code style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.ruleCode}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Automated Revision Guidance (Branching Outcome A) */}
                  {validationResult.revisionGuidance && (
                    <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem" }}>
                      <strong style={{ color: "#b45309", display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                        Automated Request for Revision (Dispatched to {validationResult.generatingAgent}):
                      </strong>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#92400e" }}>
                        {validationResult.revisionGuidance}
                      </p>
                    </div>
                  )}

                  {/* Human Approval Gate (Branching Outcome B) */}
                  {validationResult.requiresHumanApproval && (
                    <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", padding: "1rem" }}>
                      <div style={{ fontWeight: 700, color: "#166534", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                        🛡️ Human-in-the-Loop Approval Gate:
                      </div>
                      <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", color: "#15803d" }}>
                        All 6 deterministic rules and environmental weather criteria have passed. Confirm farm manager authorization to schedule task in PostgreSQL.
                      </p>
                      <input
                        type="text"
                        placeholder="Manager notes or shift instructions..."
                        value={valManagerNotes}
                        onChange={(e) => setValManagerNotes(e.target.value)}
                        style={{ width: "100%", padding: "0.45rem", borderRadius: "4px", border: "1px solid #cbd5e1", marginBottom: "0.5rem", boxSizing: "border-box" }}
                      />
                      <button
                        type="button"
                        onClick={handleApproveValidation}
                        disabled={valApproving}
                        style={{
                          backgroundColor: "#16a34a",
                          color: "white",
                          padding: "0.5rem 1rem",
                          borderRadius: "4px",
                          border: "none",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {valApproving ? "Recording Approval..." : "✓ Authorize & Schedule Farm Task"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Validation Audit Log (ValidationResults in PostgreSQL) */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.05rem" }}>PostgreSQL Validation Audit Ledger</h3>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Permanent immutable records of all Agent 4 evaluations stored in <code>ValidationResults</code> table.
                </span>
              </div>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Total Records: <strong>{validationHistory.length}</strong>
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "0.5rem" }}>Timestamp</th>
                    <th style={{ padding: "0.5rem" }}>Proposal ID</th>
                    <th style={{ padding: "0.5rem" }}>Generating Agent</th>
                    <th style={{ padding: "0.5rem" }}>Decision</th>
                    <th style={{ padding: "0.5rem" }}>Outcome Summary</th>
                    <th style={{ padding: "0.5rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validationHistory.length > 0 ? (
                    validationHistory.map((h) => (
                      <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.5rem", whiteSpace: "nowrap", color: "#64748b" }}>
                          {new Date(h.createdAt).toLocaleTimeString()} {new Date(h.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.5rem", fontWeight: 600 }}><code>{h.proposalId}</code></td>
                        <td style={{ padding: "0.5rem", color: "#0284c7", fontWeight: 600 }}>{h.generatingAgent}</td>
                        <td style={{ padding: "0.5rem" }}>
                          <span style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: h.decision === "VALID" ? "#dcfce7" : h.decision === "APPROVED_BY_MANAGER" ? "#e0f2fe" : "#fee2e2",
                            color: h.decision === "VALID" ? "#15803d" : h.decision === "APPROVED_BY_MANAGER" ? "#0369a1" : "#b91c1c",
                          }}>
                            {h.decision}
                          </span>
                        </td>
                        <td style={{ padding: "0.5rem", color: "#334155" }}>{h.outcomeSummary}</td>
                        <td style={{ padding: "0.5rem" }}>
                          {h.requiresHumanApproval ? (
                            <span style={{ color: "#d97706", fontWeight: 600 }}>Awaiting Manager</span>
                          ) : (
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>
                        No validation records logged yet. Run a proposal validation test above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPERATIONS SENTINEL AGENT CONSOLE */}
      {/* ========================================================================= */}
      {sentinelRun && (
        <div style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1.25rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                Autonomous Agent 4 Sentinel
              </span>
              <h2 style={{ margin: "0.2rem 0", color: "#091413" }}>AI Operations Sentinel Report</h2>
              <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                Run ID: <code>{sentinelRun.run_id}</code> • Status: <strong>{sentinelRun.status.toUpperCase()}</strong>
              </span>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ textAlign: "center", padding: "0.5rem 1rem", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>YIELD SCORE</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: sentinelRun.yield_performance_score >= 70 ? "#285A48" : "#dc2626" }}>
                  {sentinelRun.yield_performance_score}/100
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "0.5rem 1rem", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>RISK LEVEL</div>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: sentinelRun.overall_risk_level === "CRITICAL" ? "#b91c1c" : sentinelRun.overall_risk_level === "HIGH" ? "#ea580c" : sentinelRun.overall_risk_level === "MEDIUM" ? "#ca8a04" : "#285A48"
                }}>
                  {sentinelRun.overall_risk_level}
                </div>
              </div>
            </div>
          </div>

          {sentinelRun.strategic_commentary && (
            <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "6px", borderLeft: "4px solid #285A48", marginBottom: "1rem" }}>
              <strong style={{ color: "#285A48", display: "block", marginBottom: "0.25rem" }}>Strategic Assessment:</strong>
              <p style={{ margin: 0, color: "#334155", fontStyle: "italic" }}>"{sentinelRun.strategic_commentary}"</p>
            </div>
          )}

          {sentinelRun.anomalies?.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem 0", color: "#122A24" }}>Detected Operational & Yield Anomalies</h3>
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
                      Variance: <strong style={{ color: a.variance_percent < 0 ? "#dc2626" : "#285A48" }}>{a.variance_percent}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sentinelRun.remediation && (
            <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#091413" }}>Proposed Remediation Plan</h3>
                <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 600 }}>
                  Priority: {sentinelRun.remediation.priority}
                </span>
              </div>
              <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600, color: "#122A24" }}>
                {sentinelRun.remediation.action_summary}
              </p>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#475569" }}>
                <strong>Justification:</strong> {sentinelRun.remediation.justification}
              </p>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "#475569" }}>
                <strong>Estimated Impact:</strong> {sentinelRun.remediation.estimated_impact}
              </p>

              {sentinelRun.status === "awaiting_approval" && (
                <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", padding: "1rem", borderRadius: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "#92400e", fontWeight: 700 }}>
                    <span>⚠️ Human-in-the-Loop Gate:</span> This intervention requires Manager approval.
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
                      style={{ backgroundColor: "#285A48", color: "white", padding: "0.5rem 1rem", borderRadius: "4px", border: "none", fontWeight: 600, cursor: "pointer" }}
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
                <div style={{ backgroundColor: "#F2FAF6", border: "1px solid #B0E4CC", padding: "0.75rem", borderRadius: "6px", color: "#166534", fontWeight: 600 }}>
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

          <div>
            <button
              onClick={() => setShowTrace(!showTrace)}
              style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", textDecoration: "underline", fontSize: "0.85rem", padding: 0 }}
            >
              {showTrace ? "Hide Audit Trace" : `View Execution Trace (${sentinelRun.trace?.length || 0} steps)`}
            </button>
            {showTrace && (
              <div style={{ marginTop: "0.5rem", backgroundColor: "#091413", color: "#e2e8f0", padding: "0.75rem", borderRadius: "6px", fontSize: "0.8rem", maxHeight: "200px", overflowY: "auto" }}>
                <pre style={{ margin: 0 }}>{JSON.stringify(sentinelRun.trace, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: HISTORICAL PRODUCTION TRENDS (COMPONENT 1) */}
      {/* ========================================================================= */}
      {activeTab === "trends" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>Seasonal Harvest Yields across Fields</h2>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                Evaluates long-term agricultural productivity and field fertility across harvest cycles.
              </p>
            </div>
            <div>
              <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                Filter Crop:{" "}
                <select
                  value={cropFilter}
                  onChange={(e) => setCropFilter(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                >
                  <option value="">All crops</option>
                  {crops.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {rows.length === 0 ? (
            <p style={{ color: "#64748b" }}>No harvest yield records found. Log season harvests in Component 1 to visualize productivity trends.</p>
          ) : (
            <>
              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Total Harvest Yield</div>
                  <strong style={{ fontSize: "1.6rem", color: "#285A48" }}>{numberFormat.format(grandTotal)} kg</strong>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Recorded Seasons</div>
                  <strong style={{ fontSize: "1.6rem" }}>{filtered.length}</strong>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Top Performing Field</div>
                  <strong style={{ fontSize: "1.6rem", color: "#0284c7" }}>{byField[0]?.fieldName ?? "-"}</strong>
                </div>
              </div>

              {/* Yield by Field Progress Bars */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem" }}>Total Yield by Field</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {byField.map((f) => (
                    <div key={f.fieldId}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: 600 }}>{f.fieldName}</span>
                        <span>{numberFormat.format(f.total)} kg</span>
                      </div>
                      <div
                        style={{
                          background: "#e2e8f0",
                          borderRadius: "4px",
                          height: "14px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: maxTotal > 0 ? `${(f.total / maxTotal) * 100}%` : "0%",
                            height: "100%",
                            background: "#285A48",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yield by Season Table */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem" }}>Historical Harvest Log</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "0.5rem" }}>Season</th>
                      <th style={{ padding: "0.5rem" }}>Field</th>
                      <th style={{ padding: "0.5rem" }}>Crop</th>
                      <th style={{ padding: "0.5rem" }}>Started Date</th>
                      <th style={{ padding: "0.5rem", textAlign: "right" }}>Yield (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.cropSeasonId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.5rem", fontWeight: 600 }}>{r.seasonName}</td>
                        <td style={{ padding: "0.5rem" }}>{r.fieldName}</td>
                        <td style={{ padding: "0.5rem" }}>{r.cropName}</td>
                        <td style={{ padding: "0.5rem" }}>{new Date(r.startDate).toLocaleDateString()}</td>
                        <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>{numberFormat.format(r.totalYield)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RESOURCE & WATER EFFICIENCY ANALYTICS (COMPONENT 3 & 4) */}
      {/* ========================================================================= */}
      {activeTab === "efficiency" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>Resource & Water Efficiency Analytics</h2>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
              Aggregates Component 3 inventory consumption and operational irrigation/treatment tasks against crop yields.
            </p>
          </div>

          {resourceEff ? (
            <>
              {/* Executive KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #0284c7" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>WATER CONSUMED</div>
                  <strong style={{ fontSize: "1.5rem", color: "#0369a1" }}>{numberFormat.format(resourceEff.totalWaterConsumedLiters)} L</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Ratio: <strong>{resourceEff.waterEfficiencyRatioLitersPerKg} L/kg</strong>
                  </div>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #16a34a" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>FERTILIZER CONSUMED</div>
                  <strong style={{ fontSize: "1.5rem", color: "#15803d" }}>{numberFormat.format(resourceEff.totalFertilizerConsumedKg)} kg</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Ratio: <strong>{resourceEff.fertilizerEfficiencyRatioKgPerKg} kg/kg</strong>
                  </div>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #ea580c" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>PESTICIDE CONSUMED</div>
                  <strong style={{ fontSize: "1.5rem", color: "#c2410c" }}>{numberFormat.format(resourceEff.totalPesticideConsumedLiters)} L</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Targeted crop protection
                  </div>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "4px solid #285A48" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>TOTAL HARVEST YIELD</div>
                  <strong style={{ fontSize: "1.5rem", color: "#285A48" }}>{numberFormat.format(resourceEff.totalHarvestYieldKg)} kg</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Aggregated harvest base
                  </div>
                </div>
              </div>

              {/* Resource Breakdown Table */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem" }}>Input Consumption & Efficiency Breakdown</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "0.5rem" }}>Category</th>
                      <th style={{ padding: "0.5rem" }}>Resource Item</th>
                      <th style={{ padding: "0.5rem", textAlign: "right" }}>Total Consumed</th>
                      <th style={{ padding: "0.5rem", textAlign: "right" }}>Est. Total Cost</th>
                      <th style={{ padding: "0.5rem", textAlign: "right" }}>Related Tasks</th>
                      <th style={{ padding: "0.5rem", textAlign: "right" }}>Consumption / kg Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourceEff.resourceBreakdown?.length > 0 ? (
                      resourceEff.resourceBreakdown.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.5rem" }}>
                            <span style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              backgroundColor: item.category.toLowerCase().includes("water") ? "#e0f2fe" : item.category.toLowerCase().includes("fertil") ? "#dcfce7" : "#ffedd5",
                              color: item.category.toLowerCase().includes("water") ? "#0369a1" : item.category.toLowerCase().includes("fertil") ? "#15803d" : "#c2410c",
                            }}>
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: "0.5rem", fontWeight: 600 }}>{item.itemName}</td>
                          <td style={{ padding: "0.5rem", textAlign: "right" }}>
                            {numberFormat.format(item.totalConsumedQuantity)} {item.unitOfMeasurement}
                          </td>
                          <td style={{ padding: "0.5rem", textAlign: "right", color: "#334155" }}>
                            {currencyFormat.format(item.estimatedTotalCost)}
                          </td>
                          <td style={{ padding: "0.5rem", textAlign: "right" }}>
                            <span style={{ backgroundColor: "#f1f5f9", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                              {item.relatedTasksCount} tasks
                            </span>
                          </td>
                          <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>
                            {item.consumptionPerKgYield > 0 ? `${item.consumptionPerKgYield} ${item.unitOfMeasurement}/kg` : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>
                          No inventory consumption records logged yet. Check Component 3 inventory transactions.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p style={{ color: "#64748b" }}>Unable to load resource efficiency data.</p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKER WORKLOAD & PERFORMANCE METRICS (COMPONENT 2 & 4) */}
      {/* ========================================================================= */}
      {activeTab === "workload" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>Worker Workload & Performance Metrics</h2>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
              Analyzes task assignment turnaround times, completion success rates, and active labor distribution to prevent staff burnout.
            </p>
          </div>

          {workerWorkload ? (
            <>
              {/* Workforce KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>ACTIVE FIELD WORKERS</div>
                  <strong style={{ fontSize: "1.6rem", color: "#285A48" }}>{workerWorkload.totalActiveWorkers}</strong>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>TOTAL TASKS TRACKED</div>
                  <strong style={{ fontSize: "1.6rem" }}>{workerWorkload.totalTasksTracked}</strong>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>TEAM COMPLETION RATE</div>
                  <strong style={{ fontSize: "1.6rem", color: "#16a34a" }}>
                    {workerWorkload.averageTeamCompletionRatePercent}%
                  </strong>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>HIGH BURNOUT RISK</div>
                  <strong style={{
                    fontSize: "1.6rem",
                    color: workerWorkload.highBurnoutRiskCount > 0 ? "#dc2626" : "#16a34a",
                  }}>
                    {workerWorkload.highBurnoutRiskCount} workers
                  </strong>
                </div>
              </div>

              {/* Workers Table */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem" }}>Labor Distribution & Burnout Risk Matrix</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "0.5rem" }}>Worker</th>
                      <th style={{ padding: "0.5rem" }}>Employment</th>
                      <th style={{ padding: "0.5rem", textAlign: "center" }}>Total Assigned</th>
                      <th style={{ padding: "0.5rem", textAlign: "center" }}>Completed</th>
                      <th style={{ padding: "0.5rem", textAlign: "center" }}>Active Load</th>
                      <th style={{ padding: "0.5rem" }}>Completion Rate</th>
                      <th style={{ padding: "0.5rem", textAlign: "right" }}>Avg Turnaround</th>
                      <th style={{ padding: "0.5rem", textAlign: "center" }}>Burnout Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerWorkload.workerMetrics?.length > 0 ? (
                      workerWorkload.workerMetrics.map((w) => (
                        <tr key={w.workerId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.5rem" }}>
                            <strong style={{ display: "block" }}>{w.fullName}</strong>
                            <span style={{ fontSize: "0.75rem", color: w.status === "Active" ? "#16a34a" : "#64748b" }}>
                              ● {w.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.5rem", color: "#64748b" }}>{w.employmentType}</td>
                          <td style={{ padding: "0.5rem", textAlign: "center", fontWeight: 600 }}>{w.totalTasksAssigned}</td>
                          <td style={{ padding: "0.5rem", textAlign: "center", color: "#16a34a", fontWeight: 600 }}>{w.completedTasks}</td>
                          <td style={{ padding: "0.5rem", textAlign: "center" }}>
                            <span style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor: (w.inProgressTasks + w.pendingTasks) >= 5 ? "#fee2e2" : "#f1f5f9",
                              color: (w.inProgressTasks + w.pendingTasks) >= 5 ? "#b91c1c" : "#334155",
                              fontWeight: 600,
                            }}>
                              {w.inProgressTasks + w.pendingTasks}
                            </span>
                          </td>
                          <td style={{ padding: "0.5rem", minWidth: "140px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ flex: 1, backgroundColor: "#e2e8f0", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                                <div style={{
                                  width: `${w.completionRatePercent}%`,
                                  height: "100%",
                                  backgroundColor: w.completionRatePercent >= 70 ? "#16a34a" : w.completionRatePercent >= 40 ? "#f59e0b" : "#dc2626",
                                }} />
                              </div>
                              <span style={{ fontSize: "0.8rem", fontWeight: 600, minWidth: "35px" }}>{w.completionRatePercent}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "0.5rem", textAlign: "right" }}>
                            {w.averageTurnaroundHours > 0 ? `${w.averageTurnaroundHours} hrs` : "—"}
                          </td>
                          <td style={{ padding: "0.5rem", textAlign: "center" }}>
                            <span style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              backgroundColor: w.burnoutRiskLevel === "High" ? "#fee2e2" : w.burnoutRiskLevel === "Medium" ? "#fef3c7" : "#dcfce7",
                              color: w.burnoutRiskLevel === "High" ? "#b91c1c" : w.burnoutRiskLevel === "Medium" ? "#b45309" : "#15803d",
                            }}>
                              {w.burnoutRiskLevel}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>
                          No worker records found. Register workers in Component 2 to track operational performance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p style={{ color: "#64748b" }}>Unable to load worker workload metrics.</p>
          )}
        </div>
      )}
    </div>
  );
}
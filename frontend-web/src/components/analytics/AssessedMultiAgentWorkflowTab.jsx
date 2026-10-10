import React, { useState } from 'react';
import { executeAssessedWorkflow, resumeAssessedWorkflow } from '../../services/multiAgentWorkflowApi';

export default function AssessedMultiAgentWorkflowTab() {
  const [objective, setObjective] = useState("Remediate early blight outbreak on Field Alpha Tomato plot and restock fungicide");
  const [cropVariety, setCropVariety] = useState("Tomato");
  const [observation, setObservation] = useState("Dark concentric spots with yellow chlorotic halos on lower foliage");
  const [proposedAction, setProposedAction] = useState("PesticideSpraying");
  const [inputItemName, setInputItemName] = useState("Copper Hydroxide");
  const [proposedQuantity, setProposedQuantity] = useState(2.0);
  const [unit, setUnit] = useState("kg/ha");
  const [growthStage, setGrowthStage] = useState("Vegetative");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workflowRecord, setWorkflowRecord] = useState(null);
  const [managerNotes, setManagerNotes] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [simulateOptimalWeather, setSimulateOptimalWeather] = useState(true);

  const applyPreset = (type) => {
    if (type === "compliant") {
      setObjective("Remediate early blight outbreak on Field Alpha Tomato plot and restock fungicide");
      setCropVariety("Tomato");
      setObservation("Dark concentric spots with yellow chlorotic halos on lower foliage");
      setProposedAction("PesticideSpraying");
      setInputItemName("Copper Hydroxide");
      setProposedQuantity(2.0);
      setUnit("kg/ha");
      setGrowthStage("Vegetative");
      setSimulateOptimalWeather(true);
    } else if (type === "overdose") {
      setObjective("Aggressive pest control on Tomato plot using concentrated pesticide");
      setCropVariety("Tomato");
      setObservation("Severe caterpillar and insect infestation on foliage");
      setProposedAction("PesticideSpraying");
      setInputItemName("Copper Hydroxide");
      setProposedQuantity(15.0); // Fails Check 6: Max 5.0 kg/ha limit
      setUnit("kg/ha");
      setGrowthStage("Vegetative");
      setSimulateOptimalWeather(true);
    } else if (type === "banned") {
      setObjective("Eradicate weed infestation in Chili plot using persistent herbicide");
      setCropVariety("Chili");
      setObservation("Dense grassy weeds outcompeting crop rows");
      setProposedAction("PestControl");
      setInputItemName("Chlorpyrifos 20EC"); // Fails Check 4: Banned under GAP
      setProposedQuantity(2.0);
      setUnit("L/ha");
      setGrowthStage("Vegetative");
      setSimulateOptimalWeather(true);
    }
  };

  const handleRunWorkflow = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await executeAssessedWorkflow({
        objective,
        cropVariety,
        observation,
        targetFieldName: "Field Alpha",
        proposedAction,
        inputItemName,
        proposedQuantity: parseFloat(proposedQuantity) || 2.0,
        unit,
        growthStage,
        simulateOptimalWeather,
      });
      setWorkflowRecord(result);
    } catch (err) {
      setError(err.message || "Failed to execute multi-agent workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeDecision = async (decision) => {
    if (!workflowRecord?.workflowId) return;
    setResumeLoading(true);
    setError(null);
    try {
      const updated = await resumeAssessedWorkflow(workflowRecord.workflowId, decision, managerNotes);
      setWorkflowRecord(updated);
      setManagerNotes("");
    } catch (err) {
      setError(err.message || "Failed to resume workflow");
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* SECTION 9.1 COMPLIANCE BANNER */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)",
        color: "white",
        padding: "1.25rem 1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", background: "rgba(255,255,255,0.2)", padding: "0.2rem 0.6rem", borderRadius: "4px" }}>
              SE3090 Requirement 9.1
            </span>
            <h2 style={{ margin: "0.5rem 0 0.25rem 0", color: "#6ee7b7" }}>
              Full 4-Agent Coordinated Assessed Workflow
            </h2>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#cbd5e1", maxWidth: "800px" }}>
              Demonstrates complete end-to-end multi-agent orchestration: receives domain objective → creates structured multi-step plan (Agent 1) → delegates symptom diagnosis (Agent 2) → delegates inventory & supplier quotes (Agent 3) → applies deterministic validation & live weather gating (Agent 4) → freezes at Human Approval Gate → produces auditable result or safe recorded failure.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ background: "#059669", color: "white", padding: "0.3rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
              4 Distinct Agents
            </span>
            <span style={{ background: "#0284c7", color: "white", padding: "0.3rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
              Live Weather Gated
            </span>
            <span style={{ background: "#d97706", color: "white", padding: "0.3rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
              HITL Approved
            </span>
          </div>
        </div>
      </div>

      {/* QUICK PRESETS & OBJECTIVE FORM */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem" }}>
            🎯 Step 1: Input Domain Objective
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b", alignSelf: "center", fontWeight: 600 }}>Demo Presets:</span>
            <button
              onClick={() => applyPreset("compliant")}
              style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "0.3rem 0.75rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
            >
              ✅ Scenario A: Full Success Path
            </button>
            <button
              onClick={() => applyPreset("overdose")}
              style={{ background: "#fef2f2", border: "1px solid #ef4444", color: "#991b1b", padding: "0.3rem 0.75rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
            >
              ⚠️ Scenario B: Safe Failure (Overdose)
            </button>
            <button
              onClick={() => applyPreset("banned")}
              style={{ background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e", padding: "0.3rem 0.75rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
            >
              🚫 Scenario C: Safe Failure (Banned Chemical)
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
              Domain Objective
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
              Field Observation (Agent 2 Input)
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={2}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Crop Variety</label>
            <input type="text" value={cropVariety} onChange={(e) => setCropVariety(e.target.value)} style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Proposed Action</label>
            <input type="text" value={proposedAction} onChange={(e) => setProposedAction(e.target.value)} style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Input Material</label>
            <input type="text" value={inputItemName} onChange={(e) => setInputItemName(e.target.value)} style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Quantity & Unit</label>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <input type="number" value={proposedQuantity} onChange={(e) => setProposedQuantity(e.target.value)} style={{ width: "65%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: "35%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            </div>
          </div>
        </div>

        {/* METEOROLOGICAL SAFETY EVALUATION MODE */}
        <div style={{
          marginTop: "1.25rem",
          padding: "0.75rem 1rem",
          background: simulateOptimalWeather ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${simulateOptimalWeather ? "#86efac" : "#fca5a5"}`,
          borderRadius: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem"
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: simulateOptimalWeather ? "#166534" : "#991b1b" }}>
              🌤️ Meteorological Safety Evaluation Mode:
            </span>
            <span style={{ fontSize: "0.8rem", color: "#475569", marginLeft: "0.5rem" }}>
              {simulateOptimalWeather
                ? "Evaluates against Scheduled Clear Application Window (15% Rain, 11 km/h Wind — Safe for Fieldwork)"
                : "Evaluates against Live Real-Time Open-Meteo Meteorological Station (Blocks foliar spraying if raining outdoors)"}
            </span>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", color: "#1e293b" }}>
            <input
              type="checkbox"
              checked={simulateOptimalWeather}
              onChange={(e) => setSimulateOptimalWeather(e.target.checked)}
              style={{ cursor: "pointer", width: "16px", height: "16px" }}
            />
            <span>Evaluate Scheduled Tomorrow Window</span>
          </label>
        </div>

        <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
          <button
            onClick={handleRunWorkflow}
            disabled={loading}
            style={{
              background: "#059669",
              color: "white",
              padding: "0.6rem 1.5rem",
              borderRadius: "6px",
              border: "none",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              fontSize: "0.95rem"
            }}
          >
            {loading ? "⚡ Orchestrating 4 Agents..." : "🚀 Execute 4-Agent Coordinated Pipeline"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #ef4444", padding: "1rem", borderRadius: "6px", color: "#991b1b", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* WORKFLOW EXECUTION PROGRESSION */}
      {workflowRecord && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* STATUS HEADER */}
          <div style={{
            background: workflowRecord.status === "COMPLETED_APPROVED" ? "#f0fdf4" : workflowRecord.status === "SAFE_FAILURE_REJECTED" ? "#fef2f2" : "#f0f9ff",
            border: `1px solid ${workflowRecord.status === "COMPLETED_APPROVED" ? "#86efac" : workflowRecord.status === "SAFE_FAILURE_REJECTED" ? "#fca5a5" : "#7dd3fc"}`,
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  Workflow ID: {workflowRecord.workflowId}
                </span>
                <span style={{
                  padding: "0.25rem 0.6rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: workflowRecord.status === "COMPLETED_APPROVED" ? "#16a34a" : workflowRecord.status === "SAFE_FAILURE_REJECTED" ? "#dc2626" : "#0284c7",
                  color: "white"
                }}>
                  {workflowRecord.status}
                </span>
              </div>
              <p style={{ margin: "0.25rem 0 0 0", color: "#334155", fontSize: "0.9rem" }}>
                {workflowRecord.finalOutcome}
              </p>
            </div>

            {workflowRecord.requiresHumanApproval && (
              <span style={{ background: "#f59e0b", color: "#78350f", padding: "0.4rem 0.8rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem", animation: "pulse 2s infinite" }}>
                ⏸️ Paused at Human Approval Gate
              </span>
            )}
          </div>

          {/* 7-STEP DETAILED EXECUTION TRACE */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", color: "#0f172a", fontSize: "1.1rem" }}>
              📋 Multi-Agent Execution Trajectory & Audit Trace
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {workflowRecord.executionTrace.map((step) => (
                <div
                  key={step.stepNumber}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderLeft: `5px solid ${step.status === "COMPLETED" ? "#10b981" : step.status === "PAUSED" ? "#f59e0b" : "#ef4444"}`,
                    borderRadius: "6px",
                    padding: "1rem",
                    background: "#f8fafc"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.95rem" }}>
                        Step {step.stepNumber}: {step.action}
                      </span>
                      <span style={{ background: "#e2e8f0", color: "#334155", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {step.agentName}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: step.status === "COMPLETED" ? "#059669" : step.status === "PAUSED" ? "#d97706" : "#dc2626"
                    }}>
                      [{step.status}] {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#475569" }}>
                    {step.detail}
                  </p>

                  {step.structuredOutput && (
                    <pre style={{
                      margin: 0,
                      background: "#1e293b",
                      color: "#94a3b8",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      overflowX: "auto"
                    }}>
                      {JSON.stringify(step.structuredOutput, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* HUMAN APPROVAL GATE INTERFACE */}
          {workflowRecord.requiresHumanApproval && (
            <div style={{
              background: "#fffbeb",
              border: "2px solid #f59e0b",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(245, 158, 11, 0.15)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🛡️</span>
                <h3 style={{ margin: 0, color: "#92400e" }}>
                  Human Approval Gate: Farm Manager Authorization Required
                </h3>
              </div>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "#78350f" }}>
                High-impact agricultural actions (chemical pesticide spraying) cannot execute autonomously. Agent 4 has verified all 7 deterministic safety criteria and live Open-Meteo weather parameters. An authorized Farm Manager must confirm execution.
              </p>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#92400e", marginBottom: "0.25rem" }}>
                  Manager Review Notes / Directives (Recorded permanently in PostgreSQL Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chemical dosage and sprayer equipment verified. Approved for tomorrow morning shift."
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #fcd34d" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleResumeDecision("reject")}
                  disabled={resumeLoading}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "6px",
                    border: "none",
                    fontWeight: 700,
                    cursor: resumeLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {resumeLoading ? "Processing..." : "❌ Deny Proposal (Safe Failure)"}
                </button>
                <button
                  onClick={() => handleResumeDecision("approve")}
                  disabled={resumeLoading}
                  style={{
                    background: "#16a34a",
                    color: "white",
                    padding: "0.5rem 1.5rem",
                    borderRadius: "6px",
                    border: "none",
                    fontWeight: 700,
                    cursor: resumeLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {resumeLoading ? "Dispatching..." : "✅ Authorize & Dispatch to PostgreSQL"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

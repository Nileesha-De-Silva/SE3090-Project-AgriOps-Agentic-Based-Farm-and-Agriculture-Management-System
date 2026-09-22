import { useState, useEffect } from "react";
import { getFields, getCropSeasons } from "../api/component1Api";
import { generatePlan } from "../api/agentApi";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import "./AgentPlannerPage.css";

export default function AgentPlannerPage() {
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [cropSeasons, setCropSeasons] = useState([]);
  const [cropSeasonsLoading, setCropSeasonsLoading] = useState(false);
  const [selectedCropSeasonId, setSelectedCropSeasonId] = useState("");

  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    if (!selectedFieldId) {
      setCropSeasons([]);
      setSelectedCropSeasonId("");
      return;
    }
    loadCropSeasons(selectedFieldId);
  }, [selectedFieldId]);

  async function loadFields() {
    try {
      setFieldsLoading(true);
      const data = await getFields();
      setFields(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setFieldsLoading(false);
    }
  }

  async function loadCropSeasons(fieldId) {
    try {
      setCropSeasonsLoading(true);
      setSelectedCropSeasonId("");
      const data = await getCropSeasons(fieldId);
      setCropSeasons(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCropSeasonsLoading(false);
    }
  }

  async function handleGeneratePlan(e) {
    e.preventDefault();
    setGenerating(true);
    setPlan(null);
    setShowTrace(false);
    try {
      const result = await generatePlan(selectedFieldId, selectedCropSeasonId);
      setPlan(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate = Boolean(selectedFieldId) && Boolean(selectedCropSeasonId) && !generating;

  return (
    <div className="agent-planner-page">
      <h1>Agent Planner</h1>
      <p className="agent-planner-intro">
        Select a field and crop season, then let the agent generate a recommended plan.
      </p>

      {error && (
        <div className="agent-planner-error">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <Card className="planner-form-card">
        <form onSubmit={handleGeneratePlan} className="planner-form">
          <div className="planner-form-field">
            <label htmlFor="planner-field">Field</label>
            <select
              id="planner-field"
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              disabled={fieldsLoading}
              required
            >
              <option value="">
                {fieldsLoading ? "Loading fields..." : "Select a field..."}
              </option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </div>

          <div className="planner-form-field">
            <label htmlFor="planner-crop-season">Crop Season</label>
            <select
              id="planner-crop-season"
              value={selectedCropSeasonId}
              onChange={(e) => setSelectedCropSeasonId(e.target.value)}
              disabled={!selectedFieldId || cropSeasonsLoading}
              required
            >
              <option value="">
                {!selectedFieldId
                  ? "Select a field first..."
                  : cropSeasonsLoading
                  ? "Loading crop seasons..."
                  : "Select a crop season..."}
              </option>
              {cropSeasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.seasonName}
                </option>
              ))}
            </select>
          </div>

          <div className="planner-form-actions">
            <Button type="submit" disabled={!canGenerate}>
              {generating ? "Generating..." : "Generate Plan"}
            </Button>
          </div>
        </form>
      </Card>

      {generating && (
        <Card className="planner-loading-card">
          <LoadingSpinner label="Agent is analyzing field data..." />
        </Card>
      )}

      {plan && !generating && (
        <>
          <Card className="plan-result-card">
            <div className="plan-result-header">
              <h2>Recommended Plan</h2>
              <div className="plan-result-badges">
                {plan.recommendedSchedule?.basedOnGrowthStage && (
                  <Badge variant="info">
                    {plan.recommendedSchedule.basedOnGrowthStage}
                  </Badge>
                )}
                {plan.approvalRequired && (
                  <Badge variant="warning">Pending Manager Approval</Badge>
                )}
              </div>
            </div>

            {plan.recommendedSchedule?.tasks && plan.recommendedSchedule.tasks.length > 0 ? (
              <ul className="plan-tasks-list">
                {plan.recommendedSchedule.tasks.map((task, index) => (
                  <li key={index} className="plan-task-item">
                    <span>{task.replace(/^\*\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="plan-empty-tasks">The agent did not recommend any tasks.</p>
            )}
          </Card>

          {plan.trace && plan.trace.length > 0 && (
            <div className="agent-trace-section">
              <button
                type="button"
                className="agent-trace-toggle"
                onClick={() => setShowTrace(!showTrace)}
                aria-expanded={showTrace}
              >
                <span
                  className={`agent-trace-caret${showTrace ? " agent-trace-caret-open" : ""}`}
                  aria-hidden="true"
                >
                  ▸
                </span>
                {showTrace ? "Hide Agent Trace" : "View Agent Trace"}
              </button>

              {showTrace && (
                <Card className="agent-trace-card">
                  <ul className="agent-trace-list">
                    {plan.trace.map((entry, index) => (
                      <li key={index} className="agent-trace-item">
                        <span className="agent-trace-timestamp">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span className="agent-trace-step">{entry.message}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
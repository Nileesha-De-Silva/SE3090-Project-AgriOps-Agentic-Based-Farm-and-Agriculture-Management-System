from typing import Any, Literal, TypedDict
from pydantic import BaseModel, Field
from uuid import UUID


class AnalyzeRequest(BaseModel):
    field_id: UUID | None = Field(default=None, description="Optional target field UUID to focus analysis on.")
    crop_name: str | None = Field(default=None, description="Optional crop name filter.")
    sensitivity_threshold: float = Field(default=0.20, ge=0.05, le=0.50, description="Variance drop threshold (0.05 - 0.50).")
    audit_lookback_count: int = Field(default=50, ge=10, le=200, description="Number of audit records to inspect.")


class ApprovalDecisionRequest(BaseModel):
    action: Literal["approve", "reject"] = Field(description="Manager decision: 'approve' or 'reject'.")
    manager_notes: str | None = Field(default=None, max_length=500, description="Audit remarks or reason.")


class AnomalyFinding(BaseModel):
    anomaly_type: str = Field(description="Category of the detected issue.")
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(description="Anomaly severity.")
    metric: str = Field(description="Name of the metric evaluated.")
    observed_value: float = Field(description="Observed measurement.")
    expected_value: float = Field(description="Benchmark or expected baseline.")
    variance_percent: float = Field(description="Percentage variance from baseline.")
    description: str = Field(description="Human-readable explanation.")


class RemediationPlan(BaseModel):
    proposed_task_type: str = Field(description="Task type recommended (e.g., SoilRecord, FieldInspection).")
    target_field_id: str | None = Field(default=None, description="Field UUID targeted for remediation.")
    priority: Literal["Low", "Medium", "High", "Critical"] = Field(default="Medium")
    action_summary: str = Field(description="Action summary for the proposed farm task.")
    justification: str = Field(description="Deterministic and agronomic justification.")
    estimated_impact: str = Field(description="Expected impact on yield recovery or operational security.")


class SentinelRunResponse(BaseModel):
    run_id: str
    status: str
    yield_performance_score: float
    overall_risk_level: str
    anomalies: list[AnomalyFinding] = Field(default_factory=list)
    remediation: RemediationPlan | None = None
    strategic_commentary: str = ""
    requires_human_approval: bool = False
    trace: list[dict[str, Any]] = Field(default_factory=list)
    error: str | None = None


class SentinelState(TypedDict, total=False):
    run_id: str
    owner_id: str
    field_id: str | None
    crop_name: str | None
    sensitivity_threshold: float
    audit_lookback_count: int
    harvest_records: list[dict[str, Any]]
    audit_records: list[dict[str, Any]]
    yield_variance: float
    yield_performance_score: float
    anomalies: list[dict[str, Any]]
    overall_risk_level: str
    remediation: dict[str, Any] | None
    strategic_commentary: str
    requires_human_approval: bool
    approval_status: str  # "not_required" | "pending_approval" | "approved" | "rejected"
    manager_decision: dict[str, Any] | None
    final_outcome: str | None
    status: str  # "completed" | "awaiting_approval" | "failed"
    trace: list[dict[str, Any]]
    error: str | None

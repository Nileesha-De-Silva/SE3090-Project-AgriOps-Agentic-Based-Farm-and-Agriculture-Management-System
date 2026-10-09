"""
AI Contracts and Request/Response Schemas for AgriOps Agent 4 (Validation & Safety Agent - Sahas).
Follows Pydantic v2 models and contracts matching the 3-labsheet architecture.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class ValidationAskRequest(BaseModel):
    """Input payload to trigger Agent 4 deterministic validation workflow."""
    proposal_id: str = Field(default="PROP-001", description="Unique identifier of proposal")
    generating_agent: str = Field(default="Agent1_FarmPlanner", description="Generating agent ID")
    target_field_id: str = Field(default="00000000-0000-0000-0000-000000000000", description="Target field ID")
    crop_variety: str = Field(default="Tomato", description="Crop variety active in target field")
    growth_stage: str = Field(default="Vegetative", description="Crop growth stage")
    proposed_action: str = Field(default="Fertilization", description="Proposed operational action")
    input_item_name: str = Field(default="NPK 20-20-20", description="Proposed input or chemical")
    proposed_quantity: float = Field(default=120.0, description="Proposed quantity")
    unit_of_measurement: str = Field(default="kg/ha", description="Unit of measurement")
    thread_id: Optional[str] = Field(default="val-thread-demo", description="Thread ID for LangGraph checkpointer")
    workflow_id: Optional[str] = Field(default=None, description="Alias for thread_id")

    def get_thread_id(self) -> str:
        return self.workflow_id or self.thread_id or "val-thread-demo"


class ValidationResumeRequest(BaseModel):
    """Payload to resume a paused Agent 4 workflow (Human-in-the-Loop approval gate)."""
    thread_id: str = Field(..., description="Thread ID of the paused execution")
    decision: Literal["approve", "deny"] = Field(..., description="Human manager's decision: 'approve' or 'deny'")
    manager_user_id: str = Field(default="manager-01", description="User ID of approving farm manager")
    comments: Optional[str] = Field(default=None, description="Optional manager remarks")


class DeterministicCheck(BaseModel):
    """Individual rule verification item within the 6-step checklist."""
    check: str
    passed: bool
    message: str
    rule: str


class SafetyGrade(BaseModel):
    """Pydantic structured output model for safety compliance grading."""
    is_compliant: bool = Field(..., description="True if all deterministic rules passed")
    deciding_reason: str = Field(..., description="Deciding factor or failure description")


class ValidationGraphResponse(BaseModel):
    """Standardized response returned by Agent 4 LangGraph service."""
    status: Literal["completed", "awaiting_approval", "revision_requested"]
    decision: Literal["VALID", "INVALID", "REVISION_REQUESTED", "APPROVED", "REJECTED"]
    is_valid: bool
    proposal_id: str
    generating_agent: str
    checks: List[DeterministicCheck]
    failure_reasons: List[str]
    revision_guidance: Optional[str]
    weather_snapshot: Dict[str, Any]
    final_answer: str
    thread_id: str
    trace: List[Dict[str, Any]]
    total_tokens: int

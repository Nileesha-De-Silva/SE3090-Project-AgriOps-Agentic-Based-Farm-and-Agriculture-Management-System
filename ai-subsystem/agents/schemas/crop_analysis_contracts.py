"""
AI Contracts and Request/Response Schemas for AgriOps Agent 2.
Data models and contracts for diagnostic analysis and manager approval workflow.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# API Request Models
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    """Input payload to trigger Agent 2 diagnostic workflow."""
    field_id: str = Field(..., description="ID of the field being inspected")
    crop_variety: str = Field(..., description="Crop name, e.g. Tomato, Paddy")
    growth_stage: str = Field(default="Vegetative", description="Growth stage, e.g. Seedling, Vegetative, Flowering")
    observation: str = Field(..., description="Observed symptom notes on leaves, soil, or equipment")
    image_url: Optional[str] = Field(default="", description="URL to photo evidence")
    thread_id: str = Field(default="demo", description="Thread ID for stateful checkpointer memory")
    submitted_by_user_id: str = Field(default="worker-01", description="User ID submitting observation")
    max_iterations: int = Field(5, ge=1, le=10, description="Iteration cap enforced at API edge")


class ResumeRequest(BaseModel):
    """Payload to resume a paused workflow (Human-in-the-Loop decision)."""
    thread_id: str = Field(..., description="Thread ID of the paused execution")
    decision: Literal["approve", "deny"] = Field(..., description="Human manager's decision: 'approve' or 'deny'")
    manager_user_id: str = Field(default="manager-01", description="User ID of approving farm manager")
    comments: Optional[str] = Field(default=None, description="Optional manager remarks")


# ---------------------------------------------------------------------------
# API Response Models
# ---------------------------------------------------------------------------

class Step(BaseModel):
    """Record of an individual tool call execution step."""
    step: int
    tool: str
    args: Dict[str, Any]
    result: str


class GraphResponse(BaseModel):
    """Machine-readable response returned by Agent 2 FastAPI service.
    status is the field a caller branches on: render an answer, or render an approval screen.
    """
    status: Literal["completed", "awaiting_approval"]
    answer: Optional[str] = None
    interrupt: Optional[Dict[str, Any]] = None
    nodes: List[str] = Field(default_factory=list, description="Nodes that ran, in order (the trajectory).")
    thread_id: str
    total_tokens: int = 0
    messages: int = 0
    seconds: float = 0.0


# ---------------------------------------------------------------------------
# Structured Output Models for Diagnostic Evaluation
# ---------------------------------------------------------------------------

class DiagnosisGrade(BaseModel):
    """Model used by the self-correcting grader node to judge diagnostic sufficiency."""
    is_confident: bool = Field(
        ...,
        description="True only if the retrieved handbook documents contain enough specific information to diagnose the crop. False if a query rewrite is needed."
    )
    deciding_passage: str = Field(
        default="",
        description="The exact passage from the handbook that justifies the grade."
    )


class StructuredDiagnosis(BaseModel):
    """Model used to extract typed diagnosis and task recommendation from the model."""
    primary_indicator: str = Field(..., description="Main diagnosed issue or pest/disease identity")
    category: str = Field(..., description="Pest, Disease, NutrientDeficiency, WaterStress, Environmental")
    risk_level: Literal["Low", "Medium", "High", "Critical"] = Field(..., description="Assessed risk level")
    suggested_task_type: Literal[
        "Watering", "Fertilization", "Weeding", "PestInspection",
        "CropMonitoring", "Harvesting", "EquipmentMaintenance"
    ] = Field(..., description="Standardized C# backend task type")
    priority: Literal["Low", "Medium", "High", "Critical"] = Field(..., description="Task priority")
    recommended_protocol: str = Field(..., description="Clear actionable treatment instructions")
    confidence_score: float = Field(default=0.90, ge=0.0, le=1.0)

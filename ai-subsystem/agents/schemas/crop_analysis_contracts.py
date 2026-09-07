from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field


def _get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CropSymptomInput(BaseModel):
    field_id: str = Field(description="ID of the field being inspected")
    crop_variety: str = Field(description="Type of crop, e.g., Tomato, Paddy, Maize, Tea")
    growth_stage: str = Field(default="Vegetative", description="Growth stage")
    symptom_description: str = Field(description="Text description of observed symptoms")
    image_url: Optional[str] = Field(default="", description="URL of photo evidence")
    submitted_by_user_id: str = Field(description="User ID of inspector")


class StressFactor(BaseModel):
    factor_name: str
    category: str
    confidence: float


class ActionRecommendation(BaseModel):
    action_type: str
    suggested_task_type: str
    priority: str
    notes: str
    urgency_hours: int = 24


class CropAnalysisReport(BaseModel):
    field_id: str
    crop_variety: str
    growth_stage: str
    primary_indicator: str
    risk_level: str
    suggested_task_type: str
    priority: str
    submitted_by_user_id: str
    reasoning_summary: str
    assessment_id: str = Field(default_factory=lambda: str(uuid4()))
    workflow_id: str = Field(default_factory=lambda: str(uuid4()))
    stress_factors: List[StressFactor] = Field(default_factory=list)
    recommended_actions: List[ActionRecommendation] = Field(default_factory=list)
    status: str = Field(default="PendingApproval")
    created_at: str = Field(default_factory=_get_utc_now_iso)

"""
Agent 2: AI-powered Crop Diagnostic and Action Recommendation Agent.
Uses LangGraph state machine execution workflow.
"""

import sys
import os
from typing import Dict, TypedDict, Any
from uuid import uuid4

# Ensure agents package path is resolvable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.schemas.crop_analysis_contracts import (
    CropSymptomInput,
    CropAnalysisReport,
    StressFactor,
    ActionRecommendation
)
from agents.tools.symptom_mapping_tool import map_symptoms_to_diagnosis
from agents.prompts.crop_analysis_prompts import CROP_DIAGNOSTIC_SYSTEM_PROMPT


class CropAnalysisState(TypedDict, total=False):
    """LangGraph execution state for crop analysis workflow."""
    input_data: CropSymptomInput
    primary_indicator: str
    risk_level: str
    stress_factors: list
    recommended_actions: list
    suggested_task_type: str
    priority: str
    reasoning_summary: str
    final_report: CropAnalysisReport


def parse_and_validate_node(state: CropAnalysisState) -> CropAnalysisState:
    """Step 1: Validate input fields and log initial observation."""
    inp = state["input_data"]
    summary = f"Parsed crop observation for {inp.crop_variety} (Stage: {inp.growth_stage}) on Field '{inp.field_id}'."
    return {"reasoning_summary": summary}


def diagnose_symptoms_node(state: CropAnalysisState) -> CropAnalysisState:
    """Step 2: Map observation text to stress factors and indicators."""
    inp = state["input_data"]
    indicator, risk, factors, actions, task_type, priority = map_symptoms_to_diagnosis(inp.symptom_description)
    
    summary = state.get("reasoning_summary", "") + f" Diagnosed primary indicator: '{indicator}' with risk '{risk}'."
    return {
        "primary_indicator": indicator,
        "risk_level": risk,
        "stress_factors": factors,
        "recommended_actions": actions,
        "suggested_task_type": task_type,
        "priority": priority,
        "reasoning_summary": summary
    }


def generate_report_node(state: CropAnalysisState) -> CropAnalysisState:
    """Step 3: Assemble structured output CropAnalysisReport."""
    inp = state["input_data"]
    workflow_id = str(uuid4())
    assessment_id = str(uuid4())

    report = CropAnalysisReport(
        assessment_id=assessment_id,
        workflow_id=workflow_id,
        field_id=inp.field_id,
        crop_variety=inp.crop_variety,
        growth_stage=inp.growth_stage,
        primary_indicator=state["primary_indicator"],
        risk_level=state["risk_level"],
        stress_factors=state["stress_factors"],
        recommended_actions=state["recommended_actions"],
        suggested_task_type=state["suggested_task_type"],
        priority=state["priority"],
        status="PendingApproval",
        submitted_by_user_id=inp.submitted_by_user_id,
        reasoning_summary=state["reasoning_summary"]
    )

    return {"final_report": report}


class CropAnalysisGraphRunner:
    """Runner wrapping the state workflow for Agent 2."""

    def __init__(self):
        try:
            from langgraph.graph import StateGraph, END
            workflow = StateGraph(CropAnalysisState)

            workflow.add_node("parse_input", parse_and_validate_node)
            workflow.add_node("diagnose", diagnose_symptoms_node)
            workflow.add_node("generate_report", generate_report_node)

            workflow.set_entry_point("parse_input")
            workflow.add_edge("parse_input", "diagnose")
            workflow.add_edge("diagnose", "generate_report")
            workflow.add_edge("generate_report", END)

            self.app = workflow.compile()
            self._use_langgraph = True
        except ImportError:
            # Fallback linear workflow if langgraph package is not installed in current environment
            self._use_langgraph = False

    def run(self, input_data: CropSymptomInput) -> CropAnalysisReport:
        if self._use_langgraph:
            initial_state: CropAnalysisState = {"input_data": input_data}
            result_state = self.app.invoke(initial_state)
            return result_state["final_report"]
        else:
            # Fallback linear execution
            state: CropAnalysisState = {"input_data": input_data}
            state.update(parse_and_validate_node(state))
            state.update(diagnose_symptoms_node(state))
            state.update(generate_report_node(state))
            return state["final_report"]


def run_crop_analysis_agent(input_data: CropSymptomInput) -> CropAnalysisReport:
    """Entrypoint function to execute Agent 2 crop diagnostic analysis."""
    runner = CropAnalysisGraphRunner()
    return runner.run(input_data)

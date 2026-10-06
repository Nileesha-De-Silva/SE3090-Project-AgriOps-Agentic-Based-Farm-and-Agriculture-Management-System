"""LangGraph execution nodes for Agent 4 (Analytics Sentinel Agent)."""

from datetime import datetime, timezone
from typing import Any
from langgraph.types import interrupt

from app.backend_client import BackendClient
from app.config import Settings
from app.state import SentinelState
from app import tools


def create_event(state: SentinelState, step: str, outcome: str, **details) -> list[dict[str, Any]]:
    return [
        *state.get("trace", []),
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "step": step,
            "outcome": outcome,
            **details,
        },
    ]


class SentinelNodes:
    def __init__(self, settings: Settings, backend: BackendClient, model: Any = None):
        self.settings = settings
        self.backend = backend
        self.model = model

    def fetch_data(self, state: SentinelState) -> dict[str, Any]:
        """Allowlisted tool node: queries harvest and audit records from backend."""
        harvest_records = self.backend.fetch_harvest_yields()
        audit_records = self.backend.fetch_audit_logs(take=state.get("audit_lookback_count", 50))

        return {
            "harvest_records": harvest_records,
            "audit_records": audit_records,
            "trace": create_event(
                state,
                "fetch_data",
                "ok",
                harvest_count=len(harvest_records),
                audit_count=len(audit_records),
            ),
        }

    def analyze_metrics(self, state: SentinelState) -> dict[str, Any]:
        """Deterministic tool node: calculates variance, audit risks, and remediation."""
        score, variance, yield_anomalies = tools.calculate_yield_metrics(
            state.get("harvest_records", []),
            field_id=state.get("field_id"),
            crop_name=state.get("crop_name"),
            sensitivity_threshold=state.get("sensitivity_threshold", 0.20),
        )

        audit_anomalies = tools.detect_audit_anomalies(state.get("audit_records", []))
        all_anomalies = yield_anomalies + audit_anomalies
        risk_level = tools.evaluate_operational_risk(yield_anomalies, audit_anomalies)

        remediation = tools.formulate_remediation_plan(
            risk_level,
            yield_anomalies,
            audit_anomalies,
            target_field_id=state.get("field_id"),
        )

        # High or Critical risks with active remediations MUST go through human approval
        requires_approval = bool(remediation and risk_level in {"HIGH", "CRITICAL"})
        approval_status = "pending_approval" if requires_approval else "not_required"

        return {
            "yield_performance_score": score,
            "yield_variance": variance,
            "anomalies": all_anomalies,
            "overall_risk_level": risk_level,
            "remediation": remediation,
            "requires_human_approval": requires_approval,
            "approval_status": approval_status,
            "status": "awaiting_approval" if requires_approval else "analyzed",
            "trace": create_event(
                state,
                "analyze_metrics",
                "ok",
                risk_level=risk_level,
                score=score,
                anomalies_detected=len(all_anomalies),
                requires_approval=requires_approval,
            ),
        }

    def generate_strategic_insight(self, state: SentinelState) -> dict[str, Any]:
        """Generates strategic commentary using Gemini or deterministic agronomic fallback."""
        score = state.get("yield_performance_score", 75.0)
        risk = state.get("overall_risk_level", "LOW")
        variance = state.get("yield_variance", 0.0)
        anomalies = state.get("anomalies", [])

        # Deterministic foundation
        commentary = (
            f"Sentinel Evaluation Summary: Farm operational risk rating is {risk} "
            f"with a composite yield performance score of {score}/100. "
            f"Observed seasonal variance stands at {variance:+.1f}%. "
            f"{len(anomalies)} operational or yield anomalies detected."
        )

        if self.model and self.settings.has_llm_key:
            try:
                prompt = (
                    f"You are the AgriOps AI Sentinel Agent. Summarize the following findings in 2 concise sentences:\n"
                    f"- Risk Level: {risk}\n"
                    f"- Yield Performance Score: {score}/100\n"
                    f"- Seasonal Yield Variance: {variance}%\n"
                    f"- Detected Anomalies: {[a.get('description') for a in anomalies]}\n"
                    f"Provide an actionable, professional management assessment."
                )
                response = self.model.invoke(prompt)
                content = getattr(response, "content", None) or str(response)
                if content and len(content.strip()) > 10:
                    commentary = content.strip()
            except Exception:
                # Safe failure mode: keep deterministic commentary
                pass

        return {
            "strategic_commentary": commentary,
            "trace": create_event(state, "generate_strategic_insight", "ok"),
        }

    def human_approval_gate(self, state: SentinelState) -> dict[str, Any]:
        """Pauses execution via LangGraph interrupt when high-impact remediation is flagged."""
        if state.get("requires_human_approval") and state.get("approval_status") == "pending_approval":
            decision = interrupt({
                "message": "High-impact remediation proposed. Awaiting manager approval.",
                "run_id": state.get("run_id"),
                "risk_level": state.get("overall_risk_level"),
                "remediation": state.get("remediation"),
            })
            return {"manager_decision": decision, "status": "decision_received"}
        return {"status": "decision_ready"}

    def apply_intervention(self, state: SentinelState) -> dict[str, Any]:
        """Resumes after manager decision and applies the corrective action if approved."""
        decision = state.get("manager_decision") or {}
        action = decision.get("action", "approve")

        if action == "approve":
            remediation = state.get("remediation")
            outcome = "Remediation approved by manager."
            if remediation and state.get("field_id"):
                task_payload = {
                    "fieldId": state["field_id"],
                    "taskType": remediation.get("proposed_task_type", "RoutineInspection"),
                    "priority": remediation.get("priority", "High"),
                    "description": f"[Sentinel Intervention] {remediation.get('action_summary')}. Note: {decision.get('manager_notes') or 'Approved via Sentinel'}",
                }
                self.backend.create_farm_task(task_payload)
                outcome += " Corrective task scheduled in backend."
            return {
                "approval_status": "approved",
                "final_outcome": outcome,
                "status": "completed",
                "trace": create_event(state, "apply_intervention", "approved", detail=outcome),
            }
        else:
            return {
                "approval_status": "rejected",
                "final_outcome": f"Remediation rejected by manager. Reason: {decision.get('manager_notes') or 'Declined by authorized manager.'}",
                "status": "completed",
                "trace": create_event(state, "apply_intervention", "rejected", detail="Declined by authorized manager."),
            }

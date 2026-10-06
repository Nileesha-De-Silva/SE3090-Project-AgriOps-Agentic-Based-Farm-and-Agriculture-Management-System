"""Allowlisted deterministic tools for Agent 4: Production Analytics & Operations Sentinel."""

from typing import Any


def calculate_yield_metrics(
    harvest_records: list[dict[str, Any]],
    field_id: str | None = None,
    crop_name: str | None = None,
    sensitivity_threshold: float = 0.20,
) -> tuple[float, float, list[dict[str, Any]]]:
    """
    Computes yield performance score, percentage variance, and anomaly findings.
    Guaranteed deterministic math without LLM hallucination.
    """
    filtered = harvest_records
    if field_id:
        filtered = [h for h in filtered if str(h.get("fieldId", "")).lower() == str(field_id).lower()]
    if crop_name:
        filtered = [h for h in filtered if str(h.get("cropName", "")).lower() == str(crop_name).lower()]

    anomalies: list[dict[str, Any]] = []

    if not filtered:
        # No historical records for this specific target
        return 75.0, 0.0, [{
            "anomaly_type": "DATA_SPARSE_WARNING",
            "severity": "LOW",
            "metric": "YieldHistoryCount",
            "observed_value": 0.0,
            "expected_value": 3.0,
            "variance_percent": 0.0,
            "description": "Insufficient historical harvest data for targeted field/crop. Using baseline expectation."
        }]

    # Sort by start date if available
    yield_amounts = [float(h.get("totalYieldAmount", 0.0) or h.get("yieldAmount", 0.0)) for h in filtered]
    
    if len(yield_amounts) == 1:
        # Only single record
        single_yield = yield_amounts[0]
        score = 80.0 if single_yield > 0 else 50.0
        return score, 0.0, []

    # Historical baseline is the mean of previous records, compared against latest season
    baseline_mean = sum(yield_amounts[:-1]) / len(yield_amounts[:-1])
    latest_yield = yield_amounts[-1]

    if baseline_mean > 0:
        variance_percent = (latest_yield - baseline_mean) / baseline_mean
    else:
        variance_percent = 0.0

    # Score bounded 0.0 to 100.0
    # 1.0 (no variance) -> 80.0 score. +20% -> 95.0. -30% -> 50.0.
    raw_score = 80.0 + (variance_percent * 60.0)
    performance_score = max(5.0, min(100.0, round(raw_score, 1)))

    # Flag negative variance exceeding sensitivity threshold
    if variance_percent < -sensitivity_threshold:
        severity = "CRITICAL" if variance_percent < -0.35 else "HIGH"
        anomalies.append({
            "anomaly_type": "YIELD_DEFICIT",
            "severity": severity,
            "metric": "SeasonalYieldKg",
            "observed_value": round(latest_yield, 2),
            "expected_value": round(baseline_mean, 2),
            "variance_percent": round(variance_percent * 100, 2),
            "description": f"Significant yield reduction of {abs(round(variance_percent * 100, 1))}% detected compared to historical seasonal baseline ({baseline_mean:.1f} kg)."
        })

    return performance_score, round(variance_percent * 100, 2), anomalies


def detect_audit_anomalies(audit_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Evaluates system audit logs for operational and governance anomalies.
    """
    anomalies: list[dict[str, Any]] = []
    if not audit_records:
        return anomalies

    # Count actions
    action_counts: dict[str, int] = {}
    for log in audit_records:
        action = str(log.get("actionType") or log.get("action") or "Unknown")
        action_counts[action] = action_counts.get(action, 0) + 1

    # Check for excessive role or security modifications
    privilege_actions = action_counts.get("RoleAssignment", 0) + action_counts.get("UserRoleUpdated", 0)
    if privilege_actions > 5:
        anomalies.append({
            "anomaly_type": "PRIVILEGE_MODIFICATION_SPIKE",
            "severity": "HIGH",
            "metric": "PrivilegedRoleModifications",
            "observed_value": float(privilege_actions),
            "expected_value": 2.0,
            "variance_percent": 150.0,
            "description": f"Unusual burst of role assignments or privilege adjustments detected ({privilege_actions} events)."
        })

    # Check for deletion surges
    deletions = action_counts.get("Delete", 0) + action_counts.get("FieldDeleted", 0) + action_counts.get("TaskCancelled", 0)
    if deletions > 8:
        anomalies.append({
            "anomaly_type": "EXCESSIVE_RESOURCE_REMOVAL",
            "severity": "HIGH",
            "metric": "ResourceDeletionCount",
            "observed_value": float(deletions),
            "expected_value": 3.0,
            "variance_percent": 166.0,
            "description": f"Elevated volume of deletions or task cancellations detected ({deletions} operations)."
        })

    return anomalies


def evaluate_operational_risk(
    yield_anomalies: list[dict[str, Any]],
    audit_anomalies: list[dict[str, Any]],
) -> str:
    """
    Applies deterministic business rules to establish the overall operational risk level.
    """
    all_severities = [a.get("severity") for a in yield_anomalies + audit_anomalies]
    if "CRITICAL" in all_severities:
        return "CRITICAL"
    if "HIGH" in all_severities:
        return "HIGH"
    if "MEDIUM" in all_severities:
        return "MEDIUM"
    return "LOW"


def formulate_remediation_plan(
    risk_level: str,
    yield_anomalies: list[dict[str, Any]],
    audit_anomalies: list[dict[str, Any]],
    target_field_id: str | None = None,
) -> dict[str, Any] | None:
    """
    Creates an actionable remediation proposal based on detected risks.
    """
    if risk_level == "LOW" and not yield_anomalies and not audit_anomalies:
        return None

    if yield_anomalies:
        first_yield_issue = yield_anomalies[0]
        variance = first_yield_issue.get("variance_percent", 0.0)
        return {
            "proposed_task_type": "SoilInspection",
            "target_field_id": target_field_id,
            "priority": "Critical" if risk_level == "CRITICAL" else "High",
            "action_summary": f"Emergency Soil Nutrient & Pest Audit for Field {target_field_id or 'Underperforming Zone'}",
            "justification": f"Deficit of {abs(variance):.1f}% requires immediate diagnostic soil sampling and root health assessment before next seasonal cycle.",
            "estimated_impact": "Prevents systemic soil depletion and restores anticipated yield baseline within 1 planting cycle."
        }
    
    if audit_anomalies:
        return {
            "proposed_task_type": "SecurityAudit",
            "target_field_id": target_field_id,
            "priority": "High",
            "action_summary": "Comprehensive Security & Access Policy Review",
            "justification": "Spike in privileged governance events demands mandatory administrative audit log verification.",
            "estimated_impact": "Enforces least-privilege role boundaries and protects system integrity."
        }

    return {
        "proposed_task_type": "RoutineInspection",
        "target_field_id": target_field_id,
        "priority": "Medium",
        "action_summary": "Preventative Farm Operations Audit",
        "justification": "Moderate performance variance detected across seasonal metrics.",
        "estimated_impact": "Maintains operational consistency."
    }

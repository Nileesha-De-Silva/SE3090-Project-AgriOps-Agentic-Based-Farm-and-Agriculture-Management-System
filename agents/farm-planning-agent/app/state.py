from typing import TypedDict, Optional


class PlanningState(TypedDict, total=False):
    # Inputs
    field_id: str
    crop_season_id: str

    # Gathered context (populated as the graph runs)
    field_data: dict
    crop_season_data: dict
    crop_data: dict
    soil_records: list
    weather_forecast: dict
    previous_activities: list
    resource_check: dict

    # Outputs
    required_tasks: list
    recommended_schedule: dict
    approval_required: bool

    # Trace, for auditability — mirrors the AgentExecution/ToolCall idea from the doc
    trace: list
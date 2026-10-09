"""
Multi-Agent Router and Intent Classifier for AgriOps AI (ADR-003 & PRD 1.1).
Enables deterministic Agent Selection Testing by classifying incoming user and field
worker requests across the 4 specialized domain agents:
  - Agent 1: Farm Planning Agent (Master orchestrator for multi-step operational planning)
  - Agent 2: Crop Analysis Agent (Multimodal visual and descriptive diagnostic support unit)
  - Agent 3: Weather & Resource Planning Agent (Dynamic meteorological tool integration)
  - Agent 4: Validation & Safety Agent (Deterministic compliance and rule-validation filter)
"""

from typing import Any, Dict, List, Literal, Union


AGENT_REGISTRY = {
    "Agent1_FarmPlanning": {
        "id": "agent-1",
        "name": "Farm Planning Agent",
        "component": "Component 1 / Shared Planning",
        "domain": "Operational scheduling, task allocation, seasonal planning, shift coordination",
        "keywords": [
            "schedule", "plan", "planning", "calendar", "timeline", "allocate",
            "worker assignment", "shift", "routine duties", "seasonal cycle"
        ],
    },
    "Agent2_CropAnalysis": {
        "id": "agent-2",
        "name": "Crop Analysis Agent",
        "component": "Component 2 (Nileesha De Silva)",
        "domain": "Plant health assessment, symptom mapping, leaf diagnostics, pest/disease stress, multimodal vision",
        "keywords": [
            "crop", "leaf", "leaves", "yellow", "chlorosis", "wilt", "wilting",
            "spots", "caterpillar", "pest", "symptom", "blight", "curling", "vein",
            "foliar", "necrosis", "stress", "plant health", "crop diagnostic", "inspection"
        ],
    },
    "Agent3_WeatherResource": {
        "id": "agent-3",
        "name": "Weather & Resource Planning Agent",
        "component": "Component 3 / Weather Integration",
        "domain": "Meteorological data, rain forecasts, weather-based task rescheduling, humidity",
        "keywords": [
            "weather", "rain", "rainfall", "forecast", "precipitation", "temperature",
            "humidity", "wind", "storm", "meteorological", "frost", "drought"
        ],
    },
    "Agent4_ValidationSafety": {
        "id": "agent-4",
        "name": "Validation & Safety Agent",
        "component": "Component 4 / Safety & Approvals",
        "domain": "Chemical safety verification, dosage bounds checking, regulatory compliance, rule-validation filter",
        "keywords": [
            "dosage limit", "chemical safety", "compliance", "toxicity check",
            "safety bounds", "rule check", "regulatory", "maximum allowable dose"
        ],
    },
}


def classify_agent_for_request(query_or_payload: Union[Dict[str, Any], str]) -> str:
    """
    Deterministically routes incoming requests to the appropriate agent.
    Returns the agent identifier, e.g. 'Agent2_CropAnalysis'.
    """
    if isinstance(query_or_payload, dict):
        # Explicit crop analysis payload structure (PRD Section 4)
        if any(k in query_or_payload for k in ("crop_variety", "observation", "observation_text", "image_url")):
            return "Agent2_CropAnalysis"
        text = str(query_or_payload.get("query", "")).lower()
    else:
        text = str(query_or_payload).lower()

    # Keyword match scoring across registered agents
    scores = {agent_key: 0 for agent_key in AGENT_REGISTRY}
    for agent_key, info in AGENT_REGISTRY.items():
        for kw in info["keywords"]:
            if kw in text:
                scores[agent_key] += 1

    best_match = max(scores, key=scores.get)
    if scores[best_match] > 0:
        return best_match

    # Default to Agent 2 for crop-focused requests in Component 2
    return "Agent2_CropAnalysis"


def get_agent_metadata(agent_name: str) -> Dict[str, Any]:
    """Returns registration metadata for a given agent."""
    return AGENT_REGISTRY.get(agent_name, {})

"""
Knowledge base and symptom mapping tool for crop diagnostics.
"""

from typing import Dict, List, Tuple
from agents.schemas.crop_analysis_contracts import StressFactor, ActionRecommendation


SYMPTOM_KNOWLEDGE_BASE: List[Dict] = [
    {
        "keywords": ["yellow", "pale", "chlorosis", "light green"],
        "primary_indicator": "Nutrient Deficiency (Nitrogen / Iron Chlorosis)",
        "risk_level": "Medium",
        "category": "NutrientDeficiency",
        "suggested_task_type": "Fertilization",
        "priority": "Medium",
        "action_notes": "Apply NPK 20-20-20 foliar fertilizer spray and test soil pH."
    },
    {
        "keywords": ["wilt", "dry", "drooping", "cracked soil", "parched"],
        "primary_indicator": "Water Stress / Irrigation Deficit",
        "risk_level": "High",
        "category": "WaterStress",
        "suggested_task_type": "Watering",
        "priority": "High",
        "action_notes": "Schedule immediate drip irrigation cycle (1500L/ha)."
    },
    {
        "keywords": ["spots", "fungus", "powder", "blight", "rust", "mold", "rot"],
        "primary_indicator": "Fungal Leaf Blight / Mold Infection",
        "risk_level": "High",
        "category": "Disease",
        "suggested_task_type": "PestInspection",
        "priority": "High",
        "action_notes": "Targeted organic fungicide spray application and pruning infected leaves."
    },
    {
        "keywords": ["holes", "bugs", "caterpillar", "aphid", "insects", "chewed", "larvae"],
        "primary_indicator": "Insect Pest Infestation",
        "risk_level": "Critical",
        "category": "Pest",
        "suggested_task_type": "PestInspection",
        "priority": "Critical",
        "action_notes": "Deploy targeted neem oil/insecticide spray and set pheromone traps."
    },
    {
        "keywords": ["clog", "pipe", "pump", "pressure low", "broken drip"],
        "primary_indicator": "Irrigation Equipment Fault",
        "risk_level": "Medium",
        "category": "Environmental",
        "suggested_task_type": "EquipmentMaintenance",
        "priority": "Medium",
        "action_notes": "Flush drip lines and inspect pressure control valves."
    }
]


def map_symptoms_to_diagnosis(symptom_text: str) -> Tuple[str, str, List[StressFactor], List[ActionRecommendation], str, str]:
    """
    Analyzes observation text using the agricultural symptom knowledge base.
    Returns: (primary_indicator, risk_level, stress_factors, recommended_actions, suggested_task_type, priority)
    """
    text_lower = symptom_text.lower()
    
    matched_entry = None
    for entry in SYMPTOM_KNOWLEDGE_BASE:
        if any(kw in text_lower for kw in entry["keywords"]):
            matched_entry = entry
            break

    if not matched_entry:
        # Default fallback for ambiguous observations
        matched_entry = {
            "primary_indicator": "General Crop Stress / Inspection Required",
            "risk_level": "Low",
            "category": "Environmental",
            "suggested_task_type": "CropMonitoring",
            "priority": "Low",
            "action_notes": "Perform detailed physical field walk and leaf tissue sampling."
        }

    stress_factor = StressFactor(
        factor_name=matched_entry["primary_indicator"],
        category=matched_entry["category"],
        confidence=0.88
    )

    action = ActionRecommendation(
        action_type=matched_entry["suggested_task_type"],
        suggested_task_type=matched_entry["suggested_task_type"],
        priority=matched_entry["priority"],
        urgency_hours=12 if matched_entry["priority"] == "Critical" else 48,
        notes=matched_entry["action_notes"]
    )

    return (
        matched_entry["primary_indicator"],
        matched_entry["risk_level"],
        [stress_factor],
        [action],
        matched_entry["suggested_task_type"],
        matched_entry["priority"]
    )

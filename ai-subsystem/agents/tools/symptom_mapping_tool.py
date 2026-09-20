"""
Agricultural Knowledge Base & Diagnostic Tools for AgriOps Agent 2.
Provides tool definitions with model-facing docstrings for ReAct execution.
"""

from typing import List
from langchain_core.tools import tool

# Agricultural Knowledge Base entries
AGRI_HANDBOOK = [
    {
        "crop": "Tomato",
        "keywords": ["yellow", "pale", "chlorosis"],
        "issue": "Nitrogen / Iron Chlorosis",
        "category": "NutrientDeficiency",
        "risk": "Medium",
        "recommended_task": "Fertilization",
        "treatment": "Apply NPK 20-20-20 foliar spray at 2.5 kg/ha. Test soil pH within 48 hours."
    },
    {
        "crop": "Tomato",
        "keywords": ["spots", "fungus", "blight", "mold", "rot", "brown"],
        "issue": "Early/Late Blight (Phytophthora infestans)",
        "category": "Disease",
        "risk": "High",
        "recommended_task": "PestInspection",
        "treatment": "Prune severely infected leaves immediately. Apply copper hydroxide fungicide at 2.0 kg/ha."
    },
    {
        "crop": "Tomato",
        "keywords": ["chewed", "holes", "bugs", "caterpillar", "worm", "aphid", "insects"],
        "issue": "Tomato Fruitworm / Aphid Infestation",
        "category": "Pest",
        "risk": "Critical",
        "recommended_task": "PestInspection",
        "treatment": "Urgent pest inspection and application of neem extract or biological Bacillus thuringiensis spray. Deploy pheromone traps."
    },
    {
        "crop": "Tomato",
        "keywords": ["wilt", "dry", "droop", "parched"],
        "issue": "Severe Moisture Stress / Irrigation Deficit",
        "category": "WaterStress",
        "risk": "High",
        "recommended_task": "Watering",
        "treatment": "Run emergency drip irrigation cycle for 45 minutes (approx. 1800 L/ha). Check soil moisture sensor calibration."
    },
    {
        "crop": "General",
        "keywords": ["clog", "pipe", "pump", "drip", "pressure", "leak"],
        "issue": "Irrigation Line Failure / Pressure Drop",
        "category": "EquipmentMaintenance",
        "risk": "Medium",
        "recommended_task": "EquipmentMaintenance",
        "treatment": "Flush lateral drip lines and clean inline disk filter. Inspect sub-main valves for pressure leaks."
    }
]


@tool
def lookup_crop_handbook(crop_variety: str, symptom: str) -> str:
    """Search the Agronomy Handbook for crop disease, pest, nutrient, or water issues.
    Use this for EVERY factual diagnostic query.
    Args:
        crop_variety: The name of the crop (e.g. 'Tomato', 'Paddy', 'Maize').
        symptom: Specific symptom keywords observed on leaves, stems, or soil (e.g. 'yellow leaves', 'fungal spots', 'chewed holes', 'wilting').
    Returns:
        Grounded diagnostic findings, risk classification, suggested farm task, and treatment protocol.
    """
    symptom_lower = symptom.lower()
    crop_lower = crop_variety.lower()

    for entry in AGRI_HANDBOOK:
        entry_crop = entry["crop"].lower()
        if entry_crop == crop_lower or entry_crop == "general":
            if any(k in symptom_lower for k in entry["keywords"]):
                return (
                    f"[{entry['crop']}-Handbook]\n"
                    f"Issue: {entry['issue']}\n"
                    f"Category: {entry['category']}\n"
                    f"Assessed Risk: {entry['risk']}\n"
                    f"Suggested Task: {entry['recommended_task']}\n"
                    f"Protocol: {entry['treatment']}"
                )

    return (
        f"[General-Handbook]\n"
        f"Issue: General Physiological Stress\n"
        f"Category: Environmental\n"
        f"Assessed Risk: Low\n"
        f"Suggested Task: CropMonitoring\n"
        f"Protocol: Perform routine physical field inspection and leaf tissue sampling."
    )


@tool
def calculate_treatment_dosage(area_hectares: float, dose_per_hectare: float) -> str:
    """Calculate the exact quantity of fertilizer or treatment required for a given field area.
    Args:
        area_hectares: The size of the field plot in hectares (e.g. 1.5).
        dose_per_hectare: The recommended application rate per hectare in kg or liters (e.g. 2.5).
    Returns:
        The total required chemical/fertilizer amount formatted with units.
    """
    total = area_hectares * dose_per_hectare
    return f"Total Required Treatment: {total:.2f} units for {area_hectares} hectares at {dose_per_hectare} units/ha."


@tool
def check_field_weather_suitability(field_id: str, proposed_action: str) -> str:
    """Check environmental and weather conditions on a specific field to ensure an action is safe to execute.
    Args:
        field_id: The identifier of the field plot.
        proposed_action: The planned action, e.g. 'Spraying', 'Fertilization', 'Harvesting'.
    Returns:
        Weather advisory confirming whether the action can proceed safely.
    """
    return f"[Weather-Station-{field_id}]: Wind speed: 4 km/h, Rain probability: 10%, Temp: 28C. Conditions are OPTIMAL for {proposed_action}."


# List of tools advertised to Agent 2
TOOLS = [lookup_crop_handbook, calculate_treatment_dosage, check_field_weather_suitability]

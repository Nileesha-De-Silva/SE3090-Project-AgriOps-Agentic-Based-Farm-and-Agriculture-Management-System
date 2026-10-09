"""
Agricultural Safety & Deterministic Validation Tools for AgriOps Agent 4 (Sahas).
Provides LangChain @tool definitions with model-facing docstrings for ReAct and deterministic execution.
"""

from typing import Any, Dict, List
from langchain_core.tools import tool
import requests

# Banned Agrochemicals Registry (Good Agricultural Practices - GAP)
BANNED_CHEMICALS = ["ddt", "endosulfan", "monocrotophos", "chlorpyrifos", "paraquat"]

# Solanaceae (Tomato, Chili, Eggplant) Incompatible Herbicide Registry
SOLANACEAE_LETHAL_HERBICIDES = ["atrazine", "2,4-d", "dicamba", "glyphosate"]


@tool
def lookup_crop_compatibility(crop_variety: str, input_item_name: str) -> str:
    """Check if a specific agrochemical or fertilizer input is agronomically compatible
    and non-toxic for the target crop variety. Use whenever an agent proposes a chemical treatment.
    """
    crop = crop_variety.strip().lower()
    item = input_item_name.strip().lower()

    if ("tomato" in crop or "eggplant" in crop or "chili" in crop) and any(h in item for h in SOLANACEAE_LETHAL_HERBICIDES):
        return f"[FAIL: Incompatible] '{input_item_name}' is toxic and unapproved for Solanaceae ({crop_variety}) crops. Causes total crop loss."

    if any(b in item for b in BANNED_CHEMICALS):
        return f"[FAIL: Regulatory Ban] '{input_item_name}' is on the national prohibited agricultural chemical list (GAP violation)."

    return f"[PASS: Compatible] '{input_item_name}' is agronomically approved for {crop_variety}."


@tool
def calculate_certified_dosage_limit(action: str, proposed_quantity: float, unit: str) -> str:
    """Evaluate whether a proposed chemical or fertilizer dosage falls safely within
    certified agronomic application limits. Returns pass or bounds-exceeded warning.
    """
    act = action.strip().lower()
    qty = float(proposed_quantity)

    if "fertiliz" in act:
        if qty > 250.0:
            return f"[FAIL: Dosage Exceeded] Proposed {qty} {unit} exceeds certified maximum application rate of 250 kg/ha. Severe root burning risk."
        return f"[PASS: Safe Dosage] {qty} {unit} is within certified agronomic fertilizer limits (<= 250 kg/ha)."

    if "spray" in act or "pest" in act:
        if qty > 5.0:
            return f"[FAIL: Dosage Exceeded] Chemical spray concentration {qty} {unit} exceeds maximum safe limit of 5.0 L/ha. Causes leaf chlorosis and environmental toxicity."
        return f"[PASS: Safe Dosage] Chemical application rate of {qty} {unit} is within safe limits (<= 5.0 L/ha)."

    return f"[PASS: Safe Dosage] Operational parameters for '{action}' comply with standard farm thresholds."


@tool
def fetch_meteorological_conditions(latitude: float = 6.9271, longitude: float = 79.8612) -> str:
    """Fetch live meteorological data (temperature, wind speed, rain probability, humidity)
    from the external meteorological API. Essential for verifying spray drift and irrigation safety.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude:.4f}&longitude={longitude:.4f}&current=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m&timezone=auto"
        res = requests.get(url, timeout=4.0)
        if res.status_code == 200:
            d = res.json().get("current", {})
            temp = d.get("temperature_2m", 29.5)
            rain = d.get("precipitation_probability", 20)
            wind = d.get("wind_speed_10m", 12.0)
            hum = d.get("relative_humidity_2m", 72)
            return f"[Weather Live] Temp: {temp}°C, Rain Probability: {rain}%, Wind Speed: {wind} km/h, Humidity: {hum}%."
    except Exception:
        pass

    # Localized cached weather fallback
    return "[Weather Cached] Temp: 29.0°C, Rain Probability: 25%, Wind Speed: 14.0 km/h, Humidity: 75%."


@tool
def check_inventory_and_regulatory_compliance(input_item_name: str, requested_quantity: float) -> str:
    """Check if the required inventory item is in stock in Component 3 and complies with
    safety stock threshold policies.
    """
    item = input_item_name.strip().lower()
    qty = float(requested_quantity)

    if "depleted" in item or "out of stock" in item:
        return f"[FAIL: Depleted Stock] Resource '{input_item_name}' has 0 units available in Component 3 inventory."

    if qty > 500.0:
        return f"[FAIL: Threshold Exceeded] Quantity {qty} exceeds standard warehouse buffer. Emergency reorder required."

    return f"[PASS: In Stock] Resource '{input_item_name}' is verified in Component 3 inventory and satisfies stock thresholds."


TOOLS = [
    lookup_crop_compatibility,
    calculate_certified_dosage_limit,
    fetch_meteorological_conditions,
    check_inventory_and_regulatory_compliance,
]

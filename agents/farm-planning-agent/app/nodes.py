from datetime import datetime, timezone
from langchain_google_genai import ChatGoogleGenerativeAI
from app.state import PlanningState
from app import backend_client
from app.config import GEMINI_API_KEY

llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", google_api_key=GEMINI_API_KEY)


def _log(state: PlanningState, message: str) -> None:
    state.setdefault("trace", []).append(
        {"timestamp": datetime.now(timezone.utc).isoformat(), "message": message}
    )


# Step 1: Check Weather (STUB — Agent 3 not built yet by teammate)
async def check_weather(state: PlanningState) -> PlanningState:
    _log(state, "Checking weather (stub — Agent 3 not yet available)")
    state["weather_forecast"] = {
        "temperature_c": 28,
        "rain_probability": 20,
        "humidity": 65,
        "note": "STUBBED — replace with real Agent 3 call once available",
    }
    return state


# Step 2: Analyze Crop Stage (REAL — pulls from Component 1 API)
async def analyze_crop_stage(state: PlanningState) -> PlanningState:
    crop_season = await backend_client.get_crop_season(state["crop_season_id"])
    crop = await backend_client.get_crop(crop_season["cropId"])
    state["crop_season_data"] = crop_season
    state["crop_data"] = crop
    _log(state, f"Crop stage: {crop_season.get('currentGrowthStage')}")
    return state


# Step 3: Check Soil Information (REAL — pulls from Component 1 API)
async def check_soil_information(state: PlanningState) -> PlanningState:
    field = await backend_client.get_field(state["field_id"])
    soil_records = await backend_client.get_soil_records(state["field_id"])
    state["field_data"] = field
    state["soil_records"] = soil_records
    _log(state, f"Retrieved {len(soil_records)} soil record(s)")
    return state


# Step 4: Review Previous Activities (STUB — Component 2 not built yet)
async def review_previous_activities(state: PlanningState) -> PlanningState:
    _log(state, "Reviewing previous activities (stub — Component 2 not yet available)")
    state["previous_activities"] = []
    return state


# Step 5: Determine Required Tasks (REAL — LLM reasoning over gathered context)
async def determine_required_tasks(state: PlanningState) -> PlanningState:
    prompt = f"""You are an agricultural planning assistant. Based on this context, list the
specific farm tasks needed in the next 7 days. Be concrete and concise.

Crop: {state['crop_data'].get('cropName')} ({state['crop_data'].get('variety')})
Current growth stage: {state['crop_season_data'].get('currentGrowthStage')}
Field: {state['field_data'].get('fieldName')}, soil type: {state['field_data'].get('soilType')}
Latest soil record: {state['soil_records'][0] if state['soil_records'] else 'none available'}
Weather forecast: {state['weather_forecast']}

Return a short bullet list of recommended tasks only, no extra commentary."""

    response = await llm.ainvoke(prompt)

    # Newer Gemini responses can return content as a list of blocks instead of a plain string
    if isinstance(response.content, list):
        text = "\n".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in response.content
        )
    else:
        text = response.content

    tasks = [line.strip("-• ").strip() for line in text.split("\n") if line.strip()]
    state["required_tasks"] = tasks
    _log(state, f"LLM determined {len(tasks)} required task(s)")
    return state

# Step 6: Check Resource Availability (STUB — Component 3 not built yet)
async def check_resource_availability(state: PlanningState) -> PlanningState:
    _log(state, "Checking resource availability (stub — Component 3 not yet available)")
    state["resource_check"] = {"note": "STUBBED — replace with real Component 3/Agent 3 call once available"}
    return state


# Step 7: Create Recommended Schedule (REAL — compiles everything gathered)
async def create_recommended_schedule(state: PlanningState) -> PlanningState:
    state["recommended_schedule"] = {
        "fieldId": state["field_id"],
        "cropSeasonId": state["crop_season_id"],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "tasks": state["required_tasks"],
        "basedOnGrowthStage": state["crop_season_data"].get("currentGrowthStage"),
        "basedOnWeather": state["weather_forecast"],
    }
    _log(state, "Compiled recommended schedule")
    return state


# Step 8: Request Approval if Necessary (marks the flag — Component 4 approval queue not built yet)
async def request_approval(state: PlanningState) -> PlanningState:
    state["approval_required"] = True
    _log(state, "Flagged for human approval (Component 4 approval queue not yet available — returned in response instead)")
    return state
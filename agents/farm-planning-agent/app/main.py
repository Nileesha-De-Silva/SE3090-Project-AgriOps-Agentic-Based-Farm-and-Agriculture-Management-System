import uuid
from fastapi import FastAPI
from pydantic import BaseModel
from app.graph import planning_graph

app = FastAPI(title="Farm Planning Agent")


class PlanRequest(BaseModel):
    field_id: str
    crop_season_id: str


@app.post("/plan")
async def create_plan(request: PlanRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    result = await planning_graph.ainvoke(
        {"field_id": request.field_id, "crop_season_id": request.crop_season_id},
        config=config,
    )

    return {
        "threadId": thread_id,
        "recommendedSchedule": result["recommended_schedule"],
        "approvalRequired": result["approval_required"],
        "trace": result["trace"],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
"""
FastAPI Service for AgriOps Agent 2 Subsystem.
Exposes REST endpoints for crop diagnostic analysis, tool discovery, and task approval:
  - GET  /health          Liveness and configuration
  - GET  /tools           Exact JSON schemas advertised to the model
  - POST /analyze         Run the diagnostic graph on a thread (returns answer or awaiting_approval)
  - POST /resume          Resume a paused thread with manager decision
  - GET  /threads/{id}    Inspect the checkpointer state for that thread
"""

import time
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langgraph.types import Command

from agents.agent2_crop_analysis import (
    AGENT2_APP,
    CHAT_MODEL,
    run_agent2_workflow,
)
from agents.schemas.crop_analysis_contracts import (
    AskRequest,
    GraphResponse,
    ResumeRequest,
)
from agents.tools.symptom_mapping_tool import TOOLS

app = FastAPI(
    title="AgriOps Agent 2 Subsystem API",
    description="Grounded Stateful Agent with Human-in-the-Loop & LangGraph Checkpointing",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Liveness & configuration endpoint (costs zero model quota)."""
    return {
        "status": "online",
        "service": "AgriOps Agent 2 Subsystem",
        "model": CHAT_MODEL,
        "checkpointer": "InMemorySaver",
        "architecture": "LangGraph StateGraph with HITL interrupt",
    }


@app.get("/tools")
def list_tools() -> List[Dict[str, Any]]:
    """Return the exact JSON schemas advertised to the model."""
    schemas = []
    for t in TOOLS:
        schemas.append({
            "name": t.name,
            "description": t.description,
            "args_schema": t.args_schema.model_json_schema() if t.args_schema else {},
        })
    return schemas


@app.post("/analyze", response_model=GraphResponse)
def analyze_crop(request: AskRequest):
    """Run the diagnostic graph on a thread. Returns an answer or pauses for manager approval."""
    start_time = time.time()
    try:
        initial_input = {
            "field_id": request.field_id,
            "crop_variety": request.crop_variety,
            "growth_stage": request.growth_stage,
            "observation": request.observation,
            "image_url": request.image_url or "",
        }
        response = run_agent2_workflow(initial_input, thread_id=request.thread_id)
        response.seconds = round(time.time() - start_time, 2)
        return response
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.post("/resume", response_model=GraphResponse)
def resume_workflow(request: ResumeRequest):
    """Resume a paused workflow across HTTP requests using Command(resume=decision)."""
    start_time = time.time()
    try:
        # Pass the human decision through Command(resume=...)
        resume_command = Command(resume=request.decision)
        response = run_agent2_workflow(resume_command, thread_id=request.thread_id)
        response.seconds = round(time.time() - start_time, 2)
        return response
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.get("/threads/{thread_id}")
def get_thread_state(thread_id: str):
    """Inspect what the checkpointer holds for a given thread."""
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = AGENT2_APP.get_state(config)
    if not snapshot or not snapshot.values:
        raise HTTPException(status_code=404, detail=f"No state found for thread_id '{thread_id}'")

    messages_dump = []
    for m in snapshot.values.get("messages", []):
        messages_dump.append({
            "type": type(m).__name__,
            "content": getattr(m, "content", str(m)),
        })

    return {
        "thread_id": thread_id,
        "next": snapshot.next,
        "tasks": [t.id for t in snapshot.tasks] if hasattr(snapshot, "tasks") else [],
        "fields": {k: v for k, v in snapshot.values.items() if k != "messages"},
        "messages": messages_dump,
    }

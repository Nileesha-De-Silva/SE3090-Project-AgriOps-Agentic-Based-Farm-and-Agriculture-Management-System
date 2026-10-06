import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Lock
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command

from app.backend_client import BackendClient
from app.config import Settings, load_settings
from app.graph import build_graph
from app.state import (
    AnalyzeRequest,
    ApprovalDecisionRequest,
    SentinelRunResponse,
)


def create_app(settings: Settings | None = None, backend: BackendClient | None = None, model=None):
    settings = settings or load_settings()
    backend = backend or BackendClient(settings)
    busy = Lock()

    if model is None and settings.has_llm_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            model = ChatGoogleGenerativeAI(
                model=settings.chat_model,
                google_api_key=settings.gemini_api_key,
                temperature=0.2,
                timeout=settings.model_timeout_seconds,
            )
        except Exception:
            model = None

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        Path(settings.checkpoint_db).parent.mkdir(parents=True, exist_ok=True)
        with SqliteSaver.from_conn_string(settings.checkpoint_db) as saver:
            application.state.graph = build_graph(settings, backend, saver, model)
            yield
        backend.close()

    application = FastAPI(
        title="AgriOps AI Sentinel Agent (Component 4)",
        version="1.0.0",
        description="Production Analytics, Anomaly Detection & Operations Sentinel Agent for Component 4.",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    bearer = HTTPBearer(auto_error=False)

    def extract_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str | None:
        return credentials.credentials if credentials else None

    def thread_config(run_id: str):
        return {"configurable": {"thread_id": f"sentinel:{run_id}"}, "recursion_limit": 20}

    def format_response(run_id: str, snapshot) -> dict:
        values = snapshot.values or {}
        has_interrupt = any(task.interrupts for task in snapshot.tasks) if hasattr(snapshot, "tasks") else False

        status = "awaiting_approval" if has_interrupt else values.get("status", "completed")
        if values.get("approval_status") == "approved":
            status = "approved"
        elif values.get("approval_status") == "rejected":
            status = "rejected"

        return {
            "run_id": str(run_id),
            "status": status,
            "yield_performance_score": values.get("yield_performance_score", 75.0),
            "overall_risk_level": values.get("overall_risk_level", "LOW"),
            "anomalies": values.get("anomalies", []),
            "remediation": values.get("remediation"),
            "strategic_commentary": values.get("strategic_commentary", ""),
            "requires_human_approval": values.get("requires_human_approval", False),
            "approval_status": values.get("approval_status", "not_required"),
            "final_outcome": values.get("final_outcome"),
            "trace": values.get("trace", []),
            "error": values.get("error"),
        }

    @application.get("/health")
    def health():
        return {
            "status": "healthy",
            "service": "analytics-sentinel-agent",
            "component": "Component 4 (Sahas)",
            "llm_ready": settings.has_llm_key,
        }

    @application.post("/sentinel/analyze", response_model=SentinelRunResponse)
    def analyze(request_body: AnalyzeRequest, request: Request, token: str | None = Depends(extract_token)):
        run_id = str(uuid.uuid4())
        cfg = thread_config(run_id)
        graph = request.app.state.graph

        with busy:
            initial_state = {
                "run_id": run_id,
                "field_id": str(request_body.field_id) if request_body.field_id else None,
                "crop_name": request_body.crop_name,
                "sensitivity_threshold": request_body.sensitivity_threshold,
                "audit_lookback_count": request_body.audit_lookback_count,
                "harvest_records": [],
                "audit_records": [],
                "anomalies": [],
                "trace": [],
                "status": "running",
            }
            try:
                graph.invoke(initial_state, cfg)
            except Exception as exc:
                raise HTTPException(500, f"Sentinel execution failed: {str(exc)}") from exc

            snapshot = graph.get_state(cfg)
            return format_response(run_id, snapshot)

    @application.get("/runs/{run_id}", response_model=SentinelRunResponse)
    def get_run(run_id: UUID, request: Request):
        cfg = thread_config(str(run_id))
        snapshot = request.app.state.graph.get_state(cfg)
        if not snapshot.values:
            raise HTTPException(404, "Sentinel run not found")
        return format_response(str(run_id), snapshot)

    @application.post("/runs/{run_id}/approve", response_model=SentinelRunResponse)
    def approve(run_id: UUID, body: ApprovalDecisionRequest, request: Request):
        cfg = thread_config(str(run_id))
        graph = request.app.state.graph
        snapshot = graph.get_state(cfg)
        if not snapshot.values:
            raise HTTPException(404, "Sentinel run not found")

        with busy:
            try:
                graph.invoke(
                    Command(resume={"action": "approve", "manager_notes": body.manager_notes}),
                    cfg,
                )
            except Exception as exc:
                raise HTTPException(500, f"Approval resumption failed: {str(exc)}") from exc

            updated_snapshot = graph.get_state(cfg)
            return format_response(str(run_id), updated_snapshot)

    @application.post("/runs/{run_id}/reject", response_model=SentinelRunResponse)
    def reject(run_id: UUID, body: ApprovalDecisionRequest, request: Request):
        cfg = thread_config(str(run_id))
        graph = request.app.state.graph
        snapshot = graph.get_state(cfg)
        if not snapshot.values:
            raise HTTPException(404, "Sentinel run not found")

        with busy:
            try:
                graph.invoke(
                    Command(resume={"action": "reject", "manager_notes": body.manager_notes}),
                    cfg,
                )
            except Exception as exc:
                raise HTTPException(500, f"Rejection resumption failed: {str(exc)}") from exc

            updated_snapshot = graph.get_state(cfg)
            return format_response(str(run_id), updated_snapshot)

    return application


app = create_app()

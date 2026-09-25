from contextlib import asynccontextmanager
from decimal import Decimal
from pathlib import Path
from threading import Lock
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command

from app.backend_client import BackendClient, BackendError
from app.config import load_settings
from app.graph import build_graph
from app.state import RecommendRequest


def create_app(settings=None, backend=None, model=None):
    settings = settings or load_settings()
    backend = backend or BackendClient(settings)
    busy = Lock()  # One active graph call in this single-worker local prototype.

    @asynccontextmanager
    async def lifespan(application):
        Path(settings.checkpoint_db).parent.mkdir(parents=True, exist_ok=True)
        with SqliteSaver.from_conn_string(settings.checkpoint_db) as saver:
            application.state.graph = build_graph(settings, backend, saver, model)
            yield
        backend.close()

    application = FastAPI(title="Inventory Agent", lifespan=lifespan)
    bearer = HTTPBearer(auto_error=False)

    def owner(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if credentials is None:
            raise HTTPException(401, "Manager bearer token required", headers={"WWW-Authenticate": "Bearer"})
        try:
            return backend.manager_owner(credentials.credentials)
        except BackendError as exc:
            raise HTTPException(exc.status, exc.code) from None

    def config(owner_id, run_id):
        # The same UUID belongs to a different checkpoint for a different authenticated manager.
        return {"configurable": {"thread_id": f"{owner_id}:{run_id}"}, "recursion_limit": 24}

    def response(run_id, snapshot):
        state = snapshot.values
        return {"runId": str(run_id), "status": state.get("status"), "error": state.get("error"),
                "recommendation": state.get("recommendation"), "quantity": state.get("quantity"),
                "evidence": state.get("context"), "modelAttempts": state.get("model_attempts", 0),
                "totalTokens": state.get("total_tokens", 0), "trace": state.get("trace", []),
                "canRetry": bool(snapshot.next) and state.get("status") != "awaiting_approval"}

    def invoke(graph, value, cfg, run_id):
        try:
            graph.invoke(value, cfg)
        except BackendError as exc:
            raise HTTPException(exc.status, {"code": exc.code, "runId": str(run_id),
                                            "retry": f"/runs/{run_id}/resume"}) from None
        except Exception:
            raise HTTPException(500, {"code": "agent_execution_failed", "runId": str(run_id)}) from None

    @application.get("/health")
    def health():
        return {"status": "ok", "configured": settings.ready, "agent": "inventory-agent"}

    @application.post("/recommend")
    def recommend(body: RecommendRequest, request: Request, owner_id: str = Depends(owner)):
        if not settings.ready:
            raise HTTPException(503, "Configure CHAT_MODEL, GEMINI_API_KEY and BACKEND_AGENT_TOKEN first.")
        if not busy.acquire(blocking=False):
            raise HTTPException(409, "Agent busy; retry shortly with the same request_id.")
        try:
            graph, cfg = request.app.state.graph, config(owner_id, body.request_id)
            snapshot = graph.get_state(cfg)
            if snapshot.values:
                if snapshot.values["inventory_item_id"] != str(body.inventory_item_id) or Decimal(snapshot.values["target_stock"]) != body.target_stock:
                    raise HTTPException(409, "request_id already used for different input")
                return response(body.request_id, snapshot)
            invoke(graph, {"run_id": str(body.request_id), "inventory_item_id": str(body.inventory_item_id),
                           "target_stock": str(body.target_stock), "status": "starting", "trace": [],
                           "model_attempts": 0, "total_tokens": 0}, cfg, body.request_id)
            return response(body.request_id, graph.get_state(cfg))
        finally:
            busy.release()

    @application.get("/runs/{run_id}")
    def get_run(run_id: UUID, request: Request, owner_id: str = Depends(owner)):
        snapshot = request.app.state.graph.get_state(config(owner_id, run_id))
        if not snapshot.values:
            raise HTTPException(404, "Run not found for this manager")
        return response(run_id, snapshot)

    @application.post("/runs/{run_id}/resume")
    def resume(run_id: UUID, request: Request, owner_id: str = Depends(owner)):
        # No approval body accepted. The decision must already exist in the backend.
        if not busy.acquire(blocking=False):
            raise HTTPException(409, "Agent busy; retry shortly.")
        try:
            graph, cfg = request.app.state.graph, config(owner_id, run_id)
            snapshot = graph.get_state(cfg)
            if not snapshot.values:
                raise HTTPException(404, "Run not found for this manager")
            if not snapshot.next:
                return response(run_id, snapshot)
            if any(task.interrupts for task in snapshot.tasks):
                try:
                    decision = backend.recommendation(snapshot.values["recommendation"]["id"])
                except BackendError as exc:
                    raise HTTPException(exc.status, exc.code) from None
                if decision.get("status") not in {"Approved", "Rejected"}:
                    raise HTTPException(409, "Manager decision is still Pending in the backend.")
                value = Command(resume="observe_backend_decision")
            else:
                value = None  # Resume failed read/submission with checkpointed payload and bounded model count.
            invoke(graph, value, cfg, run_id)
            return response(run_id, graph.get_state(cfg))
        finally:
            busy.release()

    return application


app = create_app()

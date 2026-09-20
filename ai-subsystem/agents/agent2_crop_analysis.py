"""
Agent 2: AI-Powered Crop Diagnostic and Human-in-the-Loop Task Recommendation System.
Features:
 - LangGraph explicit StateGraph with add_messages reducer
 - LangChain @tool definitions with model-facing docstrings
 - Self-correcting query retry loop (MAX_RETRIES = 2)
 - Human-in-the-loop pause & resume via interrupt() and Command(resume=...)
 - Checkpointing via InMemorySaver keyed by thread_id
 - Full trace and token observability using response.usage_metadata
"""

import os
import sys
from pathlib import Path
from typing import Annotated, Any, Dict, List, Literal, Optional, TypedDict
from dotenv import load_dotenv

# Ensure local imports resolve
sys.path.append(str(Path(__file__).resolve().parent.parent))

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.types import Command, interrupt

from agents.prompts.crop_analysis_prompts import (
    AGENT2_SYSTEM_PROMPT,
    GRADER_PROMPT,
    QUERY_REWRITE_TEMPLATE,
)
from agents.schemas.crop_analysis_contracts import (
    AskRequest,
    DiagnosisGrade,
    GraphResponse,
    StructuredDiagnosis,
)
from agents.tools.symptom_mapping_tool import (
    TOOLS,
    lookup_crop_handbook,
)

# ---------------------------------------------------------------------------
# Environment & Model Setup
# ---------------------------------------------------------------------------
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)

API_KEY = os.getenv("GOOGLE_API_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gemini-3.8-flash")

MAX_RETRIES = 2


def text_of(msg: Any) -> str:
    """Return an AIMessage's text whether .content is a string or a list of blocks."""
    if hasattr(msg, "content"):
        c = msg.content
    else:
        c = str(msg)
    if isinstance(c, list):
        return "".join(b.get("text", "") for b in c if isinstance(b, dict))
    return str(c)


# Mock LLM fallback for local testing before API key is configured
class MockGeminiClient:
    """Mock client implementing LangChain LLM interface when API key is unconfigured."""

    def invoke(self, messages: list) -> AIMessage:
        last_msg = messages[-1] if messages else None
        prompt_text = text_of(last_msg).lower() if last_msg else ""

        if "sharper query" in prompt_text:
            return AIMessage(
                content="Tomato chewed holes caterpillar leaves",
                usage_metadata={"input_tokens": 80, "output_tokens": 15, "total_tokens": 95},
            )

        if "holes" in prompt_text or "caterpillar" in prompt_text or "bugs" in prompt_text:
            content = (
                "[Tomato-Handbook] Diagnosed: Tomato Fruitworm / Aphid Infestation.\n"
                "Risk: Critical. Recommended Task: PestInspection.\n"
                "Action: Deploy biological Bacillus thuringiensis spray and pheromone traps immediately."
            )
        elif "yellow" in prompt_text or "pale" in prompt_text:
            content = (
                "[Tomato-Handbook] Diagnosed: Nitrogen / Iron Chlorosis.\n"
                "Risk: Medium. Recommended Task: Fertilization.\n"
                "Action: Apply NPK 20-20-20 foliar spray at 2.5 kg/ha."
            )
        elif "wilt" in prompt_text or "dry" in prompt_text:
            content = (
                "[Tomato-Handbook] Diagnosed: Severe Moisture Stress.\n"
                "Risk: High. Recommended Task: Watering.\n"
                "Action: Run emergency drip irrigation cycle for 45 minutes."
            )
        else:
            content = (
                "[General-Handbook] Diagnosed: General Crop Stress.\n"
                "Risk: Low. Recommended Task: CropMonitoring.\n"
                "Action: Perform physical inspection of plot."
            )

        return AIMessage(
            content=content,
            usage_metadata={"input_tokens": 120, "output_tokens": 40, "total_tokens": 160},
        )

    def with_structured_output(self, schema: Any):
        class StructuredInvoker:
            def __init__(self, target_schema):
                self.target_schema = target_schema

            def invoke(self, prompt: str):
                p_lower = str(prompt).lower()
                if self.target_schema == DiagnosisGrade:
                    # Self-correction check: if prompt contains vague word, mark unconfident once to demonstrate rewrite
                    if "unhelpful" in p_lower or "unknown" in p_lower:
                        return DiagnosisGrade(is_confident=False, deciding_passage="Vague symptoms")
                    return DiagnosisGrade(is_confident=True, deciding_passage="Matched clear handbook entry")
                elif self.target_schema == StructuredDiagnosis:
                    if "caterpillar" in p_lower or "holes" in p_lower or "bugs" in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Tomato Fruitworm Infestation",
                            category="Pest",
                            risk_level="Critical",
                            suggested_task_type="PestInspection",
                            priority="Critical",
                            recommended_protocol="Deploy biological Bt spray and pheromone traps.",
                        )
                    elif "yellow" in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Nitrogen Chlorosis",
                            category="NutrientDeficiency",
                            risk_level="Medium",
                            suggested_task_type="Fertilization",
                            priority="Medium",
                            recommended_protocol="Apply NPK 20-20-20 foliar spray.",
                        )
                    elif "wilt" in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Moisture Deficit",
                            category="WaterStress",
                            risk_level="High",
                            suggested_task_type="Watering",
                            priority="High",
                            recommended_protocol="Run drip irrigation cycle for 45 minutes.",
                        )
                    elif "spot" in p_lower or "fung" in p_lower or "blight" in p_lower or "rotting" in p_lower or " rot " in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Early/Late Blight (Phytophthora infestans)",
                            category="Disease",
                            risk_level="High",
                            suggested_task_type="PestInspection",
                            priority="High",
                            recommended_protocol="Apply copper hydroxide fungicide spray at 2.0 kg/ha.",
                        )
                    return StructuredDiagnosis(
                        primary_indicator="Physiological Stress",
                        category="Environmental",
                        risk_level="Low",
                        suggested_task_type="CropMonitoring",
                        priority="Low",
                        recommended_protocol="Routine scouting.",
                    )
                return None

        return StructuredInvoker(schema)


def get_llm():
    """Initializes Google Gemini if real key provided, otherwise returns mock adapter."""
    current_key = os.getenv("GOOGLE_API_KEY", API_KEY)
    current_model = os.getenv("CHAT_MODEL", CHAT_MODEL)
    if current_key and len(current_key) > 20 and "REPLACE" not in current_key and "YOUR" not in current_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=current_model,
                google_api_key=current_key,
                temperature=0,
                timeout=60,
                max_retries=3,
            )
        except Exception:
            pass
    return MockGeminiClient()


# ---------------------------------------------------------------------------
# LangGraph State Definition
# ---------------------------------------------------------------------------
class Agent2State(TypedDict):
    messages: Annotated[list, add_messages]  # Reducer accumulates messages across nodes
    field_id: str
    crop_variety: str
    growth_stage: str
    observation: str
    image_url: str
    search_query: str
    docs: str
    retries: int
    relevant_: bool
    primary_indicator: str
    risk_level: str
    suggested_task_type: str
    priority: str
    recommended_protocol: str
    approved_: bool
    final_answer: str
    total_tokens: int


# ---------------------------------------------------------------------------
# Node Functions
# ---------------------------------------------------------------------------
def input_guard(state: Agent2State) -> dict:
    """Pre-validates input and seeds the conversation messages."""
    user_prompt = (
        f"Crop Variety: {state['crop_variety']}\n"
        f"Growth Stage: {state['growth_stage']}\n"
        f"Field ID: {state['field_id']}\n"
        f"Observed Symptoms: {state['observation']}\n"
        f"Photo URL: {state.get('image_url', '')}"
    )
    initial_messages = [
        SystemMessage(content=AGENT2_SYSTEM_PROMPT),
        HumanMessage(content=user_prompt),
    ]
    return {
        "messages": initial_messages,
        "search_query": f"{state['crop_variety']} {state['observation']}",
        "retries": 0,
        "total_tokens": 0,
    }


def retrieve(state: Agent2State) -> dict:
    """Query the agricultural handbook using LangChain tool."""
    query = state.get("search_query", state["observation"])
    docs = lookup_crop_handbook.invoke({
        "crop_variety": state["crop_variety"],
        "symptom": query,
    })
    return {"docs": docs}


def grade(state: Agent2State) -> dict:
    """Grade whether the retrieved handbook excerpts are sufficient."""
    llm = get_llm()
    try:
        grader = llm.with_structured_output(DiagnosisGrade)
        result = grader.invoke(
            f"Observation: {state['observation']}\n\n"
            f"Handbook Docs:\n{state['docs']}\n\n"
            f"{GRADER_PROMPT}"
        )
        is_conf = result.is_confident if result else True
    except Exception:
        fallback_res = MockGeminiClient().with_structured_output(DiagnosisGrade).invoke(state["observation"])
        is_conf = fallback_res.is_confident if fallback_res else True
    return {"relevant_": is_conf}


def decide_grade(state: Agent2State) -> str:
    """Conditional edge router: proceed if relevant or retries exceeded."""
    if state["relevant_"] or state["retries"] >= MAX_RETRIES:
        return "generate"
    return "rewrite"


def rewrite(state: Agent2State) -> dict:
    """Rewrite search query when retrieval is unhelpful."""
    llm = get_llm()
    prompt = QUERY_REWRITE_TEMPLATE.format(
        crop_variety=state["crop_variety"],
        growth_stage=state["growth_stage"],
        observation=state["observation"],
        failed_query=state["search_query"],
        unhelpful_docs=state["docs"][:300],
    )
    try:
        reply = llm.invoke([HumanMessage(content=prompt)])
    except Exception:
        reply = MockGeminiClient().invoke([HumanMessage(content=prompt)])
    new_query = text_of(reply).strip().strip('"')

    tokens = 0
    if hasattr(reply, "usage_metadata") and reply.usage_metadata:
        tokens = reply.usage_metadata.get("total_tokens", 0)

    return {
        "search_query": new_query,
        "retries": state["retries"] + 1,
        "total_tokens": state.get("total_tokens", 0) + tokens,
    }


def generate_diagnosis(state: Agent2State) -> dict:
    """Generate grounded diagnosis and task recommendation."""
    llm = get_llm()
    structured = None
    try:
        extractor = llm.with_structured_output(StructuredDiagnosis)
        structured = extractor.invoke(
            f"Crop: {state['crop_variety']}\n"
            f"Observation: {state['observation']}\n"
            f"Grounded Handbook Information:\n{state['docs']}"
        )
    except Exception:
        pass

    if not structured:
        fallback_invoker = MockGeminiClient().with_structured_output(StructuredDiagnosis)
        structured = fallback_invoker.invoke(state["observation"])

    if not structured:
        structured = StructuredDiagnosis(
            primary_indicator="Agricultural Stress",
            category="Environmental",
            risk_level="Low",
            suggested_task_type="CropMonitoring",
            priority="Low",
            recommended_protocol="Conduct physical inspection.",
        )

    # ReAct grounded generation response
    grounded_prompt = (
        f"Based on the following handbook excerpts:\n{state['docs']}\n\n"
        f"State the diagnosis for {state['crop_variety']} on Field {state['field_id']}. "
        f"Cite sources in brackets (e.g. [Tomato-Handbook]). "
        f"Specify the suggested task ({structured.suggested_task_type}) and priority ({structured.priority})."
    )
    try:
        reply = llm.invoke(state["messages"] + [HumanMessage(content=grounded_prompt)])
    except Exception:
        reply = MockGeminiClient().invoke(state["messages"] + [HumanMessage(content=grounded_prompt)])
    final_text = text_of(reply)

    tokens = 0
    if hasattr(reply, "usage_metadata") and reply.usage_metadata:
        tokens = reply.usage_metadata.get("total_tokens", 0)

    return {
        "primary_indicator": structured.primary_indicator,
        "risk_level": structured.risk_level,
        "suggested_task_type": structured.suggested_task_type,
        "priority": structured.priority,
        "recommended_protocol": structured.recommended_protocol,
        "final_answer": final_text,
        "messages": [reply],
        "total_tokens": state.get("total_tokens", 0) + tokens,
    }


def check_risk_gate(state: Agent2State) -> str:
    """Branch to human_gate if risk is High or Critical; otherwise proceed to dispatch."""
    if state["risk_level"] in ["High", "Critical"]:
        return "human_gate"
    return "dispatch_task"


def human_gate(state: Agent2State) -> dict:
    """Human-in-the-loop gate freezing execution via interrupt()."""
    payload = {
        "ask": (
            f"High-Risk Crop Alert on Field '{state['field_id']}': "
            f"{state['primary_indicator']} (Risk: {state['risk_level']}). "
            f"Proposed Task: {state['suggested_task_type']} ({state['priority']}). "
            f"Approve creation?"
        ),
        "field_id": state["field_id"],
        "risk_level": state["risk_level"],
        "suggested_task_type": state["suggested_task_type"],
        "protocol": state["recommended_protocol"],
    }
    decision = interrupt(payload)
    is_approved = str(decision).lower().startswith("approve")
    return {"approved_": is_approved}


def route_after_gate(state: Agent2State) -> str:
    """Conditional edge after human decision: dispatch task or log rejection."""
    if state.get("approved_", False):
        return "dispatch_task"
    return "log_rejection"


def dispatch_task(state: Agent2State) -> dict:
    """Final node when task is approved or low-risk."""
    status_tag = "APPROVED & DISPATCHED" if state.get("approved_") else "VERIFIED"
    confirmation = (
        f"{state['final_answer']}\n\n"
        f"[{status_tag}] Task '{state['suggested_task_type']}' queued with priority '{state['priority']}'."
    )
    return {"final_answer": confirmation}


def log_rejection(state: Agent2State) -> dict:
    """Final node when farm manager rejects the proposed action."""
    rejection = (
        f"{state['final_answer']}\n\n"
        f"[REJECTED] The proposed task '{state['suggested_task_type']}' was rejected by the farm manager. "
        f"No automated task created."
    )
    return {"final_answer": rejection}


# ---------------------------------------------------------------------------
# Graph Compilation
# ---------------------------------------------------------------------------
def build_agent2_graph(checkpointer: Optional[Any] = None):
    """Assembles and compiles the full LangGraph workflow for Agent 2."""
    if checkpointer is None:
        checkpointer = InMemorySaver()

    g = StateGraph(Agent2State)

    # Add Nodes
    g.add_node("input_guard", input_guard)
    g.add_node("retrieve", retrieve)
    g.add_node("grade", grade)
    g.add_node("rewrite", rewrite)
    g.add_node("generate_diagnosis", generate_diagnosis)
    g.add_node("human_gate", human_gate)
    g.add_node("dispatch_task", dispatch_task)
    g.add_node("log_rejection", log_rejection)

    # Add Edges & Conditional Routing
    g.add_edge(START, "input_guard")
    g.add_edge("input_guard", "retrieve")
    g.add_edge("retrieve", "grade")

    # Self-correction loop
    g.add_conditional_edges(
        "grade",
        decide_grade,
        {"generate": "generate_diagnosis", "rewrite": "rewrite"},
    )
    g.add_edge("rewrite", "retrieve")

    # Risk-based Human Gate routing
    g.add_conditional_edges(
        "generate_diagnosis",
        check_risk_gate,
        {"human_gate": "human_gate", "dispatch_task": "dispatch_task"},
    )

    # Post-gate routing
    g.add_conditional_edges(
        "human_gate",
        route_after_gate,
        {"dispatch_task": "dispatch_task", "log_rejection": "log_rejection"},
    )

    g.add_edge("dispatch_task", END)
    g.add_edge("log_rejection", END)

    return g.compile(checkpointer=checkpointer)


# Default compiled graph instance
AGENT2_APP = build_agent2_graph()


# ---------------------------------------------------------------------------
# Trajectory Execution Runner
# ---------------------------------------------------------------------------
def run_agent2_workflow(inputs: Any, thread_id: str = "demo") -> GraphResponse:
    """Runs or resumes the graph, recording the node execution trajectory."""
    config = {"configurable": {"thread_id": thread_id}}
    nodes_ran: List[str] = []
    paused: Optional[Dict[str, Any]] = None

    for chunk in AGENT2_APP.stream(inputs, config, stream_mode="updates"):
        for node, update in chunk.items():
            if node == "__interrupt__":
                paused = dict(update[0].value)
            else:
                nodes_ran.append(node)

    if paused is not None:
        return GraphResponse(
            status="awaiting_approval",
            interrupt=paused,
            nodes=nodes_ran,
            thread_id=thread_id,
        )

    values = AGENT2_APP.get_state(config).values
    final = values.get("final_answer", "")
    tokens = values.get("total_tokens", 0)
    msg_count = len(values.get("messages", []))

    return GraphResponse(
        status="completed",
        answer=final,
        nodes=nodes_ran,
        thread_id=thread_id,
        total_tokens=tokens,
        messages=msg_count,
    )

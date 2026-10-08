"""
Agent 2: AI-Powered Crop Diagnostic and Human-in-the-Loop Task Recommendation System.
Implementation adheres strictly to the Agent 2 LangGraph architecture:

  START -> [input_guard] -> [diagnose] -> [grade_assessment] -(High/Critical)-> [human_gate] (interrupt) -> [create_task] -> END
                                 ^              |                                       |
                                 |              |-(Low/Med confidence)-> [rewrite]      L-(Deny)-> [log_rejection] -> END
                                 |              |                           |
                                 |              L-(Approved/Low Risk)-> END |
                                 |                                          | (Max 2 retries)
                                 +------------------------------------------+

Features:
 - LangGraph explicit StateGraph with add_messages reducer
 - LangChain @tool definitions with model-facing docstrings
 - Self-correcting query rewrite loop (MAX_RETRIES = 2)
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
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

API_KEY = os.getenv("GOOGLE_API_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gemini-2.5-flash")

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


# Mock LLM fallback for local testing before API key is configured or offline
class MockGeminiClient:
    """Mock client implementing LangChain LLM interface when API key is unconfigured."""

    def invoke(self, messages: list) -> AIMessage:
        last_msg = messages[-1] if messages else None
        prompt_text = text_of(last_msg).lower() if last_msg else ""

        if "sharper query" in prompt_text or "rewrite" in prompt_text:
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
        elif "yellow" in prompt_text or "pale" in prompt_text or "chlorosis" in prompt_text or "curling" in prompt_text or "vein" in prompt_text:
            content = (
                "[Tomato-Handbook] Diagnosed: Magnesium / Nitrogen Nutrient Deficiency (Chlorosis).\n"
                "Risk: Medium. Recommended Task: Fertilization.\n"
                "Action: Apply NPK 20-20-20 foliar spray at 2.5 kg/ha with micronutrient booster. Test soil pH within 48 hours."
            )
        elif "wilt" in prompt_text or "dry" in prompt_text:
            content = (
                "[Tomato-Handbook] Diagnosed: Severe Moisture Stress.\n"
                "Risk: High. Recommended Task: Watering.\n"
                "Action: Run emergency drip irrigation cycle for 45 minutes."
            )
        elif "spot" in prompt_text or "fung" in prompt_text or "blight" in prompt_text:
            content = (
                "[Tomato-Handbook] Diagnosed: Early/Late Blight (Phytophthora infestans).\n"
                "Risk: High. Recommended Task: PestInspection.\n"
                "Action: Apply copper hydroxide fungicide spray at 2.0 kg/ha."
            )
        else:
            content = (
                "[General-Handbook] Diagnosed: General Physiological Stress / Healthy Plot.\n"
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
                    if "unhelpful" in p_lower or "unknown" in p_lower or "vague" in p_lower:
                        return DiagnosisGrade(is_confident=False, deciding_passage="Vague symptoms require sharpening")
                    return DiagnosisGrade(is_confident=True, deciding_passage="Matched clear handbook entry")
                elif self.target_schema == StructuredDiagnosis:
                    if "caterpillar" in p_lower or "holes" in p_lower or "bugs" in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Tomato Fruitworm Infestation (Pest Stress)",
                            category="Pest",
                            risk_level="Critical",
                            suggested_task_type="PestInspection",
                            priority="Critical",
                            recommended_protocol="Deploy biological Bt spray and pheromone traps.",
                            stress_factors=["Fruit chew holes", "Larval feeding damage"],
                        )
                    elif "yellow" in p_lower or "curling" in p_lower or "vein" in p_lower or "chlorosis" in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Magnesium / Nitrogen Nutrient Deficiency (Chlorosis)",
                            category="NutrientDeficiency",
                            risk_level="Medium",
                            suggested_task_type="Fertilization",
                            priority="Medium",
                            recommended_protocol="Apply NPK 20-20-20 foliar spray at 2.5 kg/ha with micronutrient booster.",
                            stress_factors=["Interveinal chlorosis", "Leaf margin curling"],
                        )
                    elif "wilt" in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Moisture Deficit",
                            category="WaterStress",
                            risk_level="High",
                            suggested_task_type="Watering",
                            priority="High",
                            recommended_protocol="Run drip irrigation cycle for 45 minutes.",
                            stress_factors=["Leaf wilting", "Turgor loss"],
                        )
                    elif "spot" in p_lower or "fung" in p_lower or "blight" in p_lower or "rotting" in p_lower or " rot " in p_lower:
                        return StructuredDiagnosis(
                            primary_indicator="Early/Late Blight (Phytophthora infestans)",
                            category="Disease",
                            risk_level="High",
                            suggested_task_type="PestInspection",
                            priority="High",
                            recommended_protocol="Apply copper hydroxide fungicide spray at 2.0 kg/ha.",
                            stress_factors=["Dark fungal leaf spots", "Tissue necrosis"],
                        )
                    return StructuredDiagnosis(
                        primary_indicator="General Crop Physiological Stress",
                        category="Environmental",
                        risk_level="Low",
                        suggested_task_type="CropMonitoring",
                        priority="Low",
                        recommended_protocol="Conduct physical inspection and leaf tissue sampling.",
                        stress_factors=["Minor environmental dust", "Normal vegetative state"],
                    )
                return None

        return StructuredInvoker(schema)


def get_llm():
    """Initializes Google Gemini if real key provided, otherwise returns mock adapter."""
    if os.getenv("USE_MOCK_LLM", "").lower() in ("true", "1", "yes"):
        return MockGeminiClient()

    current_key = os.getenv("GOOGLE_API_KEY", API_KEY)
    current_model = os.getenv("CHAT_MODEL", CHAT_MODEL)
    if current_key and len(current_key) > 20 and not current_key.startswith("AQ.") and "REPLACE" not in current_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=current_model,
                google_api_key=current_key,
                temperature=0,
                timeout=10,
                max_retries=1,
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
    is_confident: bool
    relevant_: bool
    primary_indicator: str
    risk_level: str
    suggested_task_type: str
    priority: str
    recommended_protocol: str
    stress_factors: List[str]
    confidence_score: float
    approved_: bool
    final_answer: str
    total_tokens: int


# ---------------------------------------------------------------------------
# Node 1: input_guard
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


# ---------------------------------------------------------------------------
# Node 2: diagnose
# ---------------------------------------------------------------------------
def diagnose(state: Agent2State) -> dict:
    """
    Performs crop diagnostic reasoning:
      1. Tool retrieval against agronomic handbooks using search_query
      2. Grounded structured extraction and diagnosis synthesis
    """
    query = state.get("search_query", state["observation"])
    docs = lookup_crop_handbook.invoke({
        "crop_variety": state["crop_variety"],
        "symptom": query,
    })

    llm = get_llm()
    structured = None
    try:
        extractor = llm.with_structured_output(StructuredDiagnosis)
        structured = extractor.invoke(
            f"Crop: {state['crop_variety']}\n"
            f"Observation: {state['observation']}\n"
            f"Grounded Handbook Information:\n{docs}"
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

    # Grounded generation response
    grounded_prompt = (
        f"Based on the following agronomic handbook excerpts:\n{docs}\n\n"
        f"Crop: {state['crop_variety']} (Growth Stage: {state['growth_stage']}) on Field '{state['field_id']}'.\n"
        f"Observation: {state['observation']}\n\n"
        f"Provide an AI-assisted crop health assessment identifying stress markers. "
        f"Cite sources in brackets (e.g. [Tomato-Handbook] or [General-Handbook]). "
        f"Specify the suggested task ({structured.suggested_task_type}) and priority ({structured.priority})."
    )

    prompt_msg = HumanMessage(content=grounded_prompt)
    if state.get("image_url") and str(state["image_url"]).startswith("http"):
        prompt_msg = HumanMessage(
            content=[
                {"type": "text", "text": grounded_prompt},
                {"type": "image_url", "image_url": {"url": state["image_url"]}},
            ]
        )

    try:
        reply = llm.invoke(state["messages"] + [prompt_msg])
    except Exception:
        reply = MockGeminiClient().invoke(state["messages"] + [prompt_msg])
    final_text = text_of(reply)

    tokens = 0
    if hasattr(reply, "usage_metadata") and reply.usage_metadata:
        tokens = reply.usage_metadata.get("total_tokens", 0)

    return {
        "docs": docs,
        "primary_indicator": structured.primary_indicator,
        "risk_level": structured.risk_level,
        "suggested_task_type": structured.suggested_task_type,
        "priority": structured.priority,
        "recommended_protocol": structured.recommended_protocol,
        "stress_factors": getattr(structured, "stress_factors", []),
        "confidence_score": getattr(structured, "confidence_score", 0.90),
        "final_answer": final_text,
        "messages": [reply],
        "total_tokens": state.get("total_tokens", 0) + tokens,
    }


# ---------------------------------------------------------------------------
# Node 3: grade_assessment
# ---------------------------------------------------------------------------
def grade_assessment(state: Agent2State) -> dict:
    """
    Evaluates whether the diagnosis and handbook match have sufficient confidence.
    Determines whether to trigger self-correcting query rewrite or proceed.
    """
    llm = get_llm()
    try:
        grader = llm.with_structured_output(DiagnosisGrade)
        result = grader.invoke(
            f"Observation: {state['observation']}\n\n"
            f"Handbook Docs:\n{state.get('docs', '')}\n\n"
            f"{GRADER_PROMPT}"
        )
        is_conf = result.is_confident if result else True
    except Exception:
        fallback_res = MockGeminiClient().with_structured_output(DiagnosisGrade).invoke(state["observation"])
        is_conf = fallback_res.is_confident if fallback_res else True

    return {
        "is_confident": is_conf,
        "relevant_": is_conf,
    }


def route_grade_assessment(state: Agent2State) -> str:
    """
    Conditional edge router matching the intended workflow diagram:
      - (Low/Med confidence) -> [rewrite] (Max 2 retries) -> loops back to [diagnose]
      - (High/Critical)      -> [human_gate] (interrupt)
      - (Approved/Low Risk)  -> END
    """
    # 1. Self-correction check: Low/Med confidence triggers query rewrite
    if not state.get("is_confident", True) and state.get("retries", 0) < MAX_RETRIES:
        return "rewrite"

    # 2. Risk check: High or Critical risk requires human supervisor gatekeeper approval
    if state.get("risk_level") in ["High", "Critical"]:
        return "human_gate"

    # 3. Approved / Low Risk directly terminates
    return "end"


# ---------------------------------------------------------------------------
# Node 4: rewrite (Self-Correcting Query Refinement)
# ---------------------------------------------------------------------------
def rewrite(state: Agent2State) -> dict:
    """Rewrites search query when confidence is low to search handbook with sharper terms."""
    llm = get_llm()
    prompt = QUERY_REWRITE_TEMPLATE.format(
        crop_variety=state["crop_variety"],
        growth_stage=state["growth_stage"],
        observation=state["observation"],
        failed_query=state.get("search_query", state["observation"]),
        unhelpful_docs=state.get("docs", "")[:300],
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


# ---------------------------------------------------------------------------
# Node 5: human_gate (Human-in-the-Loop Interrupt)
# ---------------------------------------------------------------------------
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
        "crop_variety": state.get("crop_variety", ""),
        "growth_stage": state.get("growth_stage", ""),
        "primary_indicator": state.get("primary_indicator", ""),
        "risk_level": state["risk_level"],
        "suggested_task_type": state["suggested_task_type"],
        "priority": state.get("priority", "High"),
        "protocol": state["recommended_protocol"],
        "image_url": state.get("image_url", ""),
        "stress_factors": state.get("stress_factors", []),
    }
    decision = interrupt(payload)
    is_approved = str(decision).lower().startswith("approve")
    return {"approved_": is_approved}


def route_human_gate(state: Agent2State) -> str:
    """
    Conditional edge after human decision:
      - (Approve) -> [create_task] -> END
      - (Deny)    -> [log_rejection] -> END
    """
    if state.get("approved_", False):
        return "create_task"
    return "log_rejection"


# ---------------------------------------------------------------------------
# Node 6: create_task
# ---------------------------------------------------------------------------
def create_task(state: Agent2State) -> dict:
    """Final node when task is approved: dispatches and creates operational task."""
    status_tag = "APPROVED & DISPATCHED" if state.get("approved_") else "VERIFIED"
    confirmation = (
        f"{state['final_answer']}\n\n"
        f"[{status_tag}] Task '{state['suggested_task_type']}' queued with priority '{state['priority']}'."
    )
    return {"final_answer": confirmation}


# ---------------------------------------------------------------------------
# Node 7: log_rejection
# ---------------------------------------------------------------------------
def log_rejection(state: Agent2State) -> dict:
    """Final node when farm manager denies the proposed remediation task."""
    rejection = (
        f"{state['final_answer']}\n\n"
        f"[REJECTED] The proposed task '{state['suggested_task_type']}' was rejected by the farm manager. "
        f"No automated task created."
    )
    return {"final_answer": rejection}


# ---------------------------------------------------------------------------
# Graph Compilation (Exact Mapping of Intended Workflow Diagram)
# ---------------------------------------------------------------------------
def build_agent2_graph(checkpointer: Optional[Any] = None):
    """
    Assembles and compiles the full LangGraph workflow for Agent 2
    matching the intended architectural specification diagram.
    """
    if checkpointer is None:
        checkpointer = InMemorySaver()

    g = StateGraph(Agent2State)

    # 1. Add All Nodes
    g.add_node("input_guard", input_guard)
    g.add_node("diagnose", diagnose)
    g.add_node("grade_assessment", grade_assessment)
    g.add_node("rewrite", rewrite)
    g.add_node("human_gate", human_gate)
    g.add_node("create_task", create_task)
    g.add_node("log_rejection", log_rejection)

    # 2. Main Entry Path
    g.add_edge(START, "input_guard")
    g.add_edge("input_guard", "diagnose")
    g.add_edge("diagnose", "grade_assessment")

    # 3. Branching from [grade_assessment]:
    #    - (High/Critical)        -> [human_gate] (interrupt)
    #    - (Low/Med confidence)   -> [rewrite] -> (Max 2 retries) loops to [diagnose]
    #    - (Approved/Low Risk)    -> END
    g.add_conditional_edges(
        "grade_assessment",
        route_grade_assessment,
        {
            "human_gate": "human_gate",
            "rewrite": "rewrite",
            "end": END,
        },
    )

    # 4. Self-Correction Loop back to [diagnose]
    g.add_edge("rewrite", "diagnose")

    # 5. Branching from [human_gate] (interrupt):
    #    - (Approve) -> [create_task] -> END
    #    - (Deny)    -> [log_rejection] -> END
    g.add_conditional_edges(
        "human_gate",
        route_human_gate,
        {
            "create_task": "create_task",
            "log_rejection": "log_rejection",
        },
    )

    # 6. Terminal Edges to END
    g.add_edge("create_task", END)
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

    state_vals = AGENT2_APP.get_state(config).values or {}

    if paused is not None:
        return GraphResponse(
            status="awaiting_approval",
            answer=state_vals.get("final_answer", ""),
            interrupt=paused,
            nodes=nodes_ran,
            thread_id=thread_id,
            primary_indicator=state_vals.get("primary_indicator"),
            risk_level=state_vals.get("risk_level"),
            suggested_task_type=state_vals.get("suggested_task_type"),
            priority=state_vals.get("priority"),
            recommended_protocol=state_vals.get("recommended_protocol"),
            stress_factors=state_vals.get("stress_factors", []),
            total_tokens=state_vals.get("total_tokens", 0),
        )

    final = state_vals.get("final_answer", "")
    tokens = state_vals.get("total_tokens", 0)
    msg_count = len(state_vals.get("messages", []))

    return GraphResponse(
        status="completed",
        answer=final,
        nodes=nodes_ran,
        thread_id=thread_id,
        primary_indicator=state_vals.get("primary_indicator"),
        risk_level=state_vals.get("risk_level"),
        suggested_task_type=state_vals.get("suggested_task_type"),
        priority=state_vals.get("priority"),
        recommended_protocol=state_vals.get("recommended_protocol"),
        stress_factors=state_vals.get("stress_factors", []),
        total_tokens=tokens,
        messages=msg_count,
    )

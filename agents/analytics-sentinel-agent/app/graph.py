"""LangGraph graph construction for Agent 4."""

from langgraph.graph import StateGraph, END
from app.state import SentinelState
from app.nodes import SentinelNodes


def build_graph(settings, backend, checkpointer, model=None):
    nodes = SentinelNodes(settings, backend, model)
    builder = StateGraph(SentinelState)

    builder.add_node("fetch_data", nodes.fetch_data)
    builder.add_node("analyze_metrics", nodes.analyze_metrics)
    builder.add_node("generate_strategic_insight", nodes.generate_strategic_insight)
    builder.add_node("human_approval_gate", nodes.human_approval_gate)
    builder.add_node("apply_intervention", nodes.apply_intervention)

    builder.set_entry_point("fetch_data")
    builder.add_edge("fetch_data", "analyze_metrics")
    builder.add_edge("analyze_metrics", "generate_strategic_insight")

    def route_after_insight(state: SentinelState):
        if state.get("requires_human_approval"):
            return "human_approval_gate"
        return END

    builder.add_conditional_edges(
        "generate_strategic_insight",
        route_after_insight,
        {
            "human_approval_gate": "human_approval_gate",
            END: END,
        },
    )

    builder.add_edge("human_approval_gate", "apply_intervention")
    builder.add_edge("apply_intervention", END)

    return builder.compile(checkpointer=checkpointer)

from langgraph.graph import END, START, StateGraph

from app.nodes import InventoryNodes
from app.state import InventoryState


def build_graph(settings, backend, checkpointer, model=None):
    nodes = InventoryNodes(settings, backend, model)
    graph = StateGraph(InventoryState)
    for name in ("read_inventory", "calculate_need", "choose_supplier", "validate_proposal",
                 "submit_proposal", "request_approval", "observe_decision"):
        graph.add_node(name, getattr(nodes, name))
    graph.add_edge(START, "read_inventory")
    graph.add_conditional_edges("read_inventory", lambda s: "calculate" if s["status"] == "analyzing" else "end",
                                {"calculate": "calculate_need", "end": END})
    graph.add_conditional_edges("calculate_need", lambda s: "model" if s["status"] == "model_needed" else "end",
                                {"model": "choose_supplier", "end": END})
    graph.add_edge("choose_supplier", "validate_proposal")
    graph.add_conditional_edges("validate_proposal", lambda s: s["status"],
        {"retry_model": "choose_supplier", "failed": END, "ready_to_submit": "submit_proposal"})
    graph.add_conditional_edges("submit_proposal", lambda s: "review" if s["status"] == "awaiting_approval" else "end",
                                {"review": "request_approval", "end": END})
    graph.add_edge("request_approval", "observe_decision")
    graph.add_edge("observe_decision", END)
    return graph.compile(checkpointer=checkpointer)

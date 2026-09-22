from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from app.state import PlanningState
from app import nodes


def build_graph():
    graph = StateGraph(PlanningState)

    graph.add_node("check_weather", nodes.check_weather)
    graph.add_node("analyze_crop_stage", nodes.analyze_crop_stage)
    graph.add_node("check_soil_information", nodes.check_soil_information)
    graph.add_node("review_previous_activities", nodes.review_previous_activities)
    graph.add_node("determine_required_tasks", nodes.determine_required_tasks)
    graph.add_node("check_resource_availability", nodes.check_resource_availability)
    graph.add_node("create_recommended_schedule", nodes.create_recommended_schedule)
    graph.add_node("request_approval", nodes.request_approval)

    graph.set_entry_point("check_weather")
    graph.add_edge("check_weather", "analyze_crop_stage")
    graph.add_edge("analyze_crop_stage", "check_soil_information")
    graph.add_edge("check_soil_information", "review_previous_activities")
    graph.add_edge("review_previous_activities", "determine_required_tasks")
    graph.add_edge("determine_required_tasks", "check_resource_availability")
    graph.add_edge("check_resource_availability", "create_recommended_schedule")
    graph.add_edge("create_recommended_schedule", "request_approval")
    graph.add_edge("request_approval", END)

    checkpointer = MemorySaver()
    return graph.compile(checkpointer=checkpointer)


planning_graph = build_graph()
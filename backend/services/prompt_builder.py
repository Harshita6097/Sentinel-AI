"""Prompt Builder — converts COP state into structured LLM prompts.

Every prompt explicitly grounds the LLM in COP values so it cannot
invent operational facts. The LLM's only job is to narrate what the
data already says.
"""
from services.cop_manager import CommonOperatingPicture

_SYSTEM = (
    "You are a disaster-response AI assistant for the Sentinel AI system. "
    "Your role is to narrate and explain — never to invent facts. "
    "Every statement you make must be directly supported by the structured data provided. "
    "Be concise, professional, and use plain English suitable for emergency coordinators."
)


def _cop_summary(cop: CommonOperatingPicture) -> str:
    """Render COP as a compact JSON-like block for prompt injection."""
    incidents = [
        f"  - [{i.severity_label}] {i.incident_type} at {i.location}"
        + (f" ({i.people_count} people)" if i.people_count else "")
        for i in cop.incidents
    ]
    closures = [f"  - {c.road_name} ({c.location})" for c in cop.road_closures]
    resources = [f"  - {r.id} ({r.type}): {r.status}" for r in cop.resources]
    routes = [
        f"  - {r.resource_id} → {r.destination} [{r.status}, ETA {r.eta_minutes:.0f}min]"
        for r in cop.routes
    ]

    lines = [
        f"Simulation time: {cop.sim_time}",
        f"Priority zone: {cop.priority_zone or 'undetermined'} (score {cop.priority_score:.0f})",
        f"Weather: {cop.weather.condition}, alert={cop.weather.alert_level}, rainfall={cop.weather.rainfall_mm_hr:.0f}mm/hr",
        f"Flood: detected={cop.flood.detected}, coverage={cop.flood.coverage_percent}%, risk={cop.flood.risk_level}, depth={cop.flood.water_depth}",
        "Active incidents:" + ("\n" + "\n".join(incidents) if incidents else " none"),
        "Road closures:" + ("\n" + "\n".join(closures) if closures else " none"),
        "Resources:" + ("\n" + "\n".join(resources) if resources else " none"),
        "Active routes:" + ("\n" + "\n".join(routes) if routes else " none"),
    ]
    return "\n".join(lines)


def build_sitrep_prompt(cop: CommonOperatingPicture, recommendations: list[dict]) -> tuple[str, str]:
    """Return (system, prompt) for a Situation Report."""
    top_recs = "\n".join(
        f"  {i+1}. {r['recommended_action']} — {r['reason']}"
        for i, r in enumerate(recommendations[:3])
    )
    prompt = (
        f"CURRENT OPERATIONAL DATA:\n{_cop_summary(cop)}\n\n"
        f"COMMANDER RECOMMENDATIONS:\n{top_recs or '  None yet'}\n\n"
        "Write a concise Situation Report (SITREP) in 3–5 sentences covering: "
        "current threat level, highest-priority zone, active incidents, resource status, "
        "and immediate recommended actions. Reference specific values from the data above."
    )
    return _SYSTEM, prompt


def build_explain_prompt(cop: CommonOperatingPicture, recommendation: dict) -> tuple[str, str]:
    """Return (system, prompt) to explain a single Commander recommendation."""
    prompt = (
        f"CURRENT OPERATIONAL DATA:\n{_cop_summary(cop)}\n\n"
        f"COMMANDER DECISION:\n"
        f"  Action: {recommendation.get('recommended_action', 'N/A')}\n"
        f"  Location: {recommendation.get('location', 'N/A')}\n"
        f"  Priority score: {recommendation.get('priority_score', 0):.0f}\n"
        f"  Reason: {recommendation.get('reason', 'N/A')}\n"
        f"  Factors: {', '.join(recommendation.get('factor_breakdown', []))}\n\n"
        "Explain in 2–3 sentences why this is the highest-priority action right now. "
        "Reference specific COP values (incident severity, road closures, resource availability, weather). "
        "Do not add information not present in the data above."
    )
    return _SYSTEM, prompt


def build_handover_prompt(cop: CommonOperatingPicture, recommendations: list[dict]) -> tuple[str, str]:
    """Return (system, prompt) for a Shift Handover briefing."""
    top_recs = "\n".join(
        f"  {i+1}. {r['recommended_action']}"
        for i, r in enumerate(recommendations[:3])
    )
    prompt = (
        f"CURRENT OPERATIONAL DATA:\n{_cop_summary(cop)}\n\n"
        f"PENDING ACTIONS:\n{top_recs or '  None'}\n\n"
        "Write a shift handover briefing for the incoming team in 4–6 sentences. "
        "Cover: current situation, active threats, resource deployment status, "
        "pending actions, and any critical watch items. "
        "Be specific — use the data values provided."
    )
    return _SYSTEM, prompt


def build_report_prompt(cop: CommonOperatingPicture, recommendations: list[dict]) -> tuple[str, str]:
    """Return (system, prompt) for an After Action Report."""
    prompt = (
        f"OPERATIONAL DATA AT REPORT TIME:\n{_cop_summary(cop)}\n\n"
        f"ACTIONS TAKEN:\n"
        + "\n".join(f"  - {r['recommended_action']}" for r in recommendations[:5])
        + "\n\nWrite a brief After Action Report (AAR) covering: "
        "what happened, what resources were deployed, what challenges were encountered "
        "(road closures, weather, flood severity), and what worked well. "
        "Keep it to 5–7 sentences. Use only the data provided."
    )
    return _SYSTEM, prompt


def build_incident_summary_prompt(cop: CommonOperatingPicture) -> tuple[str, str]:
    """Return (system, prompt) for an incident summary."""
    prompt = (
        f"CURRENT OPERATIONAL DATA:\n{_cop_summary(cop)}\n\n"
        "Summarise all active incidents in 3–4 sentences. "
        "Group by severity. Note which locations are most affected and why. "
        "Reference specific incident types, people counts, and facility names from the data."
    )
    return _SYSTEM, prompt

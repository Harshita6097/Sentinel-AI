"""Commander Agent — the central decision-making engine.

The Commander:
  1. Reads the Common Operating Picture (never raw agent outputs)
  2. Fuses evidence from all agent sources
  3. Ranks rescue zones by priority score
  4. Generates explainable recommendations
  5. Computes confidence breakdown
  6. Appends to the decision log

The Commander never calls other agents directly.
All data flows through the COP.
"""
from dataclasses import dataclass, field
from datetime import datetime

from services.cop_manager import get_cop, CommonOperatingPicture
from services.priority_engine import rank_all_locations, PriorityResult
from services.evidence_fusion import fuse, FusedEvidence
from services.confidence_fusion import compute_confidence, measure_cop_completeness, ConfidenceBreakdown
from services.explanation_service import build_explanation, build_factor_explanation


@dataclass
class Recommendation:
    rank: int
    location: str
    priority_score: float
    recommended_action: str
    resource_id: str | None
    reason: str
    factor_breakdown: list[str]
    confidence: int
    evidence_sources: list[dict]
    incident_ids: list[str]


@dataclass
class CommanderDecision:
    time: str
    recommendations: list[Recommendation]
    confidence_breakdown: dict
    log_entry: dict
    cop_snapshot: dict


class CommanderAgent:
    """
    Stateless Commander Agent.

    Call .decide() to run a full decision cycle against the current COP.
    The decision log is maintained in-memory and accessible via .get_log().
    """

    def __init__(self) -> None:
        self._log: list[dict] = []

    def decide(self) -> CommanderDecision:
        """
        Execute one Commander decision cycle.

        Returns:
            CommanderDecision with ranked recommendations, confidence, and log entry.
        """
        cop  = get_cop()
        time = cop.sim_time or datetime.now().strftime("%H:%M")

        # 1. Rank all locations by priority
        ranked: list[PriorityResult] = rank_all_locations(cop)

        # 2. Fuse evidence confidence from all agent sources
        source_confidences = self._collect_source_confidences(cop)
        fused: FusedEvidence = fuse(source_confidences)

        # 3. Compute overall confidence
        completeness = measure_cop_completeness(cop)
        conf_breakdown: ConfidenceBreakdown = compute_confidence(fused, ranked, completeness)

        # 4. Build recommendations (top 3 zones)
        recommendations: list[Recommendation] = []
        for priority in ranked[:3]:
            resource = self._select_resource(priority.location, cop)
            reason   = build_explanation(priority.location, priority, resource, cop)
            factors  = build_factor_explanation(priority)
            rec = Recommendation(
                rank=priority.rank,
                location=priority.location,
                priority_score=priority.score,
                recommended_action=self._action_label(priority, resource),
                resource_id=resource,
                reason=reason,
                factor_breakdown=factors,
                confidence=conf_breakdown.overall,
                evidence_sources=[
                    {"source": s.name, "confidence": s.confidence, "weight": s.weight}
                    for s in fused.sources
                ],
                incident_ids=priority.incident_ids,
            )
            recommendations.append(rec)

        # 5. Update COP priority zone
        if ranked:
            cop.priority_zone  = ranked[0].location
            cop.priority_score = ranked[0].score

        # 6. Build and store log entry
        log_entry = {
            "time": time,
            "action": recommendations[0].recommended_action if recommendations else "No action",
            "location": ranked[0].location if ranked else "",
            "reason": recommendations[0].reason if recommendations else "Insufficient data",
            "confidence": conf_breakdown.overall,
            "priority_score": ranked[0].score if ranked else 0.0,
        }
        self._log.insert(0, log_entry)   # newest first

        return CommanderDecision(
            time=time,
            recommendations=recommendations,
            confidence_breakdown={
                "evidence_confidence": conf_breakdown.evidence_confidence,
                "priority_certainty":  conf_breakdown.priority_certainty,
                "data_completeness":   conf_breakdown.data_completeness,
                "overall":             conf_breakdown.overall,
            },
            log_entry=log_entry,
            cop_snapshot=cop.to_dict(),
        )

    def get_log(self) -> list[dict]:
        return self._log

    def reset(self) -> None:
        self._log.clear()

    # ── internals ────────────────────────────────────────────────────────────

    @staticmethod
    def _collect_source_confidences(cop: CommonOperatingPicture) -> dict[str, int]:
        """Extract per-source confidence from COP data."""
        confidences: dict[str, int] = {}

        # Emergency: average confidence of active incidents
        if cop.incidents:
            confidences["emergency"] = int(
                sum(i.confidence for i in cop.incidents) / len(cop.incidents)
            )

        # Logistics: 100 if routes exist, 80 if only resources
        if cop.routes:
            confidences["logistics"] = 100
        elif cop.resources:
            confidences["logistics"] = 80

        # Vision: based on flood detection
        if cop.flood.source == "vision":
            confidences["vision"] = 94
        elif cop.flood.detected:
            confidences["vision"] = 70   # from simulation events

        # Weather: fixed mock confidence
        if cop.weather.alert_level != "Green":
            confidences["weather"] = 88

        return confidences

    @staticmethod
    def _select_resource(location: str, cop: CommonOperatingPicture) -> str | None:
        """Pick the best available resource for a location."""
        # Prefer already-assigned resources heading to this location
        for route in cop.routes:
            if route.destination == location and route.status in ("Active", "Rerouted"):
                return route.resource_id

        # Otherwise pick nearest available
        available = [r for r in cop.resources if r.status == "Available"]
        if not available:
            return None

        # Prefer boats for flood zones, ambulances for hospitals
        incidents = [i for i in cop.incidents if i.location == location]
        needs_boat = any(i.incident_type == "flood" for i in incidents)
        needs_ambulance = any(
            "hospital" in (i.facility or "").lower() for i in incidents
        )

        if needs_boat:
            boats = [r for r in available if r.type == "Boat"]
            if boats:
                return boats[0].id
        if needs_ambulance:
            ambs = [r for r in available if r.type == "Ambulance"]
            if ambs:
                return ambs[0].id

        return available[0].id

    @staticmethod
    def _action_label(priority: PriorityResult, resource: str | None) -> str:
        if resource:
            return f"Dispatch {resource} to {priority.location}"
        return f"Prioritise {priority.location} — no resource available"


# Module-level singleton
commander_agent = CommanderAgent()

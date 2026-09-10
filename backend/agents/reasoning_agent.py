"""Reasoning Agent — natural-language narrative layer over Commander output.

This agent consumes structured Commander output and COP state to produce
human-readable explanations, SITREPs, handovers, and reports.

Design rules:
  - Never makes operational decisions (Commander is the source of truth).
  - All LLM prompts are grounded in COP values — no invented facts.
  - Falls back to deterministic templates if Ollama is unavailable.
  - Completely stateless; safe to call from any context.
"""
import logging
from datetime import datetime

from services.cop_manager import get_cop, CommonOperatingPicture
from services.ollama_service import generate, is_available
from services.prompt_builder import (
    build_sitrep_prompt,
    build_explain_prompt,
    build_handover_prompt,
    build_report_prompt,
    build_incident_summary_prompt,
)

logger = logging.getLogger(__name__)


class ReasoningAgent:
    """Stateless reasoning agent powered by a local Ollama LLM."""

    # ── public API ────────────────────────────────────────────────────────────

    def generate_sitrep(self, recommendations: list[dict]) -> dict:
        """Generate a Situation Report from current COP + Commander recommendations."""
        cop = get_cop()
        text = self._llm_or_fallback(
            *build_sitrep_prompt(cop, recommendations),
            fallback=self._fallback_sitrep(cop, recommendations),
        )
        return {"type": "sitrep", "text": text, "generated_at": _now(), "llm_used": self._llm_active()}

    def explain_decision(self, recommendation: dict) -> dict:
        """Explain a single Commander recommendation in plain English."""
        cop = get_cop()
        text = self._llm_or_fallback(
            *build_explain_prompt(cop, recommendation),
            fallback=self._fallback_explain(recommendation),
        )
        return {"type": "explanation", "text": text, "generated_at": _now(), "llm_used": self._llm_active()}

    def summarize_incidents(self) -> dict:
        """Summarise all active incidents from COP."""
        cop = get_cop()
        text = self._llm_or_fallback(
            *build_incident_summary_prompt(cop),
            fallback=self._fallback_incidents(cop),
        )
        return {"type": "incident_summary", "text": text, "generated_at": _now(), "llm_used": self._llm_active()}

    def generate_handover(self, recommendations: list[dict]) -> dict:
        """Generate a shift handover briefing."""
        cop = get_cop()
        text = self._llm_or_fallback(
            *build_handover_prompt(cop, recommendations),
            fallback=self._fallback_handover(cop, recommendations),
        )
        return {"type": "handover", "text": text, "generated_at": _now(), "llm_used": self._llm_active()}

    def generate_after_action_report(self, recommendations: list[dict]) -> dict:
        """Generate an After Action Report."""
        cop = get_cop()
        text = self._llm_or_fallback(
            *build_report_prompt(cop, recommendations),
            fallback=self._fallback_aar(cop, recommendations),
        )
        return {"type": "after_action_report", "text": text, "generated_at": _now(), "llm_used": self._llm_active()}

    # ── internals ─────────────────────────────────────────────────────────────

    @staticmethod
    def _llm_active() -> bool:
        return is_available()

    @staticmethod
    def _llm_or_fallback(system: str, prompt: str, fallback: str) -> str:
        result = generate(prompt, system)
        if result:
            return result
        logger.info("Ollama unavailable — using deterministic fallback")
        return fallback

    # ── deterministic fallbacks ───────────────────────────────────────────────

    @staticmethod
    def _fallback_sitrep(cop: CommonOperatingPicture, recommendations: list[dict]) -> str:
        zone   = cop.priority_zone or "undetermined"
        score  = cop.priority_score
        n_inc  = len(cop.incidents)
        n_crit = sum(1 for i in cop.incidents if i.severity_label == "Critical")
        action = recommendations[0]["recommended_action"] if recommendations else "No action computed"
        weather = f"{cop.weather.condition} ({cop.weather.alert_level} alert)"
        flood   = f"{cop.flood.coverage_percent}% coverage, {cop.flood.risk_level} risk" if cop.flood.detected else "no active flood detection"

        return (
            f"SITREP — {cop.sim_time}: Priority zone is {zone} (score {score:.0f}). "
            f"{n_inc} active incident(s) recorded, {n_crit} critical. "
            f"Weather: {weather}. Flood status: {flood}. "
            f"Immediate action: {action}."
        )

    @staticmethod
    def _fallback_explain(rec: dict) -> str:
        return (
            f"{rec.get('location', 'This zone')} is the highest-priority target "
            f"(score {rec.get('priority_score', 0):.0f}) because: {rec.get('reason', 'see COP data')}. "
            f"Recommended action: {rec.get('recommended_action', 'N/A')}."
        )

    @staticmethod
    def _fallback_incidents(cop: CommonOperatingPicture) -> str:
        if not cop.incidents:
            return "No active incidents recorded in the COP at this time."
        by_sev = {}
        for i in cop.incidents:
            by_sev.setdefault(i.severity_label, []).append(i)
        parts = []
        for sev in ("Critical", "High", "Medium", "Low"):
            grp = by_sev.get(sev, [])
            if grp:
                locs = ", ".join(set(i.location for i in grp))
                parts.append(f"{len(grp)} {sev.lower()} incident(s) at {locs}")
        return f"Active incidents: {'; '.join(parts)}."

    @staticmethod
    def _fallback_handover(cop: CommonOperatingPicture, recommendations: list[dict]) -> str:
        zone    = cop.priority_zone or "undetermined"
        n_avail = sum(1 for r in cop.resources if r.status == "Available")
        n_close = len(cop.road_closures)
        actions = "; ".join(r["recommended_action"] for r in recommendations[:3]) or "none"
        return (
            f"Handover — {cop.sim_time}: Situation remains active in {zone}. "
            f"{len(cop.incidents)} open incident(s). "
            f"{n_avail} resource(s) available, {n_close} road closure(s) in effect. "
            f"Pending actions: {actions}. "
            f"Weather alert: {cop.weather.alert_level}. Monitor flood progression."
        )

    @staticmethod
    def _fallback_aar(cop: CommonOperatingPicture, recommendations: list[dict]) -> str:
        actions = "; ".join(r["recommended_action"] for r in recommendations[:5]) or "none recorded"
        return (
            f"After Action Report — {cop.sim_time}: Response operations addressed "
            f"{len(cop.incidents)} incident(s) across the Kerala flood zone. "
            f"Actions taken: {actions}. "
            f"Road closures ({len(cop.road_closures)}) and "
            f"{cop.weather.alert_level} weather alert impacted logistics. "
            f"Flood coverage reached {cop.flood.coverage_percent}% at peak. "
            f"Review resource pre-positioning for future events."
        )


def _now() -> str:
    return datetime.now().strftime("%H:%M:%S")


# Module-level singleton
reasoning_agent = ReasoningAgent()

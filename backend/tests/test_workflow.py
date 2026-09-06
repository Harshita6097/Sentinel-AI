"""End-to-end workflow tests — full LangGraph pipeline."""
import pytest


def test_full_workflow_no_errors():
    """Run the complete LangGraph pipeline and verify no errors."""
    from graph.workflow import run_workflow
    result = run_workflow(sim_minutes=660, sim_time="11:00")
    assert result.get("errors", []) == []
    assert result.get("simulation_done") is True
    assert result.get("weather_done") is True
    assert result.get("emergency_done") is True
    assert result.get("logistics_done") is True
    assert result.get("commander_done") is True


def test_workflow_with_incident():
    """Workflow produces recommendations when an incident exists."""
    from services import incident_store
    from agents.emergency_agent import emergency_agent
    from graph.workflow import run_workflow

    emergency_agent.process(
        "Critical flooding at Alappuzha Medical Center. 80 patients trapped. SOS.",
        source="test",
    )
    result = run_workflow(sim_minutes=660, sim_time="11:00")
    assert result.get("errors", []) == []
    recs = result.get("recommendations", [])
    assert len(recs) >= 1
    assert recs[0]["location"] == "Alappuzha"


def test_workflow_cop_updated():
    """COP weather is populated after workflow run."""
    from graph.workflow import run_workflow
    from services.cop_manager import get_cop

    run_workflow(sim_minutes=750, sim_time="12:30")
    cop = get_cop()
    # Weather should be updated to Red alert at sim_minutes=750
    assert cop.weather.alert_level in ("Orange", "Red")
    # COP update_count should be > 0 after workflow
    assert cop.update_count > 0


def test_workflow_weather_escalation():
    """Weather agent escalates correctly at different sim times."""
    from agents.weather_agent import weather_agent

    f_early = weather_agent._sim_forecast(540)
    assert f_early.alert_level == "Orange"

    f_late = weather_agent._sim_forecast(660)
    assert f_late.alert_level == "Red"
    assert f_late.rainfall_mm_hr > f_early.rainfall_mm_hr


def test_simulation_events_trigger_logistics():
    """Road blocked event propagates to logistics agent."""
    from simulation import engine
    from agents.logistics_agent import logistics_agent

    # Advance to event 3 (road_blocked at Alappuzha, t=600)
    state = engine.get_state() if hasattr(engine, "get_state") else None
    from simulation.state_manager import get_state
    sim_state = get_state()
    sim_state.current_minutes = 600
    from simulation.engine import _fire_due_events
    _fire_due_events(sim_state)

    closures = logistics_agent.closure_manager.list_closures()
    assert any(c.edge_id == "R3" for c in closures)

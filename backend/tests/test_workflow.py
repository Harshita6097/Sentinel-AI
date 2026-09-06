"""End-to-end workflow tests — full LangGraph pipeline."""


def test_full_workflow_no_errors():
    from graph.workflow import run_workflow
    result = run_workflow(sim_minutes=660, sim_time="11:00")
    assert result.get("errors", []) == []
    assert all(result.get(k) is True for k in (
        "simulation_done", "weather_done", "emergency_done", "logistics_done", "commander_done"
    ))


def test_workflow_with_incident():
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


def test_workflow_cop_weather_updated():
    from graph.workflow import run_workflow
    from services.cop_manager import get_cop
    run_workflow(sim_minutes=750, sim_time="12:30")
    cop = get_cop()
    assert cop.weather.alert_level in ("Orange", "Red")
    assert cop.update_count > 0


def test_workflow_weather_escalation():
    from agents.weather_agent import WeatherAgent
    assert WeatherAgent._sim_forecast(540).alert_level == "Orange"
    f_late = WeatherAgent._sim_forecast(660)
    assert f_late.alert_level == "Red"
    assert f_late.rainfall_mm_hr > 8.0


def test_simulation_events_trigger_logistics():
    from simulation.state_manager import get_state
    from simulation.engine import _fire_due_events
    from agents.logistics_agent import logistics_agent
    sim_state = get_state()
    sim_state.current_minutes = 600
    _fire_due_events(sim_state)
    assert any(c.edge_id == "R3" for c in logistics_agent.closure_manager.list_closures())

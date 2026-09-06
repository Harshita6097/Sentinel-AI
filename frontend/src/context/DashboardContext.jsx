/**
 * DashboardContext — unified state hub for the Sentinel AI dashboard.
 *
 * Polls three aggregation endpoints and exposes all data through a
 * single context. Components read from here instead of making their
 * own API calls, eliminating duplicated polling and state.
 *
 * Poll intervals:
 *   - /api/dashboard/state  → 2s  (sim clock, COP, resources, routes)
 *   - /api/dashboard/events → 3s  (activity feed)
 *   - /api/dashboard/alerts → 3s  (alert center)
 *   - /api/map/locations    → once on mount (static)
 */
import {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from 'react'
import { api } from '../services/api'

const DashboardCtx = createContext(null)

const DEFAULT_STATE = {
  sim:           { time: '09:00', current_minutes: 540, paused: true, finished: false, speed: 1, progress: 0, active_events: [], location_overrides: {} },
  cop:           null,
  resources:     [],
  routes:        [],
  road_closures: [],
  network:       null,
}

export function DashboardProvider({ children }) {
  const [state,     setState]     = useState(DEFAULT_STATE)
  const [events,    setEvents]    = useState([])
  const [alerts,    setAlerts]    = useState([])
  const [locations, setLocations] = useState([])
  const [connected, setConnected] = useState(false)

  // Notifications: alerts that have fired but not yet been dismissed
  const [toasts, setToasts]       = useState([])
  const seenAlertIds              = useRef(new Set())

  // Commander state (polled separately — heavier)
  const [recommendations, setRecommendations] = useState([])
  const [decisionLog,     setDecisionLog]     = useState([])
  const [recomputing,     setRecomputing]     = useState(false)

  // ── polling ──────────────────────────────────────────────────────────────

  const fetchState = useCallback(() => {
    api.getDashboardState()
      .then(d => { setState(d); setConnected(true) })
      .catch(() => setConnected(false))
  }, [])

  const fetchEvents = useCallback(() => {
    api.getDashboardEvents().then(setEvents).catch(() => {})
  }, [])

  const fetchAlerts = useCallback(() => {
    api.getDashboardAlerts().then(incoming => {
      setAlerts(incoming)
      // Fire toasts for new alerts
      incoming.forEach(alert => {
        if (!seenAlertIds.current.has(alert.id)) {
          seenAlertIds.current.add(alert.id)
          setToasts(prev => [
            { ...alert, toastId: `${alert.id}-${Date.now()}` },
            ...prev.slice(0, 4),   // keep max 5 toasts
          ])
        }
      })
    }).catch(() => {})
  }, [])

  const fetchCommander = useCallback(() => {
    api.getRecommendations().then(setRecommendations).catch(() => {})
    api.getDecisionLog().then(setDecisionLog).catch(() => {})
  }, [])

  useEffect(() => {
    // Static data — fetch once
    api.getLocations().then(setLocations).catch(() => {})

    // Initial fetch
    fetchState(); fetchEvents(); fetchAlerts(); fetchCommander()

    const t1 = setInterval(fetchState,    2000)
    const t2 = setInterval(fetchEvents,   3000)
    const t3 = setInterval(fetchAlerts,   3000)
    const t4 = setInterval(fetchCommander, 5000)

    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); clearInterval(t4) }
  }, [fetchState, fetchEvents, fetchAlerts, fetchCommander])

  // ── simulation controls (delegate to existing sim API) ───────────────────

  const play     = useCallback(() => api.simPlay().then(s => setState(prev => ({ ...prev, sim: _simFromState(s) }))).catch(() => {}), [])
  const pause    = useCallback(() => api.simPause().then(s => setState(prev => ({ ...prev, sim: _simFromState(s) }))).catch(() => {}), [])
  const reset    = useCallback(() => {
    api.simReset().then(s => {
      setState({ ...DEFAULT_STATE, sim: _simFromState(s) })
      setEvents([]); setAlerts([]); setRecommendations([]); setDecisionLog([])
      seenAlertIds.current.clear()
    }).catch(() => {})
  }, [])
  const step     = useCallback(() => api.simStep().then(s => setState(prev => ({ ...prev, sim: _simFromState(s) }))).catch(() => {}), [])
  const setSpeed = useCallback((sp) => api.simSetSpeed(sp).then(s => setState(prev => ({ ...prev, sim: _simFromState(s) }))).catch(() => {}), [])

  // ── commander recompute ───────────────────────────────────────────────────

  const recompute = useCallback(async () => {
    setRecomputing(true)
    try {
      const result = await api.recompute()
      setRecommendations(result.recommendations ?? [])
      fetchCommander()
      fetchState()
    } catch { /* ignore */ } finally {
      setRecomputing(false)
    }
  }, [fetchCommander, fetchState])

  // ── toast dismissal ───────────────────────────────────────────────────────

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId))
  }, [])

  return (
    <DashboardCtx.Provider value={{
      // Data
      sim:            state.sim,
      cop:            state.cop,
      resources:      state.resources,
      routes:         state.routes,
      road_closures:  state.road_closures,
      network:        state.network,
      locations,
      events,
      alerts,
      toasts,
      recommendations,
      decisionLog,
      // Status
      connected,
      recomputing,
      // Controls
      play, pause, reset, step, setSpeed,
      recompute,
      dismissToast,
    }}>
      {children}
    </DashboardCtx.Provider>
  )
}

export const useDashboard = () => useContext(DashboardCtx)

// Map sim state response shape to our internal shape
function _simFromState(s) {
  return {
    time:               s.time,
    current_minutes:    s.current_minutes,
    paused:             s.paused,
    finished:           s.finished,
    speed:              s.speed,
    progress:           s.progress,
    active_events:      s.active_events ?? [],
    location_overrides: s.location_overrides ?? {},
  }
}

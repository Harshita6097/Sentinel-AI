import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api } from '../services/api'

const SimCtx = createContext(null)

const DEFAULT = {
  time: '09:00', current_minutes: 540, paused: true,
  finished: false, speed: 1, progress: 0,
  active_events: [], location_overrides: {},
}

export function SimulationProvider({ children }) {
  const [sim, setSim] = useState(DEFAULT)
  const [connected, setConnected] = useState(false)
  const timerRef = useRef(null)

  // Stable reference — safe to use inside setInterval
  const refresh = useCallback(() => {
    api.getSimState()
      .then(s => { setSim(s); setConnected(true) })
      .catch(() => setConnected(false))
  }, [])

  useEffect(() => {
    refresh()
    timerRef.current = setInterval(refresh, 1000)
    return () => clearInterval(timerRef.current)
  }, [refresh])

  // Wrap every control: update state on success, ignore stale responses on error
  const wrap = (apiFn) => () =>
    apiFn().then(setSim).catch(() => {/* backend momentarily unavailable */})

  const controls = {
    play:     wrap(api.simPlay),
    pause:    wrap(api.simPause),
    reset:    wrap(api.simReset),
    step:     wrap(api.simStep),
    setSpeed: (s) => api.simSetSpeed(s).then(setSim).catch(() => {}),
  }

  return (
    <SimCtx.Provider value={{ sim, connected, ...controls }}>
      {children}
    </SimCtx.Provider>
  )
}

export const useSim = () => useContext(SimCtx)

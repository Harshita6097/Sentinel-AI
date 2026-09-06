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
  // useCallback ensures stable references so consumers don't re-render unnecessarily
  const play     = useCallback(() => api.simPlay().then(setSim).catch(() => {}), [])
  const pause    = useCallback(() => api.simPause().then(setSim).catch(() => {}), [])
  const reset    = useCallback(() => api.simReset().then(setSim).catch(() => {}), [])
  const step     = useCallback(() => api.simStep().then(setSim).catch(() => {}), [])
  const setSpeed = useCallback((s) => api.simSetSpeed(s).then(setSim).catch(() => {}), [])

  return (
    <SimCtx.Provider value={{ sim, connected, play, pause, reset, step, setSpeed }}>
      {children}
    </SimCtx.Provider>
  )
}

export const useSim = () => useContext(SimCtx)

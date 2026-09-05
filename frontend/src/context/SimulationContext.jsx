import { createContext, useContext, useEffect, useRef, useState } from 'react'
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

  const refresh = () =>
    api.getSimState()
      .then(s => { setSim(s); setConnected(true) })
      .catch(() => setConnected(false))

  useEffect(() => {
    refresh()
    timerRef.current = setInterval(refresh, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const controls = {
    play:     () => api.simPlay().then(setSim),
    pause:    () => api.simPause().then(setSim),
    reset:    () => api.simReset().then(setSim),
    step:     () => api.simStep().then(setSim),
    setSpeed: (s) => api.simSetSpeed(s).then(setSim),
  }

  return (
    <SimCtx.Provider value={{ sim, connected, ...controls }}>
      {children}
    </SimCtx.Provider>
  )
}

export const useSim = () => useContext(SimCtx)

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  getLocations:    () => get('/api/map/locations'),
  getSimState:     () => get('/api/simulation/state'),
  getTimeline:     () => get('/api/simulation/timeline'),
  simPlay:         () => post('/api/simulation/play'),
  simPause:        () => post('/api/simulation/pause'),
  simReset:        () => post('/api/simulation/reset'),
  simStep:         () => post('/api/simulation/step'),
  simSetSpeed:     (speed) => post('/api/simulation/speed', { speed }),
}

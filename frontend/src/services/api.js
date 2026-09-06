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
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `API error ${res.status}`)
  }
  return res.json()
}

async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `API error ${res.status}`)
  }
  return res.json()
}

async function postForm(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `API error ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Map
  getLocations:           () => get('/api/map/locations'),
  // Simulation
  getSimState:            () => get('/api/simulation/state'),
  getTimeline:            () => get('/api/simulation/timeline'),
  simPlay:                () => post('/api/simulation/play'),
  simPause:               () => post('/api/simulation/pause'),
  simReset:               () => post('/api/simulation/reset'),
  simStep:                () => post('/api/simulation/step'),
  simSetSpeed:            (speed) => post('/api/simulation/speed', { speed }),
  // Vision
  analyzeImage:           (file) => { const fd = new FormData(); fd.append('file', file); return postForm('/api/vision/analyze', fd) },
  visionHealth:           () => get('/api/vision/health'),
  // Emergency
  submitReport:           (text) => post('/api/emergency/report', { text }),
  getIncidents:           (severity, status) => {
    const params = new URLSearchParams()
    if (severity && severity !== 'All') params.set('severity', severity)
    if (status) params.set('status', status)
    const qs = params.toString()
    return get(`/api/emergency/incidents${qs ? '?' + qs : ''}`)
  },
  getIncident:            (id) => get(`/api/emergency/incidents/${id}`),
  updateIncidentStatus:   (id, status) => patch(`/api/emergency/incidents/${id}/status`, { status }),
  loadMockReports:        () => post('/api/emergency/mock'),
  // Logistics
  getResources:            () => get('/api/logistics/resources'),
  getRoutes:               () => get('/api/logistics/routes'),
  getNetwork:              () => get('/api/logistics/network'),
  assignResource:          (body) => post('/api/logistics/assign', body),
  recalculateRoutes:       () => post('/api/logistics/recalculate'),
  injectLogisticsEvent:    (body) => post('/api/logistics/event', body),
  resetLogistics:          () => post('/api/logistics/reset'),
  // Commander
  getCOP:                  () => get('/api/commander/cop'),
  getRecommendations:      () => get('/api/commander/recommendations'),
  getDecisionLog:          () => get('/api/commander/decision-log'),
  recompute:               () => post('/api/commander/recompute'),
  resetCommander:          () => post('/api/commander/reset'),
  // Dashboard aggregation
  getDashboardState:       () => get('/api/dashboard/state'),
  getDashboardEvents:      () => get('/api/dashboard/events'),
  getDashboardAlerts:      () => get('/api/dashboard/alerts'),
}

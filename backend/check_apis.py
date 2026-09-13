"""Full API health check — run from backend/ with .venv active."""
import requests, os, sys

BASE = 'http://localhost:8000'
PASS = 0; FAIL = 0

def chk(method, path, body=None, files=None, label=None, expect=None):
    global PASS, FAIL
    tag = label or path
    try:
        if method == 'GET':
            r = requests.get(BASE+path, timeout=20)
        elif method == 'POST':
            if files:
                r = requests.post(BASE+path, files=files, timeout=40)
            else:
                r = requests.post(BASE+path, json=body, timeout=40)
        elif method == 'PATCH':
            r = requests.patch(BASE+path, json=body, timeout=10)
        ok = r.status_code < 300
        if ok:
            d = r.json()
            if isinstance(d, list):
                summary = f'list[{len(d)}]'
            elif isinstance(d, dict):
                summary = str(list(d.keys())[:5])
            else:
                summary = str(d)[:60]
            print(f'  PASS  {tag:<55} {summary}')
            PASS += 1
        else:
            print(f'  FAIL  {tag:<55} {r.status_code}: {r.text[:100]}')
            FAIL += 1
    except Exception as e:
        print(f'  ERR   {tag:<55} {e}')
        FAIL += 1

print('='*70)
print('HEALTH')
print('='*70)
chk('GET',  '/health')
chk('GET',  '/health/detailed')

print()
print('='*70)
print('SIMULATION (8 endpoints)')
print('='*70)
chk('GET',  '/api/simulation/state')
chk('GET',  '/api/simulation/timeline')
chk('POST', '/api/simulation/play')
chk('POST', '/api/simulation/pause')
chk('POST', '/api/simulation/step')
chk('POST', '/api/simulation/speed', {'speed': 2})
chk('POST', '/api/simulation/speed', {'speed': 1})
chk('POST', '/api/simulation/reset')

print()
print('='*70)
print('MAP (1 endpoint)')
print('='*70)
chk('GET',  '/api/map/locations')

print()
print('='*70)
print('EMERGENCY (6 endpoints)')
print('='*70)
chk('POST', '/api/emergency/mock')
chk('GET',  '/api/emergency/incidents')
chk('GET',  '/api/emergency/incidents?severity=Critical')
chk('GET',  '/api/emergency/incidents?status=Open')
chk('POST', '/api/emergency/report', {'text': 'Flood water rising in Kottayam hospital. 50 patients need evacuation immediately.'})
chk('GET',  '/api/emergency/incidents/INC-001')
chk('PATCH','/api/emergency/incidents/INC-001/status', {'status': 'Acknowledged'})

print()
print('='*70)
print('LOGISTICS (6 endpoints)')
print('='*70)
chk('GET',  '/api/logistics/resources')
chk('GET',  '/api/logistics/routes')
chk('GET',  '/api/logistics/network')
chk('POST', '/api/logistics/assign', {'destination': 'Kottayam', 'resource_type': 'Boat'})
chk('POST', '/api/logistics/recalculate')
chk('POST', '/api/logistics/event', {'event_type': 'road_blocked', 'location': 'Alappuzha'})
chk('POST', '/api/logistics/reset')

print()
print('='*70)
print('COMMANDER (4 endpoints)')
print('='*70)
chk('GET',  '/api/commander/cop')
chk('GET',  '/api/commander/recommendations')
chk('GET',  '/api/commander/decision-log')
chk('POST', '/api/commander/recompute')

print()
print('='*70)
print('VISION (2 endpoints)')
print('='*70)
chk('GET',  '/api/vision/health')
sample = r'D:\GOALS\Projects\Sentinel-AI\frontend\public\samples\alappuzha_2018_08_17.jpg'
if os.path.exists(sample):
    with open(sample, 'rb') as f:
        chk('POST', '/api/vision/analyze',
            files={'file': ('alappuzha.jpg', f, 'image/jpeg')},
            label='/api/vision/analyze')
else:
    print(f'  SKIP  /api/vision/analyze  (sample not found)')

print()
print('='*70)
print('DASHBOARD (3 endpoints)')
print('='*70)
chk('GET',  '/api/dashboard/state')
chk('GET',  '/api/dashboard/events')
chk('GET',  '/api/dashboard/alerts')

print()
print('='*70)
print('REASONING (5 endpoints)')
print('='*70)
chk('GET',  '/api/reasoning/status')
chk('POST', '/api/reasoning/sitrep')
chk('POST', '/api/reasoning/explain', {'recommendation_index': 0})
chk('POST', '/api/reasoning/handover')
chk('POST', '/api/reasoning/report')

print()
print('='*70)
print(f'RESULT: {PASS} passed, {FAIL} failed out of {PASS+FAIL} endpoints')
print('='*70)

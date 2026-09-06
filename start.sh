#!/usr/bin/env bash
# Sentinel AI — Production startup script
# Usage: bash start.sh [--port 8000] [--workers 2]

set -e

PORT=${PORT:-8000}
WORKERS=${WORKERS:-1}

echo "=== Sentinel AI Backend ==="
echo "Environment : ${APP_ENV:-development}"
echo "Port        : $PORT"
echo "Workers     : $WORKERS"
echo "Mock models : ${USE_MOCK_MODELS:-true}"
echo "==========================="

cd "$(dirname "$0")/backend"

# Activate virtual environment if present
if [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
fi

exec uvicorn main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --workers "$WORKERS" \
  --log-level "${LOG_LEVEL:-info}"

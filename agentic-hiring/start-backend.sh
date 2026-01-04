#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
uvicorn api:app --reload --host 0.0.0.0 --port 8000

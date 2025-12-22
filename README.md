# Agentic Workspace - Project Overview

This workspace contains a suite of AI-driven tools, including an HR Portal and an AI-Auto-QA testing framework.

## Project Structure

### 1. AI-Auto-QA (`/ai-auto-qa`)
An agentic testing framework that uses Playwright and LLMs to perform automated, data-centric QA.
- **Frontend**: Vite + React + Tailwind (in `/ai-auto-qa/`)
- **Backend/Agents**: Node.js Express server (in `/ai-auto-qa/server/`)

### 2. HR Portal Backend (`/backend`)
FastAPI-based backend for the HR and recruitment workflows.
- Core logic: `api.py`, `llm.py`.

### 3. HR Portal Frontend (`/frontend`)
React-based frontend for the HR Portal.

### 4. Dashboards
- `dashboard.py`: Streamlit-based dashboard for data visualization.

---

## Setup Instructions

### AI-Auto-QA Tool
1. **Server Setup**:
   - `cd ai-auto-qa/server`
   - `npm install`
   - Create `.env` from `.env.example` (add your LiteLLM/OpenAI keys).
   - `npm start` (Runs on port 3001).
2. **Frontend Setup**:
   - `cd ai-auto-qa`
   - `npm install`
   - `npm run dev` (Access at localhost:8080).

### HR Portal
1. **Backend**:
   - `cd backend`
   - Create a virtual environment: `python -m venv venv`
   - `source venv/bin/activate`
   - `pip install -r requirements.txt`
   - Run: `uvicorn api:app --reload`
2. **Frontend**:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

### Streamlit Dashboard
- `pip install streamlit`
- `streamlit run dashboard.py`

---

## Requirements
- Node.js 18+
- Python 3.10+
- LLM API Keys (LiteLLM or direct OpenAI/Gemini)

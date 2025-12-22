# Agentic Workspace - Project Overview

This workspace contains a suite of AI-driven tools, including an HR Portal and an AI-Auto-QA testing framework.

## Project Structure

### 1. AI-Auto-QA (`/ai-auto-qa`)
An agentic testing framework that uses Playwright and LLMs to perform automated, data-centric QA.
- **Frontend**: Vite + React + Tailwind (in `/ai-auto-qa/`)
- **Backend/Agents**: Node.js Express server (in `/ai-auto-qa/server/`)

### 2. Agentic Hiring (`/agentic-hiring`)
Complete hiring toolchain including resume analysis and job matching.
- **Backend**: FastAPI (in `/agentic-hiring/backend/`)
- **Frontend**: React (in `/agentic-hiring/frontend/`)
- **Dashboards**: Streamlit (`/agentic-hiring/dashboard.py`)

---

## Setup Instructions

### AI-Auto-QA Tool
1. **Server Setup**:
   - `cd ai-auto-qa/server` && `npm install` && `npm start`
2. **Frontend Setup**:
   - `cd ai-auto-qa` && `npm install` && `npm run dev`

### Agentic Hiring
1. **Backend**:
   - `cd agentic-hiring/backend`
   - Setup venv and `pip install -r ../requirements.txt`
   - Run: `uvicorn api:app --reload`
2. **Frontend**:
   - `cd agentic-hiring/frontend` && `npm install` && `npm run dev`

### Streamlit Dashboard
- `pip install streamlit`
- `streamlit run dashboard.py`

---

## Requirements
- Node.js 18+
- Python 3.10+
- LLM API Keys (LiteLLM or direct OpenAI/Gemini)

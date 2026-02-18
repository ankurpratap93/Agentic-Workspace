# Deploy QA Agentic Tool (HR Portal) to Render.com

## What’s done

- **render.yaml** at repo root is configured for Render Blueprint (backend + frontend).
- **Frontend** is built for production (`agentic-hiring/frontend/dist`).
- **Backend** is ready (Python/FastAPI under `agentic-hiring/backend`).

## Deploy to Render

1. **Push to GitHub** (from repo root):
   ```bash
   git add render.yaml DEPLOY_STEPS.md
   git commit -m "Deploy QA agentic tool - Render blueprint"
   git push origin main
   ```

2. **Connect repo to Render**
   - Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
   - Connect the GitHub repo (e.g. `ankurpratap93/Agentic-Workspace`).
   - Render will read `render.yaml` and create:
     - **agentic-hiring-api** (backend)
     - **agentic-hiring-ui** (frontend)
     - **ai-qa-co-pilot** (optional; separate app)

3. **Set env vars**
   - **agentic-hiring-api** → **Environment**:
     - `LITELLM_API_KEY` = your API key (required).
     - `LITELLM_MODEL` = `hackathon-gemini-2.5-flash` (optional).
   - **agentic-hiring-ui** → **Environment**:
     - `VITE_API_URL` = `https://agentic-hiring-api.onrender.com` (use your backend URL from Render).

4. **Deploy**
   - Save; Render will build and deploy. When the backend is live, copy its URL into `VITE_API_URL` for the frontend if you didn’t set it earlier, then redeploy the frontend once.

## Local production build (optional)

```bash
cd agentic-hiring
./deploy.sh render   # builds frontend and checks backend
# Backend: cd backend && source venv/bin/activate && uvicorn api:app --host 0.0.0.0 --port 8000
# Frontend: cd frontend && npm run preview
```

## URLs after deploy

- Backend: `https://agentic-hiring-api.onrender.com`
- Frontend: `https://agentic-hiring-ui.onrender.com` (or the URL Render shows for the static site)

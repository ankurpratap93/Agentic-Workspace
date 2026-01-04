# HR Portal Deployment Guide

## Quick Start - Local Deployment

### Option 1: Development Mode (Recommended for Testing)

**Terminal 1 - Backend:**
```bash
cd /Users/ankurpratap/Downloads/Agentic/agentic-hiring/backend
source venv/bin/activate  # or: python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/ankurpratap/Downloads/Agentic/agentic-hiring/frontend
npm install
npm run dev
```

Access at: `http://localhost:5174` (or the port Vite assigns)

### Option 2: Production Mode (Local)

**Terminal 1 - Backend:**
```bash
cd /Users/ankurpratap/Downloads/Agentic/agentic-hiring/backend
source venv/bin/activate
uvicorn api:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend (Built):**
```bash
cd /Users/ankurpratap/Downloads/Agentic/agentic-hiring/frontend
npm run build
npm run preview  # Serves the built files
```

Access at: `http://localhost:4173` (preview server)

## Cloud Deployment - Render.com

### Prerequisites
1. GitHub repository with your code
2. Render.com account (free tier available)
3. Environment variables configured

### Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy HR Portal"
   git push origin main
   ```

2. **Deploy Backend:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Name**: `agentic-hiring-api`
     - **Runtime**: Python 3
     - **Build Command**: `pip install -r agentic-hiring/backend/requirements.txt`
     - **Start Command**: `uvicorn agentic-hiring.backend.api:app --host 0.0.0.0 --port $PORT`
     - **Environment Variables**:
       - `PORT`: `8000` (auto-set by Render)
       - `LITELLM_API_KEY`: (your API key)
       - `LITELLM_MODEL`: `hackathon-gemini-2.5-flash` (optional)

3. **Deploy Frontend:**
   - Go to Render Dashboard → New → Static Site
   - Connect your GitHub repository
   - Configure:
     - **Name**: `agentic-hiring-ui`
     - **Build Command**: `npm install --prefix agentic-hiring/frontend && npm run build --prefix agentic-hiring/frontend`
     - **Publish Directory**: `agentic-hiring/frontend/dist`
     - **Environment Variables**:
       - `VITE_API_URL`: `https://agentic-hiring-api.onrender.com` (your backend URL)

4. **Alternative: Use render.yaml (Auto-deploy)**
   - Render can auto-detect `render.yaml` in your repo
   - Just connect the repo and Render will create both services automatically

## Environment Variables

### Backend (.env or Render Environment)
- `LITELLM_API_KEY`: Your LiteLLM API key (required)
- `LITELLM_MODEL`: Model name (optional, defaults to gemini)
- `PORT`: Port number (auto-set by Render)

### Frontend (Build-time)
- `VITE_API_URL`: Backend API URL
  - Local: `http://127.0.0.1:8000`
  - Production: `https://agentic-hiring-api.onrender.com`

## Troubleshooting

### Backend Issues
- **Port already in use**: Change port in uvicorn command
- **Module not found**: Ensure virtual environment is activated and dependencies installed
- **CORS errors**: Already configured in `api.py`, but check if frontend URL matches

### Frontend Issues
- **API connection failed**: Check `VITE_API_URL` matches backend URL
- **Build fails**: Run `npm install` first
- **Blank page**: Check browser console for errors

### Render Deployment Issues
- **Build timeout**: Increase build timeout in Render settings
- **Service crashes**: Check logs in Render dashboard
- **Environment variables**: Ensure they're set in Render dashboard, not just in code

## Production Checklist

- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend built (`npm run build`)
- [ ] Environment variables configured
- [ ] CORS configured for production domain
- [ ] Backend health check working (`/` endpoint)
- [ ] Frontend can connect to backend API
- [ ] All features tested in production mode

## Quick Deploy Scripts

See `deploy.sh` for automated deployment script.

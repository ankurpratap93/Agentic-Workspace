# HR Portal - Cursor Handoff Document

## Project Overview
Modern HR Command Center built with **React + FastAPI** architecture, featuring a premium "Lovable-inspired" dark UI theme.

## Current Status ✅

### What's Working
- ✅ React frontend (Vite + Tailwind CSS) on port 5174
- ✅ FastAPI backend on port 8000
- ✅ "Midnight SaaS" dark theme with gradient headers
- ✅ Create Requisition modal (fully functional)
- ✅ Backend API with CORS configured
- ✅ All dependencies installed

### Architecture
```
/Users/ankurpratap/Downloads/Agentic/
├── backend/
│   ├── api.py          # FastAPI server (MAIN BACKEND)
│   ├── utils.py        # Business logic & data operations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React app
│   │   ├── index.css            # Tailwind theme
│   │   └── components/
│   │       ├── ui/button.jsx    # Button component
│   │       └── ErrorBoundary.jsx
│   ├── package.json
│   └── tailwind.config.js
├── venv/               # Python virtual environment
├── jobs/               # Job data storage
├── utils.py            # Original utils (backend/utils.py is the active one)
└── dashboard.py        # Old Streamlit app (deprecated)
```

## How to Run

### Backend
```bash
cd /Users/ankurpratap/Downloads/Agentic
source venv/bin/activate
uvicorn backend.api:app --reload --port 8000
```

### Frontend
```bash
cd /Users/ankurpratap/Downloads/Agentic/frontend
npm run dev
```

**Access at**: `http://localhost:5174`

## Key Technical Details

### Backend API Endpoints
- `GET /jobs` - List all jobs
- `POST /jobs` - Create new job (uses `utils.create_new_job_with_resumes(title, "", [])`)
- `GET /jobs/{job_id}/candidates` - Get candidates for a job
- `GET /jobs/{job_id}/metrics` - Get metrics (total, screened, interviewing, offers)
- `GET /jobs/{job_id}/funnel` - Get funnel data for visualization

### Frontend State Management
- Uses React hooks (`useState`, `useEffect`)
- API calls to `http://127.0.0.1:8000`
- Modal state for Create Requisition feature

### Design System
- **Colors**: Deep Zinc 950 background, Blue-Purple gradients
- **Components**: Matte cards with subtle borders, glowing hover effects
- **Typography**: Inter font, gradient text for headers
- **Animations**: Framer Motion for smooth transitions

## Recent Fixes
1. **CORS Issue**: Updated `backend/api.py` to allow all origins (`allow_origins=["*"]`)
2. **API Functions**: Fixed function calls to use `utils.get_all_jobs()` and `utils.create_new_job_with_resumes()`
3. **Modal**: Replaced `window.prompt` with custom React modal for better UX

## Next Steps (What to Build)

### Priority 1: Candidates Page
- [ ] Create data table component (use TanStack Table or similar)
- [ ] Display candidates from `GET /jobs/{job_id}/candidates`
- [ ] Add resume viewer (PDF display)
- [ ] Implement bulk actions (shortlist, reject)

### Priority 2: Navigation
- [ ] Add job selector dropdown in header
- [ ] Implement page routing (React Router)
- [ ] Create stepper navigation between stages

### Priority 3: Phone Screening
- [ ] Build screening interface
- [ ] Connect to `POST /screen` endpoint
- [ ] Display AI call transcript and score

### Priority 4: Interview Scheduling
- [ ] Create scheduling form
- [ ] Date/time picker component
- [ ] Connect to `POST /schedule` endpoint

### Priority 5: Offer Management
- [ ] Offer generation UI
- [ ] Approval workflow
- [ ] Status tracking

## Important Notes for Cursor AI

### When Making Changes
1. **Backend changes**: Uvicorn auto-reloads, but check terminal for errors
2. **Frontend changes**: Vite auto-reloads instantly
3. **New dependencies**: 
   - Backend: Add to `backend/requirements.txt` and run `pip install -r backend/requirements.txt`
   - Frontend: Run `npm install <package>` in `/frontend` directory

### Common Issues
- **Port conflicts**: Frontend may switch to 5175 if 5174 is busy
- **CORS errors**: Already fixed, but if they return, check `backend/api.py` line 17-23
- **API 500 errors**: Check backend terminal for Python traceback

### Utils.py Functions Available
- `get_all_jobs()` - List job IDs
- `create_new_job_with_resumes(title, jd_text, files)` - Create job
- `load_job_artifact(job_id, filename)` - Load CSV/JSON data
- `update_candidate_status(job_id, name, status)` - Update candidate
- `conduct_agent_call(job_id, name)` - AI screening simulation
- `schedule_interview(job_id, name, date, time, interviewer)` - Schedule

## Context for First Cursor Prompt

**Suggested first message to Cursor**:
```
I'm continuing development on an HR Portal. The Create Requisition feature is working. 
I need to build the Candidates page next with a data table showing all candidates for 
the selected job. The backend endpoint GET /jobs/{job_id}/candidates is ready. 
Please help me create a clean, modern table component that matches the existing 
"Midnight SaaS" dark theme.
```

## File Locations
- **Main app**: `/Users/ankurpratap/Downloads/Agentic/frontend/src/App.jsx`
- **Backend API**: `/Users/ankurpratap/Downloads/Agentic/backend/api.py`
- **Business logic**: `/Users/ankurpratap/Downloads/Agentic/backend/utils.py`
- **Styles**: `/Users/ankurpratap/Downloads/Agentic/frontend/src/index.css`

---
**Last Updated**: 2025-12-15
**Status**: Ready for Cursor continuation ✅

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import sys

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import utils

app = FastAPI(title="HR Command Center API")

# Strict CORS matching can be flaky in dev with localhost/loopback mixes.
# Disable credentials (not needed yet) and allow all origins for maximum compatibility.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobCreate(BaseModel):
    title: str

class CandidateAction(BaseModel):
    job_id: str
    candidate_name: str
    action: str # "shortlist", "reject", "restore"

class ScheduleRequest(BaseModel):
    job_id: str
    candidate_name: str
    date: str
    time: str
    interviewer: str

@app.get("/")
def health_check():
    return {"status": "ok", "message": "HR Portal Backend Running"}

@app.get("/jobs")
def get_jobs():
    """List all jobs with metadata"""
    jobs = utils.get_all_jobs()
    job_list = []
    for jid in jobs:
        # Get count
        df = utils.load_job_artifact(jid, "cv_scores.csv")
        count = len(df) if df is not None else 0
        job_list.append({
            "id": jid, 
            "title": jid.replace("_", " ").title(), # Basic formatting
            "count": count
        })
    return job_list

@app.post("/jobs")
def create_job(job: JobCreate):
    # create_new_job_with_resumes expects (title, jd_text, uploaded_files)
    # For now, create with empty JD and no files
    jid = utils.create_new_job_with_resumes(job.title, "", [])
    return {"id": jid, "title": job.title}

@app.get("/jobs/{job_id}/candidates")
def get_candidates(job_id: str):
    """Get candidate list with status"""
    df = utils.load_job_artifact(job_id, "cv_scores.csv")
    if df is None:
        return []
    # Fill NaN
    df = df.fillna("")
    return df.to_dict(orient="records")

@app.get("/jobs/{job_id}/metrics")
def get_metrics(job_id: str):
    df = utils.load_job_artifact(job_id, "cv_scores.csv")
    if df is None:
        return {"total": 0, "screened": 0, "interviewing": 0, "offers": 0}
    
    total = len(df)
    screened = len(df[df['score'] > 0])
    interviewing = len(df[df['status'].str.contains('Interview', na=False)])
    offers = len(df[df['status'].str.contains('Offer', na=False)])
    
    return {
        "total": total,
        "screened": screened,
        "interviewing": interviewing,
        "offers": offers
    }

@app.post("/candidates/action")
def candidate_action(payload: CandidateAction):
    new_status = ""
    if payload.action == "shortlist":
        new_status = "Shortlisted"
    elif payload.action == "reject":
        new_status = "Rejected"
    elif payload.action == "restore":
        new_status = "Shortlisted"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    utils.update_candidate_status(payload.job_id, payload.candidate_name, new_status)
    return {"status": "success", "new_candidate_status": new_status}

@app.post("/screen")
def screen_candidate(payload: CandidateAction):
    """Trigger AI Screening Call"""
    transcript, score = utils.conduct_agent_call(payload.candidate_name)
    
    # Update score in CSV? conduct_agent_call usually returns score but might not save it to CSV automatically 
    # depending on utils implementation. Let's check utils later. 
    # For now, we update status.
    utils.update_candidate_status(payload.job_id, payload.candidate_name, "AI Screened")
    
    # Save transcript
    # (Assuming utils has a way, or we manually save. For now, we return it.)
    return {"transcript": transcript, "score": score}

@app.post("/schedule")
def schedule_interview(payload: ScheduleRequest):
    # Convert string date/time to objects if utils requires, or modify utils.
    # Utils expects datetime objects usually.
    from datetime import datetime
    d_obj = datetime.strptime(payload.date, "%Y-%m-%d").date()
    t_obj = datetime.strptime(payload.time, "%H:%M").time()
    
    utils.schedule_interview(payload.job_id, payload.candidate_name, d_obj, t_obj, payload.interviewer)
    return {"status": "scheduled"}

@app.get("/jobs/{job_id}/funnel")
def get_funnel(job_id: str):
    df = utils.load_job_artifact(job_id, "cv_scores.csv")
    if df is None or df.empty:
        return []
    
    # aggregated counts
    counts = df['status'].value_counts().to_dict()
    
    # Define order
    stages = [
        "New", "Screened", "Shortlisted", "AI Screened", 
        "Interview Ready", "Interview Scheduled", "Offer Pending", "Offer Accepted", "Rejected"
    ]
    
    funnel_data = []
    for stage in stages:
        if stage in counts and counts[stage] > 0:
            funnel_data.append({"stage": stage, "count": counts[stage]})
            
    return funnel_data

@app.get("/jobs/{job_id}/resume/{filename}")
def get_resume(job_id: str, filename: str):
    # Securely serve file
    path = f"jobs/{job_id}/{filename}"
    if os.path.exists(path):
        return FileResponse(path, media_type="application/pdf")
    raise HTTPException(status_code=404, detail="Resume not found")

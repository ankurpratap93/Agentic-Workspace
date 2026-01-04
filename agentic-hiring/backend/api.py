from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
import asyncio

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import utils

# Import agents and integrations with graceful fallback
get_calling_agent = None
get_interview_assist = None
get_teams_integration = None
get_google_meet_integration = None

try:
    from agents.calling_agent import get_calling_agent
except ImportError as e:
    print(f"Warning: Calling agent not available: {e}")

try:
    from agents.interview_assist import get_interview_assist
except ImportError as e:
    print(f"Warning: Interview assist agent not available: {e}")

try:
    from integrations.teams import get_teams_integration
except ImportError as e:
    print(f"Warning: Teams integration not available: {e}")

try:
    from integrations.google_meet import get_google_meet_integration
except ImportError as e:
    print(f"Warning: Google Meet integration not available: {e}")

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
    jd_text: Optional[str] = ""  # Job description text

class CandidateAction(BaseModel):
    job_id: str
    candidate_name: str
    action: str
    feedback: Optional[str] = "" # "shortlist", "reject", "restore"

class ScheduleRequest(BaseModel):
    job_id: str
    candidate_name: str
    date: str
    time: str
    interviewer: str
    meeting_platform: Optional[str] = "teams"  # "teams" or "google_meet"

class CallRequest(BaseModel):
    job_id: str
    candidate_name: str
    phone_number: str
    call_type: Optional[str] = "screening"

class InterviewJoinRequest(BaseModel):
    job_id: str
    candidate_name: str
    interview_type: str
    meeting_platform: Optional[str] = "teams"
    meeting_link: Optional[str] = None

class TranscriptRequest(BaseModel):
    session_id: str
    transcript_chunk: str
    speaker: Optional[str] = "candidate"  # "candidate" or "interviewer"

class MeetingRequest(BaseModel):
    subject: str
    start_time: str  # ISO format
    duration_minutes: Optional[int] = 60
    attendees: Optional[List[str]] = []
    platform: Optional[str] = "teams"  # "teams" or "google_meet"

@app.get("/")
def health_check():
    return {"status": "ok", "message": "HR Portal Backend Running"}

@app.get("/agents/status")
def agents_status():
    """Check status of all agents and integrations"""
    import os
    llm_configured = bool(os.getenv("LITELLM_API_KEY") or os.getenv("GEMINI_API_KEY"))
    
    return {
        "calling_agent": get_calling_agent is not None,
        "interview_assist": get_interview_assist is not None,
        "teams_integration": get_teams_integration is not None,
        "google_meet_integration": get_google_meet_integration is not None,
        "llm_configured": llm_configured,
        "jd_improve_agent": True,  # JD improve is part of utils
        "message": "Agents status check",
        "note": "JD Improve agent requires LITELLM_API_KEY to function"
    }

@app.get("/jobs")
def get_jobs(include_archived: bool = False):
    """List all jobs with metadata"""
    try:
        jobs = utils.get_all_jobs()
        job_list = []
        for job_info in jobs:
            # job_info is already a dict with id, title, etc.
            if isinstance(job_info, dict):
                if not include_archived and job_info.get("archived", False):
                    continue
                job_list.append({
                    "id": job_info.get("id", ""),
                    "title": job_info.get("title", ""),
                    "count": job_info.get("candidate_count", 0),
                    "created_at": job_info.get("created_at", ""),
                    "archived": job_info.get("archived", False)
                })
            else:
                # Fallback for old format
                jid = str(job_info)
                df = utils.load_job_artifact(jid, "cv_scores.csv")
                count = len(df) if df is not None else 0
                job_list.append({
                    "id": jid, 
                    "title": jid.replace("_", " ").title(),
                    "count": count,
                    "created_at": "Unknown",
                    "archived": False
                })
        return job_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get jobs: {str(e)}")

@app.post("/jobs")
def create_job(job: JobCreate):
    """Create a new job requisition"""
    try:
        # create_new_job_with_resumes expects (title, jd_text, uploaded_files)
        jd_text = job.jd_text or ""
        jid = utils.create_new_job_with_resumes(job.title, jd_text, [])
        return {"id": jid, "title": job.title, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

@app.get("/jobs/{job_id}/candidates")
def get_candidates(job_id: str):
    """Get candidate list with status"""
    df = utils.load_job_artifact(job_id, "cv_scores.csv")
    if df is None:
        return []
    # Fill NaN
    df = df.fillna("")
    
    # Add resume_url for each candidate
    from urllib.parse import quote
    candidates = df.to_dict(orient="records")
    for candidate in candidates:
        candidate_name = candidate.get("name", "")
        if candidate_name:
            # Find the resume file
            resume_path = utils.get_resume_path(job_id, candidate_name)
            if resume_path and os.path.exists(resume_path):
                # Get just the filename and URL-encode it
                filename = os.path.basename(resume_path)
                encoded_filename = quote(filename, safe='')
                # Create the URL
                candidate["resume_url"] = f"/jobs/{job_id}/resume/{encoded_filename}"
            else:
                candidate["resume_url"] = None
    
    return candidates

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
    """Trigger AI Screening Call (Legacy - use /call for new calling agent)"""
    transcript, score = utils.conduct_agent_call(payload.job_id, payload.candidate_name)
    utils.update_candidate_status(payload.job_id, payload.candidate_name, "AI Screened")
    return {"transcript": transcript, "score": score}

class AssessRequest(BaseModel):
    job_id: str
    candidate_name: str
    transcript: str

@app.post("/screen/assess")
def assess_candidate(payload: AssessRequest):
    """AI Assessment of candidate based on transcript"""
    try:
        result = utils.screening_assess(payload.job_id, payload.candidate_name, payload.transcript)
        return {"assessment": result, "status": "success"}
    except Exception as e:
        error_msg = str(e)
        # If LLM fails, provide heuristic fallback
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower() or "llm" in error_msg.lower():
            # Heuristic assessment fallback
            jd_text = utils.load_job_artifact(payload.job_id, "jd.txt") or ""
            cand = utils._get_candidate_row(payload.job_id, payload.candidate_name)
            score = cand.get("score", 0) if cand else 0
            
            # Simple heuristic assessment
            transcript_lower = payload.transcript.lower()
            positive_indicators = ["yes", "available", "interested", "experience", "skills", "ready"]
            negative_indicators = ["no", "not available", "cannot", "unable"]
            
            positive_count = sum(1 for word in positive_indicators if word in transcript_lower)
            negative_count = sum(1 for word in negative_indicators if word in transcript_lower)
            
            if score >= 7 and positive_count > negative_count:
                recommendation = "yes"
            elif score >= 5:
                recommendation = "maybe"
            else:
                recommendation = "no"
            
            return {
                "assessment": {
                    "assessment": f"Candidate scored {score}/10. Transcript analysis shows {positive_count} positive indicators vs {negative_count} concerns.",
                    "hire_recommendation": recommendation,
                    "risks": ["LLM unavailable - using heuristic assessment"] if negative_count > 0 else [],
                    "next_questions": ["Verify experience details", "Confirm availability"] if recommendation == "maybe" else []
                },
                "status": "partial",
                "method": "heuristic"
            }
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")

@app.post("/call")
async def make_call(payload: CallRequest):
    """Make AI-powered call to candidate using Calling Agent"""
    if get_calling_agent is None:
        raise HTTPException(status_code=503, detail="Calling agent not available. Check /agents/status")
    
    try:
        agent = get_calling_agent()
        result = await agent.make_call(
            payload.job_id,
            payload.candidate_name,
            payload.phone_number,
            payload.call_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Call failed: {str(e)}")

@app.post("/interview/join")
async def join_interview(payload: InterviewJoinRequest):
    """Join interview with AI assistant"""
    if get_interview_assist is None:
        raise HTTPException(status_code=503, detail="Interview assist agent not available. Check /agents/status")
    
    try:
        agent = get_interview_assist()
        result = await agent.join_interview(
            payload.job_id,
            payload.candidate_name,
            payload.interview_type,
            payload.meeting_platform,
            payload.meeting_link
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join interview: {str(e)}")

@app.post("/interview/transcript")
async def process_transcript(payload: TranscriptRequest):
    """Process real-time interview transcript"""
    if get_interview_assist is None:
        raise HTTPException(status_code=503, detail="Interview assist agent not available. Check /agents/status")
    
    try:
        agent = get_interview_assist()
        result = await agent.process_interview_transcript(
            payload.session_id,
            payload.transcript_chunk,
            payload.speaker
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process transcript: {str(e)}")

@app.post("/interview/end")
async def end_interview(session_id: str, full_transcript: Optional[str] = None):
    """End interview session and get evaluation"""
    if get_interview_assist is None:
        raise HTTPException(status_code=503, detail="Interview assist agent not available. Check /agents/status")
    
    try:
        agent = get_interview_assist()
        result = await agent.end_interview(session_id, full_transcript)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end interview: {str(e)}")

@app.get("/interview/session/{session_id}")
async def get_interview_session(session_id: str):
    """Get active interview session details"""
    if get_interview_assist is None:
        raise HTTPException(status_code=503, detail="Interview assist agent not available. Check /agents/status")
    
    try:
        agent = get_interview_assist()
        session = await agent.get_active_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")

@app.post("/meeting/create")
async def create_meeting(payload: MeetingRequest):
    """Create meeting on Teams or Google Meet"""
    from datetime import datetime
    
    try:
        start_time = datetime.fromisoformat(payload.start_time)
        
        if payload.platform == "teams":
            if get_teams_integration is None:
                raise HTTPException(status_code=503, detail="Teams integration not available. Check /agents/status")
            integration = get_teams_integration()
            result = integration.create_meeting(
                payload.subject,
                start_time,
                payload.duration_minutes,
                payload.attendees
            )
        elif payload.platform == "google_meet":
            if get_google_meet_integration is None:
                raise HTTPException(status_code=503, detail="Google Meet integration not available. Check /agents/status")
            integration = get_google_meet_integration()
            result = integration.create_meeting(
                payload.subject,
                start_time,
                payload.duration_minutes,
                payload.attendees
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid platform. Use 'teams' or 'google_meet'")
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create meeting: {str(e)}")

@app.post("/webhook/twilio/call")
async def twilio_webhook(request: dict):
    """Handle Twilio webhook for call events"""
    # This would handle Twilio callbacks
    return {"status": "received"}

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

@app.post("/jobs/{job_id}/resumes")
async def upload_resumes(job_id: str, files: List[UploadFile] = File(...)):
    """Upload resumes for a job"""
    try:
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Read file contents and create file objects that utils.ingest_resumes expects
        # utils.ingest_resumes expects files with .name and .getbuffer() methods
        file_objects = []
        for upload_file in files:
            content = await upload_file.read()
            
            # Create a wrapper that matches what utils.ingest_resumes expects
            class FileWrapper:
                def __init__(self, name, content_bytes):
                    self.name = name
                    self._content = content_bytes
                
                def getbuffer(self):
                    # Return bytes directly, not BytesIO
                    return self._content
            
            file_objects.append(FileWrapper(upload_file.filename, content))
        
        # Use utils.ingest_resumes
        count = utils.ingest_resumes(job_id, file_objects)
        
        return {
            "status": "success",
            "message": f"Successfully uploaded {count} resume(s)",
            "uploaded_count": count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload resumes: {str(e)}")

@app.get("/jobs/{job_id}/resume/{filename}")
def get_resume(job_id: str, filename: str):
    """Get resume file"""
    from urllib.parse import unquote
    # Decode the filename in case it was URL-encoded
    decoded_filename = unquote(filename)
    # Securely serve file - check if it's in resumes directory
    resume_path = f"jobs/{job_id}/resumes/{decoded_filename}"
    if os.path.exists(resume_path):
        # Determine media type
        if filename.lower().endswith('.pdf'):
            return FileResponse(resume_path, media_type="application/pdf")
        elif filename.lower().endswith(('.doc', '.docx')):
            return FileResponse(resume_path, media_type="application/msword")
        elif filename.lower().endswith('.txt'):
            return FileResponse(resume_path, media_type="text/plain")
        else:
            return FileResponse(resume_path)
    
    # Fallback: check old location
    path = f"jobs/{job_id}/{filename}"
    if os.path.exists(path):
        return FileResponse(path, media_type="application/pdf")
    
    raise HTTPException(status_code=404, detail="Resume not found")

@app.get("/jobs/{job_id}/jd")
def get_jd(job_id: str):
    """Get job description"""
    try:
        jd_text = utils.load_job_artifact(job_id, "jd.txt") or ""
        return {"jd_text": jd_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get JD: {str(e)}")

class ImproveJDRequest(BaseModel):
    job_id: str

@app.post("/jd/improve")
def improve_jd_endpoint(payload: ImproveJDRequest):
    """AI Improve JD endpoint"""
    try:
        result = utils.improve_jd(payload.job_id)
        
        # Check if improvement was successful (even if using heuristic fallback)
        improved_jd = result.get("improved_jd", "")
        original_jd = utils.load_job_artifact(payload.job_id, "jd.txt") or ""
        
        # If we got an improved JD (different from original or formatted), it's a success
        if improved_jd and improved_jd.strip() and improved_jd != original_jd:
            # Check if it's using heuristic (has risks mentioning LLM unavailable)
            risks = result.get("risks", [])
            using_heuristic = any("heuristic" in str(r).lower() or "llm unavailable" in str(r).lower() for r in risks)
            
            if using_heuristic:
                return {
                    "result": result,
                    "status": "success",
                    "method": "heuristic",
                    "message": "JD improved using intelligent formatting (LLM unavailable, but improvement successful)"
                }
            else:
                return {
                    "result": result,
                    "status": "success",
                    "method": "llm",
                    "message": "JD improved using AI"
                }
        
        # If no improvement happened, check why
        if result.get("risks") and any("failed" in str(r).lower() for r in result.get("risks", [])):
            return {
                "result": result,
                "status": "partial",
                "error": "LLM call failed - using original JD"
            }
        
        return {"result": result, "status": "success"}
    except Exception as e:
        # Return the result even if there's an error, so frontend can show the error message
        error_msg = str(e)
        # Try to get current JD to return it
        try:
            current_jd = utils.load_job_artifact(payload.job_id, "jd.txt") or ""
        except:
            current_jd = ""
        
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower() or "proxy" in error_msg.lower():
            return {
                "result": {
                    "improved_jd": current_jd,  # Return current JD so it doesn't disappear
                    "must_have_keywords": [],
                    "risks": ["LLM API key not configured or invalid. Please check LITELLM_API_KEY environment variable."]
                },
                "status": "error",
                "error": "LLM not configured"
            }
        raise HTTPException(status_code=500, detail=f"Failed to improve JD: {str(e)}")

class SaveJDRequest(BaseModel):
    jd_text: str

@app.post("/jobs/{job_id}/jd")
@app.put("/jobs/{job_id}/jd")
def save_jd(job_id: str, jd_data: SaveJDRequest):
    """Save job description - supports both POST and PUT"""
    try:
        jd_text = jd_data.jd_text or ""
        utils.save_job_artifact(job_id, "jd.txt", jd_text)
        utils._append_log(job_id, "JD_UPDATED", "Job description updated")
        return {"status": "success", "message": "JD saved", "jd_text": jd_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save JD: {str(e)}")

@app.post("/jobs/{job_id}/rescore")
def rescore_candidates(job_id: str):
    """Rescore candidates using keyword matching (fast)"""
    try:
        # Check if candidates exist
        csv_path = os.path.join("jobs", job_id, "cv_scores.csv")
        if not os.path.exists(csv_path):
            return {
                "status": "error",
                "message": "No candidates found. Please upload resumes first."
            }
        
        # Run scoring
        utils.trigger_simulation_step(job_id, "score_cvs")
        
        # Verify scores were updated
        import pandas as pd
        df = pd.read_csv(csv_path)
        scored_count = len(df[df['score'] > 0])
        
        return {
            "status": "success",
            "message": f"Candidates rescored using JD keywords. {scored_count} candidates scored.",
            "candidates_scored": scored_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rescore: {str(e)}")

@app.post("/jobs/{job_id}/rescore_llm")
def rescore_candidates_llm(job_id: str):
    """Rescore candidates using LLM or heuristic fallback"""
    try:
        # Check if candidates exist
        csv_path = os.path.join("jobs", job_id, "cv_scores.csv")
        if not os.path.exists(csv_path):
            return {
                "updated": 0,
                "status": "no_candidates",
                "message": "No candidates found. Please upload resumes first."
            }
        
        # Check if JD exists
        jd_path = os.path.join("jobs", job_id, "jd.txt")
        if not os.path.exists(jd_path) or not utils.load_job_artifact(job_id, "jd.txt"):
            return {
                "updated": 0,
                "status": "no_jd",
                "message": "No job description found. Please add a JD first."
            }
        
        result = utils.llm_score_candidates(job_id)
        
        # Always return success if candidates were updated (even if using heuristic)
        if result.get("updated", 0) > 0:
            utils._append_log(job_id, "LLM_RESCORE", f"Rescored {result.get('updated', 0)} candidates")
            return {
                **result,
                "status": "success",
                "message": f"Successfully rescored {result.get('updated', 0)} candidates"
            }
        
        # If no candidates updated, check why
        import pandas as pd
        df = pd.read_csv(csv_path)
        if df.empty:
            return {
                "updated": 0,
                "status": "no_candidates",
                "message": "No candidates found. Please upload resumes first."
            }
        
        # Candidates exist but weren't updated - likely LLM error
        return {
            "updated": 0,
            "status": "partial",
            "message": "Scoring attempted but no scores updated. Using heuristic fallback.",
            "candidate_count": len(df)
        }
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            return {
                "updated": 0,
                "status": "error",
                "error": "LLM not configured",
                "message": "LLM API key not configured. Using heuristic scoring instead."
            }
        raise HTTPException(status_code=500, detail=f"Failed to rescore: {str(e)}")

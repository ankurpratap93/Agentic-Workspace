import os
import json
import shutil
import pandas as pd
from datetime import datetime

JOBS_DIR = "jobs"

# --- CORE UTILS ---

def ensure_jobs_dir():
    if not os.path.exists(JOBS_DIR):
        os.makedirs(JOBS_DIR)

def get_all_jobs():
    ensure_jobs_dir()
    jobs = []
    if not os.path.exists(JOBS_DIR):
        return []
    
    for dirname in os.listdir(JOBS_DIR):
        dirpath = os.path.join(JOBS_DIR, dirname)
        if os.path.isdir(dirpath):
            created_time = "Unknown"
            # Try to parse timestamp from dirname id
            try:
                ts_str = dirname.split('_')[-1]
                created_time = datetime.strptime(ts_str, "%Y%m%d").strftime("%b %d, %Y")
            except:
                pass

            job_info = {
                "id": dirname, 
                "title": dirname.replace("_", " ").rsplit(" ", 1)[0].title(), 
                "created_at": created_time,
                "candidate_count": _get_candidate_count(dirname)
            }
            jobs.append(job_info)
    
    # Sort by creation time (approximation)
    jobs.sort(key=lambda x: x['id'], reverse=True)
    return jobs

def _get_candidate_count(job_id):
    path = os.path.join(JOBS_DIR, job_id, "cv_scores.csv")
    if os.path.exists(path):
        try:
            return len(pd.read_csv(path))
        except:
            return 0
    return 0

def create_new_job_with_resumes(title, jd_text, uploaded_files):
    ensure_jobs_dir()
    
    # Create Job ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = "".join([c if c.isalnum() else "_" for c in title]).lower()
    job_id = f"{safe_title}_{timestamp}"
    job_dir = os.path.join(JOBS_DIR, job_id)
    resumes_dir = os.path.join(job_dir, "resumes")
    
    os.makedirs(job_dir)
    os.makedirs(resumes_dir)
    
    # Write JD
    with open(os.path.join(job_dir, "jd.txt"), "w") as f:
        f.write(jd_text)
        
    # Init Log
    init_log = [{
        "timestamp": datetime.now().isoformat(),
        "level": "INFO", 
        "event": "JOB_CREATED", 
        "details": f"Job '{title}' created."
    }]
    
    # Save Resumes
    saved_files = []
    if uploaded_files:
        for uploaded_file in uploaded_files:
            file_path = os.path.join(resumes_dir, uploaded_file.name)
            with open(file_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            saved_files.append(uploaded_file.name)
            
        init_log.append({
            "timestamp": datetime.now().isoformat(), 
            "level": "INFO", 
            "event": "RESUMES_UPLOADED", 
            "details": f"Uploaded {len(saved_files)} resumes: {', '.join(saved_files)}"
        })
        
        # Initialize empty score CSV so they appear in pipeline
        # In a real app, the Parser Agent would pick these up automatically
        # Here we mock the initial entry
        initial_csv = pd.DataFrame([
            {"name": f.split('.')[0], "score": 0.0, "status": "New", "id": f"cand_{i}"} 
            for i, f in enumerate(saved_files)
        ])
        initial_csv.to_csv(os.path.join(job_dir, "cv_scores.csv"), index=False)

    with open(os.path.join(job_dir, "activity_log.json"), "w") as f:
        json.dump(init_log, f, indent=4)
        
    return job_id

def ingest_resumes(job_id, uploaded_files):
    job_dir = os.path.join(JOBS_DIR, job_id)
    resumes_dir = os.path.join(job_dir, "resumes")
    
    if not os.path.exists(resumes_dir):
        os.makedirs(resumes_dir)
        
    saved_files = []
    
    # Save files
    for uploaded_file in uploaded_files:
        file_path = os.path.join(resumes_dir, uploaded_file.name)
        with open(file_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        saved_files.append(uploaded_file.name)
        
    _append_log(job_id, "RESUMES_INGESTED", f"Added {len(saved_files)} resumes: {', '.join(saved_files)}")
    
    # Update CSV
    csv_path = os.path.join(job_dir, "cv_scores.csv")
    new_data = pd.DataFrame([
        {"name": f.split('.')[0], "score": 0.0, "status": "New", "id": f"cand_new_{datetime.now().microsecond}"} 
        for f in saved_files
    ])
    
    if os.path.exists(csv_path):
        try:
            old_df = pd.read_csv(csv_path)
            # Concat and dedup by name for simulation simplicity
            combined_df = pd.concat([old_df, new_data], ignore_index=True)
            combined_df.drop_duplicates(subset=['name'], keep='last', inplace=True)
            combined_df.to_csv(csv_path, index=False)
        except:
             new_data.to_csv(csv_path, index=False)
    else:
        new_data.to_csv(csv_path, index=False)

    return len(saved_files)

# --- DATA ACCESS ---

def load_job_artifact(job_id, filename):
    path = os.path.join(JOBS_DIR, job_id, filename)
    if os.path.exists(path):
        if filename.endswith(".json"):
            with open(path, 'r') as f:
                return json.load(f)
        elif filename.endswith(".txt"):
            with open(path, 'r') as f:
                return f.read()
        elif filename.endswith(".csv"):
             return pd.read_csv(path)
    return None

def save_job_artifact(job_id, filename, data):
    path = os.path.join(JOBS_DIR, job_id, filename)
    if filename.endswith(".json"):
        with open(path, 'w') as f:
            json.dump(data, f, indent=4)
    elif filename.endswith(".txt"):
         with open(path, 'w') as f:
            f.write(data)

def update_candidate_status(job_id, candidate_name, new_status, new_score=None):
    csv_path = os.path.join(JOBS_DIR, job_id, "cv_scores.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        if 'name' in df.columns:
            # Update status
            df.loc[df['name'] == candidate_name, 'status'] = new_status
            if new_score is not None:
                df.loc[df['name'] == candidate_name, 'score'] = new_score
            
            df.to_csv(csv_path, index=False)
            
            # Log it
            _append_log(job_id, "STATUS_UPDATE", f"{candidate_name} moved to {new_status}")

def _append_log(job_id, event, details):
    log_path = os.path.join(JOBS_DIR, job_id, "activity_log.json")
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            logs = json.load(f)
    else:
        logs = []
        
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "level": "INFO", 
        "event": event, 
        "details": details
    })
    
    with open(log_path, 'w') as f:
        json.dump(logs, f, indent=4)

# --- SIMULATION TRIGGERS ---

import re
from pypdf import PdfReader

def extract_text(file_path):
    text = ""
    try:
        if file_path.endswith('.pdf'):
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        else:
            with open(file_path, 'r', errors='ignore') as f:
                text = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return text

def calculate_score(resume_text, jd_text):
    # Simple Keyword Matching Heuristic
    STOP_WORDS = {
        "and", "the", "for", "with", "you", "that", "this", "are", "will", "can", "have", 
        "looking", "team", "work", "year", "years", "experience", "skills", "knowledge", 
        "strong", "proficient", "ability", "using", "from", "role", "responsibility",
        "description", "requirements", "about", "what", "must", "should", "good"
    }

    def tokenize(text):
        # Find words with 3+ chars, alphanumeric
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        return set(w for w in words if w not in STOP_WORDS)

    jd_tokens = tokenize(jd_text)
    cv_tokens = tokenize(resume_text)
    
    if not jd_tokens:
        return 0.0
        
    common = jd_tokens.intersection(cv_tokens)
    
    # Calculate overlap ratio
    match_ratio = len(common) / len(jd_tokens)
    
    # Strict Scoring: 100% match = 10 points. 
    # To get a 10, you need to match almost all key terms.
    score = match_ratio * 10.0
    
    return min(round(score, 1), 10.0)

    return min(round(score, 1), 10.0)

def get_resume_path(job_id, candidate_name):
    job_dir = os.path.join(JOBS_DIR, job_id)
    resumes_dir = os.path.join(job_dir, "resumes")
    
    if os.path.exists(resumes_dir):
        for f in os.listdir(resumes_dir):
            if f.lower().startswith(str(candidate_name).lower()):
                return os.path.join(resumes_dir, f)
    return None

def get_matching_keywords(resume_text, jd_text):
    STOP_WORDS = {
        "and", "the", "for", "with", "you", "that", "this", "are", "will", "can", "have", 
        "looking", "team", "work", "year", "years", "experience", "skills", "knowledge", 
        "strong", "proficient", "ability", "using", "from", "role", "responsibility",
        "description", "requirements", "about", "what", "must", "should", "good", "data"
    }
    
    def tokenize(text):
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        return set(w for w in words if w not in STOP_WORDS)

    jd_tokens = tokenize(jd_text)
    cv_tokens = tokenize(resume_text)
    
    if not jd_tokens:
        return []
        
    return list(jd_tokens.intersection(cv_tokens))

def trigger_simulation_step(job_id, step_name):
    job_dir = os.path.join(JOBS_DIR, job_id)
    
    if step_name == "score_cvs":
        # Load JD
        jd_path = os.path.join(job_dir, "jd.txt")
        if os.path.exists(jd_path):
            with open(jd_path, 'r') as f:
                jd_text = f.read()
        else:
            jd_text = ""

        # Process Resumes
        csv_path = os.path.join(job_dir, "cv_scores.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            resumes_dir = os.path.join(job_dir, "resumes")
            
            updated = False
            for index, row in df.iterrows():
                # Allow re-scoring of ANY candidate if the Score Agent is triggered
                # This fixes the issue where previous dry-runs locked the status
                
                candidate_name = str(row['name'])
                
                # Find file (Robust search)
                found_file = None
                if os.path.exists(resumes_dir):
                    for f in os.listdir(resumes_dir):
                        # Match if filename starts with candidate name (ignoring case/extension differences)
                        if f.lower().startswith(candidate_name.lower()):
                            found_file = os.path.join(resumes_dir, f)
                            break
                
                if found_file:
                    cv_text = extract_text(found_file)
                    score = calculate_score(cv_text, jd_text)
                    
                    df.at[index, 'score'] = score
                    # Only update status if it was New/Error, otherwise keep it (e.g. if already Interviewing)
                    if row['status'] in ['New', 'Error (File Missing)', 'Screening']:
                        df.at[index, 'status'] = 'Screened'
                        
                    updated = True
                    _append_log(job_id, "DEBUG", f"Scored {candidate_name}: {score}/10 (File: {os.path.basename(found_file)})")
                else:
                    _append_log(job_id, "ERROR", f"Could not find resume file for {candidate_name} in {resumes_dir}")
            
            if updated:
                df.to_csv(csv_path, index=False)
                _append_log(job_id, "CV_SCORING", "Executed Real-time Scoring Analysis (Forced Refresh).")

def schedule_interview(job_id, candidate_name, date, time, interviewer):
    # Append to schedule payload
    payload_file = "schedule_payload.json"
    data = load_job_artifact(job_id, payload_file)
    if not isinstance(data, list): data = [] # Handle if it was dict or None
    
    new_event = {
        "candidate": candidate_name,
        "date": date.strftime("%Y-%m-%d"),
        "time": time.strftime("%H:%M"),
        "interviewer": interviewer,
        "status": "Scheduled"
    }
    data.append(new_event)
    save_job_artifact(job_id, payload_file, data)
    update_candidate_status(job_id, candidate_name, "Interview Scheduled")
    
    # Trigger Notifications
    send_interview_notifications(job_id, candidate_name, date, time, interviewer)
    _append_log(job_id, "INTERVIEW_SCHEDULED", f"Scheduled {candidate_name} with {interviewer}")

def send_interview_notifications(job_id, candidate_name, date, time, interviewer):
    """
    Simulates sending emails/invites.
    """
    # Local simulation log
    log_msg = f"""
    [MOCK EMAIL SERVER]
    To: {candidate_name.replace(' ','').lower()}@example.com
    Subject: Interview Invitation
    Body: You are invited to Round 1 Interview on {date} at {time}.
    
    [MOCK INTERNAL CALENDAR]
    To: {interviewer}@company.com
    Subject: Interview with {candidate_name} added to calendar.
    """
    # We just log it for now to the activity log with a special flag
    _append_log(job_id, "NOTIFICATION_SENT", f"Invites sent to {candidate_name} and {interviewer}")
    # In a real app, this would use SMTP or SendGrid
    return True

def generate_offer(job_id, candidate_name, salary):
    offer_text = f"""
    OFFER OF EMPLOYMENT
    
    Dear {candidate_name},
    
    We are delighted to offer you the position.
    
    Compensation: ${salary} per annum.
    
    Welcome to the team!
    """
    save_job_artifact(job_id, "offer_letter.txt", offer_text)
    
    payload = {
        "candidate": candidate_name,
        "salary": salary,
        "status": "PENDING_APPROVAL"
    }
    save_job_artifact(job_id, "offer_payload.json", payload)
    update_candidate_status(job_id, candidate_name, "Offer Pending")
    _append_log(job_id, "OFFER_GENERATED", f"Generated offer for {candidate_name} (${salary})")

def conduct_agent_call(job_id, candidate_name):
    """
    Simulates an AI Agent calling the candidate to verify constraints.
    Returns: (transcript, new_score, pass_fail)
    """
    import random
    
    # Load JD to find constraints (Mocking extraction)
    # in real world, we'd parse "5 years", "New York" etc.
    jd_text = load_job_artifact(job_id, "jd.txt") or ""
    
    # Mock constraints check
    topics = ["Experience Confirmation", "Location Check", "Notice Period", "Salary Expectations"]
    transcript = f"--- AI AGENT CALL TRANSCRIPT ---\nCandidate: {candidate_name}\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    score_bump = 0
    
    transcript += "Agent: Hi, I'm the AI Recruiter. Do you have a moment?\n"
    transcript += "Candidate: Yes, sure.\n\n"
    
    # Simulating a check
    if "python" in jd_text.lower():
        transcript += "Agent: Verify your Python experience years?\n"
        transcript += "Candidate: I have around 6 years of hands-on Python.\n"
        transcript += "[Analyzed: MATCHES_REQUIREMENT] (+1.0)\n\n"
        score_bump += 1
    
    transcript += "Agent: Are you located in or willing to relocate to the job location?\n"
    if "remote" in jd_text.lower():
        transcript += "Candidate: I am working remotely.\n"
        transcript += "[Analyzed: MATCHES_REMOTE_POLICY] (+1.0)\n\n"
        score_bump += 1
    else:
        transcript += "Candidate: Yes, I am local.\n"
        transcript += "[Analyzed: MATCHES_LOCATION] (+1.0)\n\n"
        score_bump += 1
        
    transcript += "Agent: What is your notice period?\n"
    transcript += "Candidate: 30 days.\n"
    transcript += "[Analyzed: ACCEPTABLE] (+0.5)\n\n"
    score_bump += 0.5
    
    transcript += "Agent: Thank you. HR will be in touch.\n"
    transcript += "--- END CALL ---"
    
    # Calculate Final Screening Score (Base 5 + Bumps)
    final_screen_score = min(5.0 + score_bump, 10.0)
    
    # Save Transcript
    filename = f"call_log_{candidate_name.replace(' ', '_')}.txt"
    save_job_artifact(job_id, filename, transcript)
    
    # Update Status AND Score in CSV
    # We need a custom update to handle the new column 'screening_score'
    csv_path = os.path.join(JOBS_DIR, job_id, "cv_scores.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        if 'screening_score' not in df.columns:
            df['screening_score'] = 0.0
            
        idx = df[df['name'] == candidate_name].index
        if not idx.empty:
            df.loc[idx, 'status'] = "AI Screened"
            df.loc[idx, 'screening_score'] = final_screen_score
            df.to_csv(csv_path, index=False)
    
    _append_log(job_id, "AI_CALL_COMPLETED", f"Agent called {candidate_name}. Score: {final_screen_score}")
    
    return transcript, final_screen_score

def approve_offer(job_id, candidate_name):
    payload = load_job_artifact(job_id, "offer_payload.json")
    if payload:
        payload["status"] = "APPROVED"
        payload["approved_at"] = datetime.now().isoformat()
        save_job_artifact(job_id, "offer_payload.json", payload)
        update_candidate_status(job_id, candidate_name, "Offer Accepted")
        _append_log(job_id, "OFFER_APPROVED", f"Offer for {candidate_name} approved by HR.")

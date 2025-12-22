import os
import json
import shutil
import pandas as pd
from datetime import datetime
import re

from . import llm

JOBS_DIR = "jobs"
JOB_META_FILENAME = "job_meta.json"

# --- CORE UTILS ---

def ensure_jobs_dir():
    if not os.path.exists(JOBS_DIR):
        os.makedirs(JOBS_DIR)

def _safe_job_id(job_id: str) -> str:
    # prevent path traversal
    jid = str(job_id or "")
    if jid == "" or jid.startswith(".") or "/" in jid or "\\" in jid:
        raise ValueError("Invalid job_id")
    return jid

def _job_dir(job_id: str) -> str:
    jid = _safe_job_id(job_id)
    return os.path.join(JOBS_DIR, jid)

def load_job_meta(job_id: str):
    try:
        path = os.path.join(_job_dir(job_id), JOB_META_FILENAME)
    except Exception:
        return None
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except:
            return None
    return None

def save_job_meta(job_id: str, meta: dict):
    path = os.path.join(_job_dir(job_id), JOB_META_FILENAME)
    with open(path, "w") as f:
        json.dump(meta or {}, f, indent=2)

def set_job_archived(job_id: str, archived: bool):
    meta = load_job_meta(job_id) or {}
    meta["archived"] = bool(archived)
    meta.setdefault("updated_at", datetime.now().isoformat())
    meta["updated_at"] = datetime.now().isoformat()
    save_job_meta(job_id, meta)
    _append_log(job_id, "JOB_ARCHIVED" if archived else "JOB_RESTORED", f"archived={archived}")
    return True

def delete_job(job_id: str):
    d = _job_dir(job_id)
    try:
        if os.path.isdir(d):
            shutil.rmtree(d)
        return True
    except Exception:
        # If the dir is already gone or partially missing, consider it deleted
        return False

def get_all_jobs():
    ensure_jobs_dir()
    jobs = []
    if not os.path.exists(JOBS_DIR):
        return []
    
    for dirname in os.listdir(JOBS_DIR):
        dirpath = os.path.join(JOBS_DIR, dirname)
        if os.path.isdir(dirpath):
            meta = None
            try:
                meta = load_job_meta(dirname)
            except:
                meta = None
            created_time = "Unknown"
            # Try to parse timestamp from dirname id
            try:
                # Expected suffix from create_new_job_with_resumes: ..._{YYYYMMDD}_{HHMMSS}
                # Many older folders may not match this format, so we best-effort parse an 8-digit date.
                parts = dirname.split('_')
                date_token = parts[-2] if len(parts) >= 2 else None
                if date_token and re.fullmatch(r"\d{8}", date_token):
                    created_time = datetime.strptime(date_token, "%Y%m%d").strftime("%b %d, %Y")
                else:
                    m = re.search(r"(\d{8})", dirname)
                    if m:
                        created_time = datetime.strptime(m.group(1), "%Y%m%d").strftime("%b %d, %Y")
            except:
                pass

            job_info = {
                "id": dirname, 
                # Drop the trailing timestamp tokens to avoid many identical titles like "Qa Lead 20251213"
                "title": (meta or {}).get("title") or (" ".join(dirname.split("_")[:-2]).replace("_", " ").title() if len(dirname.split("_")) >= 3 else dirname.replace("_", " ").title()),
                "created_at": (meta or {}).get("created_at_display") or created_time,
                "created_at_iso": (meta or {}).get("created_at_iso"),
                "candidate_count": _get_candidate_count(dirname),
                "archived": bool((meta or {}).get("archived", False)),
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

    # Save job metadata (source of truth for title/archived)
    now = datetime.now()
    save_job_meta(job_id, {
        "id": job_id,
        "title": title,
        "archived": False,
        "created_at_iso": now.isoformat(),
        "created_at_display": now.strftime("%b %d, %Y"),
        "updated_at": now.isoformat(),
    })
        
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
            {
                "name": f.split('.')[0],
                "score": 0.0,
                "status": "New",
                "id": f"cand_{i}",
                "matching_keywords": "",
                "email": "",
                "phone": ""
            } 
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
    
    new_rows = []
    # Save files and extract contact info
    for uploaded_file in uploaded_files:
        file_path = os.path.join(resumes_dir, uploaded_file.name)
        with open(file_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        saved_files.append(uploaded_file.name)
        try:
            txt = extract_text(file_path)
        except Exception:
            txt = ""
        email, phone = extract_contacts(txt)
        new_rows.append({
            "name": uploaded_file.name.split('.')[0],
            "score": 0.0,
            "status": "New",
            "id": f"cand_new_{datetime.now().microsecond}",
            "matching_keywords": "",
            "email": email or "",
            "phone": phone or ""
        })
        
    _append_log(job_id, "RESUMES_INGESTED", f"Added {len(saved_files)} resumes: {', '.join(saved_files)}")
    
    # Update CSV
    csv_path = os.path.join(job_dir, "cv_scores.csv")
    new_data = pd.DataFrame(new_rows)
    
    if os.path.exists(csv_path):
        try:
            old_df = pd.read_csv(csv_path)
            # Ensure contact columns exist
            if "email" not in old_df.columns:
                old_df["email"] = ""
            if "phone" not in old_df.columns:
                old_df["phone"] = ""
            # Concat and dedup by name for simulation simplicity
            combined_df = pd.concat([old_df, new_data], ignore_index=True)
            combined_df.drop_duplicates(subset=['name'], keep='last', inplace=True)
            combined_df.to_csv(csv_path, index=False)
        except:
             new_data.to_csv(csv_path, index=False)
    else:
        new_data.to_csv(csv_path, index=False)

    # If a JD exists, automatically score/rescore against it so uploads immediately "work"
    try:
        jd_text = load_job_artifact(job_id, "jd.txt") or ""
        # Force string conversion and strip
        if jd_text and str(jd_text).strip():
            trigger_simulation_step(job_id, "score_cvs")
        else:
            _append_log(job_id, "WARN", "Resume ingested but NO JD found. Score is 0. Add JD to evaluate.")
    except Exception as e:
        _append_log(job_id, "ERROR", f"Auto-scoring failed: {e}")

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
    logs = []
    if os.path.exists(log_path):
        try:
            with open(log_path, 'r') as f:
                logs = json.load(f)
                if not isinstance(logs, list):
                    logs = []
        except Exception:
            # Corrupted log: reset to empty to unblock scoring/upload
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
    """
    Best-effort text extraction for PDF, DOCX, and plaintext.
    Keeps things dependency-light; DOCX handled via zip XML parse fallback.
    """
    text = ""
    try:
        if file_path.lower().endswith(".pdf"):
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
        elif file_path.lower().endswith(".docx"):
            import zipfile
            try:
                with zipfile.ZipFile(file_path) as z:
                    with z.open("word/document.xml") as doc_xml:
                        raw = doc_xml.read().decode("utf-8", errors="ignore")
                        # Strip XML tags for quick text
                        text = re.sub(r"<[^>]+>", " ", raw)
            except Exception as e:
                print(f"Error parsing docx {file_path}: {e}")
        else:
            with open(file_path, "r", errors="ignore") as f:
                text = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return text

def extract_contacts(text: str):
    """
    Extract a best-effort (email, phone) tuple from resume text.
    Email: first RFC-like hit.
    Phone: first sequence of digits with optional + and separators, normalized to + and digits.
    """
    if not text:
        return None, None
    email = None
    phone = None
    try:
        emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        if emails:
            email = emails[0]
    except Exception:
        pass
    try:
        phones = re.findall(r"(\+?\d[\d\s().-]{7,}\d)", text)
        if phones:
            raw = phones[0]
            phone = re.sub(r"[^\d+]", "", raw)
    except Exception:
        pass
    return email, phone

def calculate_score(resume_text, jd_text):
    """
    Evenly distributes 10 points across unique JD tokens; each matched token
    contributes an equal share toward the total score (capped at 10).
    """
    STOP_WORDS = {
        "and", "the", "for", "with", "you", "that", "this", "are", "will", "can", "have",
        "looking", "team", "work", "year", "years", "experience", "skills", "knowledge",
        "strong", "proficient", "ability", "using", "from", "role", "responsibility",
        "description", "requirements", "about", "what", "must", "should", "good", "data",
        "them", "their", "they", "there", "here", "such", "including", "include", "ensure", "ensuring",
        "per", "each", "other", "our", "your", "his", "her", "its",
        "maintain", "maintaining", "maintenance", "test", "tests", "testing"
    }

    def tokenize(text):
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        return [w for w in words if w not in STOP_WORDS]

    jd_tokens = tokenize(jd_text)
    # Unique JD tokens preserve order for weighting
    seen = set()
    jd_unique = []
    for t in jd_tokens:
        if t not in seen:
            seen.add(t)
            jd_unique.append(t)

    cv_tokens = set(tokenize(resume_text))

    if not jd_unique:
        return 0.0

    common = [t for t in jd_unique if t in cv_tokens]
    common_count = len(common)

    # Avoid tiny JDs yielding auto-10; use minimum denominator of 5 tokens
    denom = max(5, len(jd_unique))
    weight_per_token = 10.0 / denom
    score = common_count * weight_per_token

    return round(min(score, 10.0), 1)

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
        "description", "requirements", "about", "what", "must", "should", "good", "data",
        "them", "their", "they", "there", "here", "such", "including", "include", "ensure", "ensuring",
        "per", "each", "other", "our", "your", "his", "her", "its",
        "maintain", "maintaining", "maintenance", "test", "tests", "testing"
    }

    def tokenize(text):
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        return [w for w in words if w not in STOP_WORDS]

    jd_tokens = tokenize(jd_text)
    # preserve unique JD tokens in order
    seen = set()
    jd_unique = []
    for t in jd_tokens:
        if t not in seen:
            seen.add(t)
            jd_unique.append(t)

    cv_tokens = set(tokenize(resume_text))

    if not jd_unique:
        return []

    # Preserve JD order for explainability
    matches = [t for t in jd_unique if t in cv_tokens]
    # Deduplicate while preserving order
    seen = set()
    ordered = []
    for t in matches:
        if t not in seen:
            seen.add(t)
            ordered.append(t)
    return ordered

# --- LLM Agent Helpers ---

def _slug(text: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "_", str(text or "")).strip("_") or "item"

def _read_resume_text(job_id: str, candidate_name: str, max_chars: int = 4000) -> str:
    path = get_resume_path(job_id, candidate_name)
    if not path:
        return ""
    txt = extract_text(path) or ""
    return txt[:max_chars]

def _get_candidate_row(job_id: str, candidate_name: str):
    csv_path = os.path.join(JOBS_DIR, job_id, "cv_scores.csv")
    if not os.path.exists(csv_path):
        return {}
    df = pd.read_csv(csv_path)
    row = df[df["name"] == candidate_name]
    if row.empty:
        return {}
    r = row.iloc[0].to_dict()
    return r

def _update_candidate_contact(job_id: str, candidate_name: str, email: str = None, phone: str = None):
    """
    Persist contact details back to cv_scores.csv for reuse across scheduling/notifications.
    """
    if not email and not phone:
        return
    csv_path = os.path.join(JOBS_DIR, job_id, "cv_scores.csv")
    if not os.path.exists(csv_path):
        return
    try:
        df = pd.read_csv(csv_path)
        if "email" not in df.columns:
            df["email"] = ""
        if "phone" not in df.columns:
            df["phone"] = ""
        mask = df["name"] == candidate_name
        if not mask.any():
            return
        if email:
            df.loc[mask, "email"] = df.loc[mask, "email"].fillna("").replace("", email)
            df.loc[mask, "email"] = email  # overwrite with latest
        if phone:
            df.loc[mask, "phone"] = df.loc[mask, "phone"].fillna("").replace("", phone)
            df.loc[mask, "phone"] = phone  # overwrite with latest
        df.to_csv(csv_path, index=False)
    except Exception as e:
        _append_log(job_id, "WARN", f"Contact persistence failed for {candidate_name}: {e}")

def _get_contact(job_id: str, candidate_name: str):
    """
    Return (email, phone). Prefer stored CSV contact; fallback to resume extraction.
    """
    cand = _get_candidate_row(job_id, candidate_name)
    def _norm(val):
        if val is None:
            return None
        try:
            import math
            if isinstance(val, float) and math.isnan(val):
                return None
        except Exception:
            pass
        try:
            import pandas as pd
            if pd.isna(val):  # type: ignore
                return None
        except Exception:
            pass
        s = str(val).strip()
        return s if s else None

    email = _norm(cand.get("email")) if isinstance(cand, dict) else None
    phone = _norm(cand.get("phone")) if isinstance(cand, dict) else None
    if email or phone:
        return email, phone

    # Fallback: attempt extraction from resume text
    txt = _read_resume_text(job_id, candidate_name, max_chars=6000)
    ext_email, ext_phone = extract_contacts(txt)
    if ext_email or ext_phone:
        _update_candidate_contact(job_id, candidate_name, ext_email, ext_phone)
    return ext_email, ext_phone

def generate_interview_guide(job_id: str, candidate_name: str, round_type: str):
    jd_text = load_job_artifact(job_id, "jd.txt") or ""
    resume_excerpt = _read_resume_text(job_id, candidate_name)
    cand = _get_candidate_row(job_id, candidate_name)
    score = cand.get("score")
    matches = cand.get("matching_keywords", "")
    contact_email = cand.get("email", "")
    contact_phone = cand.get("phone", "")
    # Normalize matches to readable string/list
    try:
        if isinstance(matches, str) and matches.strip().startswith("["):
            matches = json.loads(matches)
    except Exception:
        pass
    if isinstance(matches, list):
        matches_readable = ", ".join(matches[:10])
    else:
        matches_readable = str(matches or "")

    def _basic_fallback():
        return {
            "fundamentals": [
                "Walk me through your test automation stack and where you added the most value.",
                "How do you decide what to automate vs. keep manual?"
            ],
            "depth": [
                "Explain a tricky flakiness issue you debugged in Selenium/Playwright.",
                "How do you design fixtures and test data to keep suites stable?"
            ],
            "design_or_system": [
                "Sketch a CI pipeline for parallel UI + API tests with reporting and retries.",
                "How would you scale the framework for a fast-changing web app?"
            ],
            "behavioral": [
                "Tell me about a time you pushed back on unrealistic test timelines.",
                "Describe how you mentored someone new to automation."
            ],
            "red_flags": [
                "Relies only on record/playback or lacks assertions strategy.",
                "No approach for flakiness handling, waits, or test isolation."
            ]
        }

    prompt = f"""
You are an interview co-pilot. Create a tailored question set for round: {round_type}.
Ground questions in both the JD and THIS candidate's resume. Avoid generic repeats; cite tools/skills seen in the resume.
Return JSON only:
{{
  "fundamentals": [ "..." ],
  "depth": [ "..." ],
  "design_or_system": [ "..." ],
  "behavioral": [ "..." ],
  "red_flags": [ "..." ]
}}
Context:
JD (truncated):
{jd_text[:3000]}

Candidate snapshot:
score: {score}
matches: {matches_readable}
contact_email: {contact_email}
contact_phone: {contact_phone}

Resume excerpt (truncate to what you need):
{resume_excerpt[:1400]}
"""
    guide = None
    systems = [
        "Be concise. JSON only. Keep lists <= 6 items. No trailing commas.",
        "Return strict JSON only. Lists max 5 items. No extra commentary.",
    ]
    for sys_prompt in systems:
        try:
            guide = llm.call_llm_json(
                prompt,
                system=sys_prompt,
                max_tokens=480,
                temperature=0.12,
            )
            break
        except llm.LLMError:
            continue
    if not guide or not isinstance(guide, dict):
        guide = _basic_fallback()

    # persist
    folder = os.path.join(JOBS_DIR, job_id, "interviews")
    os.makedirs(folder, exist_ok=True)
    fname = os.path.join(folder, f"{_slug(candidate_name)}_{_slug(round_type)}_guide.json")
    with open(fname, "w") as f:
        json.dump(guide, f, indent=2)
    return guide

def evaluate_interview(job_id: str, candidate_name: str, round_type: str, transcript: str):
    jd_text = load_job_artifact(job_id, "jd.txt") or ""
    cand = _get_candidate_row(job_id, candidate_name)
    score = cand.get("score")
    matches = cand.get("matching_keywords", "")

    prompt = f"""
You are an interview evaluator for round: {round_type}.
Return JSON with:
{{
  "overall_score_0_10": number,
  "skill_scores": {{"skill": number}},
  "strengths": ["..."],
  "concerns": ["..."],
  "hire_recommendation": "yes|maybe|no",
  "rationale": "short paragraph",
  "matched_keywords": ["..."]
}}

JD:
{jd_text[:3000]}

Candidate snapshot:
score: {score}
matches: {matches}

Transcript/Q&A:
{transcript[:4000]}
"""
    evaluation = llm.call_llm_json(prompt, system="Be concise. JSON only. Scores 0-10.")

    folder = os.path.join(JOBS_DIR, job_id, "interviews")
    os.makedirs(folder, exist_ok=True)
    fname = os.path.join(folder, f"{_slug(candidate_name)}_{_slug(round_type)}_evaluation.json")
    with open(fname, "w") as f:
        json.dump(evaluation, f, indent=2)
    return evaluation

def summarize_interviews(job_id: str, candidate_name: str):
    folder = os.path.join(JOBS_DIR, job_id, "interviews")
    summaries = []
    if os.path.isdir(folder):
        for fn in os.listdir(folder):
            if fn.startswith(_slug(candidate_name)) and fn.endswith("_evaluation.json"):
                try:
                    with open(os.path.join(folder, fn)) as f:
                        summaries.append(json.load(f))
                except Exception:
                    continue

    prompt = f"""
You are summarizing multi-round interviews. Create a concise rollup.
Return JSON:
{{
  "final_recommendation": "yes|maybe|no",
  "overall_score_0_10": number,
  "strengths": ["..."],
  "concerns": ["..."],
  "risks": ["..."],
  "next_steps": ["..."]
}}

Round evaluations:
{json.dumps(summaries)[:4000]}
"""
    summary = llm.call_llm_json(prompt, system="Be concise. JSON only.")

    os.makedirs(folder, exist_ok=True)
    fname = os.path.join(folder, f"{_slug(candidate_name)}_summary.json")
    with open(fname, "w") as f:
        json.dump(summary, f, indent=2)
    return summary

# --- JD Improve Agent ---
def improve_jd(job_id: str):
    jd_text = load_job_artifact(job_id, "jd.txt") or ""
    jt = str(jd_text or "").strip()
    PLACEHOLDER_MARKERS = [
        "job description is empty",
        "please provide content",
        "please paste the job description",
        "add your jd",
        "here’s a quick scaffold",
        "role summary and mission",
    ]
    def _is_empty(text: str) -> bool:
        if not text or not str(text).strip():
            return True
        low = str(text).lower()
        return any(marker in low for marker in PLACEHOLDER_MARKERS)

    # If there is no JD (or only placeholder), return a gentle nudge without overwriting the file
    if _is_empty(jt):
        return {
            "improved_jd": (
                "Please paste the Job Description to improve. Here’s a quick scaffold:\n"
                "- Role summary and mission\n"
                "- Top 5 must-have skills/tech\n"
                "- Experience range and location/remote\n"
                "- Team context and impact\n"
                "- Nice-to-haves and growth paths"
            ),
            "must_have_keywords": ["role summary", "must-have skills", "experience", "location", "impact"],
            "risks": ["No JD provided yet; add content to get an improved draft."]
        }
    prompt = f"""
You are a JD improvement assistant. Given the JD, tighten it, highlight must-have skills, and return improved text plus a keyword list.
Return JSON:
{{
  "improved_jd": "...",
  "must_have_keywords": ["..."],
  "risks": ["..."]
}}
JD:
{jd_text[:4000]}
"""
    def _strip_fences(text: str) -> str:
        if not isinstance(text, str):
            return text
        t = text.strip()
        if t.startswith("```"):
            t = t.lstrip("`")
            if t.lower().startswith("json"):
                t = t[4:].strip()
        if t.endswith("```"):
            t = t[:-3].strip()
        return t

    # Plain-text rewrite with inline keywords to avoid brittle JSON parsing
    try:
        raw = llm.call_llm(
            prompt,
            system=(
                "Rewrite the JD concisely in plain text. No markdown, no code fences. "
                "STRICT: keep all hard constraints (years of experience, location, remote/on-site, certifications, tech stack) verbatim; do not drop numbers like '4 years'. "
                "At the end add a line starting exactly with 'Keywords:' followed by comma-separated must-have skills, including any numeric/tenure requirements."
            ),
            max_tokens=800,
            temperature=0.25,
        )
    except Exception as e:
        raw = ""
        return {
            "improved_jd": jd_text,
            "must_have_keywords": [],
            "risks": [f"LLM rewrite failed: {e}"]
        }

    raw = _strip_fences(raw or "")
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    keywords_line = ""
    body_lines = []
    for ln in lines:
        if ln.lower().startswith("keywords:"):
            keywords_line = ln
        else:
            body_lines.append(ln)

    improved = "\n".join(body_lines).strip() or jd_text
    kw_list = []
    if keywords_line:
        tail = keywords_line.split(":", 1)[1] if ":" in keywords_line else ""
        kw_list = [k.strip() for k in tail.split(",") if k.strip()]

    # Heuristic keywords if none extracted
    if not kw_list:
        import re as _re
        STOP = {"and","the","with","for","a","an","of","to","in","on","at","by","from","that","this","these","those","you","your","our","we","will","can","is","are","be","as","or","if","but"}
        tokens = _re.findall(r"[A-Za-z]{3,}", jd_text.lower())
        freq = {}
        for t in tokens:
            if t in STOP:
                continue
            freq[t] = freq.get(t, 0) + 1
        kw_list = [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:8]]

    result = {
        "improved_jd": improved,
        "must_have_keywords": kw_list,
        "risks": [],
    }

    if not _is_empty(jt):
        save_job_artifact(job_id, "jd.txt", result.get("improved_jd", jd_text))
        save_job_artifact(job_id, "jd_keywords.json", result)
    return result

# --- LLM Resume Scoring Agent ---
def llm_score_candidates(job_id: str):
    jd_text = load_job_artifact(job_id, "jd.txt") or ""
    csv_path = os.path.join(JOBS_DIR, job_id, "cv_scores.csv")
    if not os.path.exists(csv_path):
        return {"updated": 0}
    df = pd.read_csv(csv_path)
    if df.empty:
        return {"updated": 0}

    updated = 0
    for idx, row in df.iterrows():
        candidate = row.get("name")
        resume_text = _read_resume_text(job_id, candidate, max_chars=3500)
        if not resume_text.strip():
            continue
        prompt = f"""
Score this resume against the JD. Return JSON:
{{
  "score_0_10": number,
  "matched_keywords": ["..."],
  "rationale": "short"
}}
JD:
{jd_text[:3000]}

Resume:
{resume_text}
"""
        try:
            res = llm.call_llm_json(prompt, system="Be concise. JSON only. Score 0-10.")
            df.at[idx, "score"] = res.get("score_0_10", row.get("score", 0))
            df.at[idx, "matching_keywords"] = json.dumps(res.get("matched_keywords", []))
            updated += 1
        except llm.LLMError:
            continue
    df.to_csv(csv_path, index=False)
    return {"updated": updated}

# --- Screening Assessment Agent ---
def screening_assess(job_id: str, candidate_name: str, transcript: str):
    jd_text = load_job_artifact(job_id, "jd.txt") or ""
    cand = _get_candidate_row(job_id, candidate_name)
    score = cand.get("score")
    matches = cand.get("matching_keywords", "")
    prompt = f"""
You are a screening assessor. Given JD, candidate snapshot, and transcript, provide a concise assessment.
Return JSON:
{{
  "assessment": "short paragraph",
  "hire_recommendation": "yes|maybe|no",
  "risks": ["..."],
  "next_questions": ["..."]
}}
JD:
{jd_text[:2500]}

Candidate:
score: {score}
matches: {matches}

Transcript:
{transcript[:4000]}
"""
    return llm.call_llm_json(prompt, system="Be concise. JSON only.")

# --- Offer Draft Agent ---
def offer_assist(job_id: str, candidate_name: str, salary: int = None):
    jd_text = load_job_artifact(job_id, "jd.txt") or ""
    cand = _get_candidate_row(job_id, candidate_name)
    score = cand.get("score")
    matches = cand.get("matching_keywords", "")
    prompt = f"""
Draft a concise offer summary. Return JSON:
{{
  "summary": "short paragraph",
  "risks": ["..."],
  "negotiation_points": ["..."],
  "salary_recommendation": "..."
}}
JD:
{jd_text[:2500]}

Candidate:
score: {score}
matches: {matches}
target_salary: {salary}
"""
    return llm.call_llm_json(prompt, system="Be concise. JSON only.")

# --- Slot Suggest Agent ---
def suggest_slots(job_id: str, candidate_name: str):
    prompt = """
Propose 4 interview slot options in the next 7 days. Return JSON:
{
  "slots": [
    {"day": "Mon", "time": "10:00", "timezone": "local", "note": "..."},
    ...
  ]
}
Keep concise.
"""
    return llm.call_llm_json(prompt, system="Be concise. JSON only.")

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
            # Ensure matching_keywords column exists
            if 'matching_keywords' not in df.columns:
                df['matching_keywords'] = ""
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
                    matches = get_matching_keywords(cv_text, jd_text)
                    
                    df.at[index, 'score'] = score
                    df.at[index, 'matching_keywords'] = json.dumps(matches)
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
    payload_file = "schedule_payload.json"
    data = load_job_artifact(job_id, payload_file)
    if not isinstance(data, list): 
        data = [] # Handle if it was dict or None
    
    # Upsert: remove existing entry for this candidate, then add fresh
    data = [ev for ev in data if ev.get("candidate") != candidate_name]

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
    notice = send_interview_notifications(job_id, candidate_name, date, time, interviewer)
    _append_log(job_id, "INTERVIEW_SCHEDULED", f"Scheduled {candidate_name} with {interviewer}")
    return notice

def get_schedule(job_id):
    payload_file = "schedule_payload.json"
    data = load_job_artifact(job_id, payload_file)
    if not isinstance(data, list):
        return []
    return data

def cancel_interview(job_id, candidate_name):
    payload_file = "schedule_payload.json"
    data = load_job_artifact(job_id, payload_file)
    if not isinstance(data, list):
        data = []
    before = len(data)
    data = [ev for ev in data if ev.get("candidate") != candidate_name]
    save_job_artifact(job_id, payload_file, data)
    update_candidate_status(job_id, candidate_name, "AI Screened")
    if before != len(data):
        _append_log(job_id, "INTERVIEW_CANCELLED", f"Cancelled interview for {candidate_name}")
    return True

def reschedule_interview(job_id, candidate_name, date, time, interviewer):
    # Reuse upsert logic
    return schedule_interview(job_id, candidate_name, date, time, interviewer)

def send_interview_notifications(job_id, candidate_name, date, time, interviewer):
    """
    Simulates sending emails/invites.
    """
    # Try to use real contact info; fallback to mock
    cand_email, cand_phone = _get_contact(job_id, candidate_name)
    candidate_email = cand_email or f"{candidate_name.replace(' ','').lower()}@example.com"
    candidate_phone = cand_phone or "Not found"
    interviewer_email = f"{interviewer}@company.com"
    log_msg = f"""
[MOCK EMAIL SERVER]
To: {candidate_email} | Phone: {candidate_phone}
Subject: Interview Invitation
Body: You are invited to Round 1 Interview on {date} at {time}. If you prefer phone/SMS, we will contact: {candidate_phone}.

[MOCK INTERNAL CALENDAR]
To: {interviewer_email}
Subject: Interview with {candidate_name} added to calendar.
"""
    _append_log(job_id, "NOTIFICATION_SENT", f"Invites sent to {candidate_email} ({candidate_phone}) and {interviewer_email}")
    return {
        "candidate_email": candidate_email,
        "candidate_phone": candidate_phone,
        "interviewer_email": interviewer_email,
        "message": "Notifications queued (mock).",
        "details": log_msg.strip()
    }

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

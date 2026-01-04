"""
Interview Assist Agent - Real-time interview assistance
Supports: Microsoft Teams, Google Meet integration
Provides: Live question suggestions, candidate analysis, real-time feedback
"""
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
import asyncio

import sys
import os

# Add parent directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import utils and llm from parent directory
import llm
import utils


class InterviewAssistAgent:
    """
    AI-powered interview assistant that can join video calls
    and provide real-time assistance to interviewers.
    """
    
    def __init__(self):
        self.teams_client_id = os.getenv("TEAMS_CLIENT_ID")
        self.teams_client_secret = os.getenv("TEAMS_CLIENT_SECRET")
        self.teams_tenant_id = os.getenv("TEAMS_TENANT_ID")
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        self.active_interviews = {}  # Track active interview sessions
    
    async def join_interview(
        self,
        job_id: str,
        candidate_name: str,
        interview_type: str,
        meeting_platform: str = "teams",  # "teams" or "google_meet"
        meeting_link: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Join an interview call and provide real-time assistance.
        
        Args:
            job_id: Job ID
            candidate_name: Candidate name
            interview_type: Type of interview (technical, behavioral, etc.)
            meeting_platform: "teams" or "google_meet"
            meeting_link: Optional meeting link/ID
        
        Returns:
            Session info and initial guidance
        """
        # Load candidate context
        jd_text = utils.load_job_artifact(job_id, "jd.txt") or ""
        resume_text = utils._read_resume_text(job_id, candidate_name, max_chars=3000)
        cand = utils._get_candidate_row(job_id, candidate_name)
        
        # Generate interview guide
        guide = utils.generate_interview_guide(job_id, candidate_name, interview_type)
        
        # Create interview session
        session_id = f"{job_id}_{candidate_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        session = {
            "session_id": session_id,
            "job_id": job_id,
            "candidate_name": candidate_name,
            "interview_type": interview_type,
            "platform": meeting_platform,
            "meeting_link": meeting_link,
            "started_at": datetime.now().isoformat(),
            "guide": guide,
            "questions_asked": [],
            "candidate_responses": [],
            "real_time_notes": [],
            "status": "active"
        }
        
        self.active_interviews[session_id] = session
        
        # Generate initial briefing
        briefing = self._generate_interview_briefing(job_id, candidate_name, jd_text, resume_text, guide)
        
        utils._append_log(
            job_id,
            "INTERVIEW_STARTED",
            f"AI assistant joined {interview_type} interview with {candidate_name} on {meeting_platform}"
        )
        
        return {
            "session_id": session_id,
            "status": "joined",
            "platform": meeting_platform,
            "briefing": briefing,
            "guide": guide,
            "meeting_link": meeting_link or self._generate_meeting_link(meeting_platform, session_id)
        }
    
    def _generate_interview_briefing(
        self,
        job_id: str,
        candidate_name: str,
        jd_text: str,
        resume_text: str,
        guide: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate pre-interview briefing for interviewer."""
        prompt = f"""
        Generate a concise interview briefing for the interviewer.
        
        Return JSON:
        {{
            "candidate_summary": "2-3 sentence summary",
            "key_strengths": ["...", "..."],
            "areas_to_probe": ["...", "..."],
            "red_flags_to_watch": ["...", "..."],
            "recommended_questions": ["...", "..."],
            "evaluation_criteria": {{
                "technical_skills": "what to assess",
                "communication": "what to assess",
                "cultural_fit": "what to assess"
            }}
        }}
        
        Job Description:
        {jd_text[:2000]}
        
        Candidate Resume:
        {resume_text[:1500]}
        
        Interview Guide:
        {json.dumps(guide, indent=2)[:1000]}
        """
        
        try:
            briefing = llm.call_llm_json(
                prompt,
                system="Generate a focused, actionable interview briefing. JSON only.",
                max_tokens=1000,
                temperature=0.2
            )
            return briefing
        except Exception as e:
            return {
                "candidate_summary": f"Candidate {candidate_name} applying for the position.",
                "key_strengths": ["Review resume for details"],
                "areas_to_probe": ["Experience", "Skills", "Cultural fit"],
                "recommended_questions": guide.get("fundamentals", [])[:3]
            }
    
    async def process_interview_transcript(
        self,
        session_id: str,
        transcript_chunk: str,
        speaker: str = "candidate"  # "candidate" or "interviewer"
    ) -> Dict[str, Any]:
        """
        Process real-time transcript and provide feedback.
        Called during the interview as conversation happens.
        """
        if session_id not in self.active_interviews:
            return {"error": "Session not found"}
        
        session = self.active_interviews[session_id]
        
        # Add to transcript
        if speaker == "candidate":
            session["candidate_responses"].append({
                "timestamp": datetime.now().isoformat(),
                "text": transcript_chunk
            })
        else:
            session["questions_asked"].append({
                "timestamp": datetime.now().isoformat(),
                "text": transcript_chunk
            })
        
        # Generate real-time insights
        insights = await self._generate_real_time_insights(
            session["job_id"],
            session["candidate_name"],
            transcript_chunk,
            session
        )
        
        session["real_time_notes"].append({
            "timestamp": datetime.now().isoformat(),
            "insights": insights
        })
        
        return {
            "session_id": session_id,
            "insights": insights,
            "suggested_followup": insights.get("suggested_followup", ""),
            "red_flags_detected": insights.get("red_flags", [])
        }
    
    async def _generate_real_time_insights(
        self,
        job_id: str,
        candidate_name: str,
        latest_response: str,
        session: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate real-time insights from candidate response."""
        jd_text = utils.load_job_artifact(job_id, "jd.txt") or ""
        
        # Get recent conversation context
        recent_q = session["questions_asked"][-2:] if session["questions_asked"] else []
        recent_a = session["candidate_responses"][-3:] if session["candidate_responses"] else []
        
        prompt = f"""
        Analyze the latest candidate response in real-time and provide insights.
        
        Return JSON:
        {{
            "response_quality": "excellent|good|fair|poor",
            "key_points_mentioned": ["...", "..."],
            "strengths_demonstrated": ["...", "..."],
            "concerns": ["...", "..."],
            "suggested_followup": "next question to ask",
            "red_flags": ["..."],
            "confidence_score": 0-10
        }}
        
        Job Description:
        {jd_text[:1500]}
        
        Recent Questions:
        {json.dumps(recent_q, indent=2)}
        
        Latest Candidate Response:
        {latest_response}
        
        Previous Responses:
        {json.dumps(recent_a[:-1] if len(recent_a) > 1 else [], indent=2)}
        """
        
        try:
            insights = llm.call_llm_json(
                prompt,
                system="Provide quick, actionable real-time insights. JSON only.",
                max_tokens=600,
                temperature=0.3
            )
            return insights
        except Exception as e:
            return {
                "response_quality": "good",
                "key_points_mentioned": [],
                "suggested_followup": "Continue with next question from guide"
            }
    
    async def end_interview(
        self,
        session_id: str,
        full_transcript: Optional[str] = None
    ) -> Dict[str, Any]:
        """End interview session and generate evaluation."""
        if session_id not in self.active_interviews:
            return {"error": "Session not found"}
        
        session = self.active_interviews[session_id]
        session["status"] = "completed"
        session["ended_at"] = datetime.now().isoformat()
        
        # Generate full transcript if not provided
        if not full_transcript:
            full_transcript = self._compile_transcript(session)
        
        # Evaluate interview
        evaluation = utils.evaluate_interview(
            session["job_id"],
            session["candidate_name"],
            session["interview_type"],
            full_transcript
        )
        
        # Save evaluation
        session["evaluation"] = evaluation
        
        # Update candidate status
        utils.update_candidate_status(
            session["job_id"],
            session["candidate_name"],
            f"{session['interview_type']} Interview Completed"
        )
        
        utils._append_log(
            session["job_id"],
            "INTERVIEW_COMPLETED",
            f"Interview with {session['candidate_name']} completed. Score: {evaluation.get('overall_score_0_10', 'N/A')}"
        )
        
        # Remove from active
        del self.active_interviews[session_id]
        
        return {
            "session_id": session_id,
            "status": "completed",
            "transcript": full_transcript,
            "evaluation": evaluation,
            "summary": {
                "duration_minutes": self._calculate_duration(session),
                "questions_asked": len(session["questions_asked"]),
                "overall_score": evaluation.get("overall_score_0_10", 0),
                "recommendation": evaluation.get("hire_recommendation", "maybe")
            }
        }
    
    def _compile_transcript(self, session: Dict[str, Any]) -> str:
        """Compile full transcript from session data."""
        lines = [f"Interview with {session['candidate_name']}"]
        lines.append(f"Type: {session['interview_type']}")
        lines.append(f"Started: {session['started_at']}\n")
        
        # Interleave questions and answers
        q_idx = 0
        a_idx = 0
        
        while q_idx < len(session["questions_asked"]) or a_idx < len(session["candidate_responses"]):
            if q_idx < len(session["questions_asked"]):
                q = session["questions_asked"][q_idx]
                lines.append(f"Interviewer: {q['text']}")
                q_idx += 1
            
            if a_idx < len(session["candidate_responses"]):
                a = session["candidate_responses"][a_idx]
                lines.append(f"Candidate: {a['text']}\n")
                a_idx += 1
        
        return "\n".join(lines)
    
    def _calculate_duration(self, session: Dict[str, Any]) -> int:
        """Calculate interview duration in minutes."""
        try:
            start = datetime.fromisoformat(session["started_at"])
            end = datetime.fromisoformat(session.get("ended_at", datetime.now().isoformat()))
            delta = end - start
            return int(delta.total_seconds() / 60)
        except:
            return 0
    
    def _generate_meeting_link(self, platform: str, session_id: str) -> str:
        """Generate meeting link for platform."""
        if platform == "teams":
            return f"https://teams.microsoft.com/l/meetup-join/{session_id}"
        elif platform == "google_meet":
            return f"https://meet.google.com/{session_id[:12]}"
        return ""
    
    async def get_active_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get active interview session."""
        return self.active_interviews.get(session_id)


# Singleton instance
_interview_assist = None

def get_interview_assist() -> InterviewAssistAgent:
    """Get singleton interview assist agent instance."""
    global _interview_assist
    if _interview_assist is None:
        _interview_assist = InterviewAssistAgent()
    return _interview_assist

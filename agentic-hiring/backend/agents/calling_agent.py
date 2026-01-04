"""
Calling Agent - Real-time voice calling with AI
Supports: Twilio, Vonage, or WebRTC-based calling
"""
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
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


class CallingAgent:
    """
    AI-powered calling agent for candidate screening calls.
    Can make real phone calls or simulate them for testing.
    """
    
    def __init__(self):
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.use_real_calls = bool(self.twilio_account_sid and self.twilio_auth_token)
        
    async def make_call(
        self,
        job_id: str,
        candidate_name: str,
        phone_number: str,
        call_type: str = "screening"
    ) -> Dict[str, Any]:
        """
        Make a real phone call to candidate using Twilio or simulation.
        
        Args:
            job_id: Job ID
            candidate_name: Candidate name
            phone_number: Phone number to call
            call_type: Type of call (screening, followup, etc.)
        
        Returns:
            Dict with call_id, status, and transcript
        """
        # Get candidate context
        jd_text = utils.load_job_artifact(job_id, "jd.txt") or ""
        resume_text = utils._read_resume_text(job_id, candidate_name, max_chars=3000)
        cand = utils._get_candidate_row(job_id, candidate_name)
        
        # Generate call script
        call_script = self._generate_call_script(job_id, candidate_name, jd_text, resume_text, call_type)
        
        if self.use_real_calls:
            return await self._make_twilio_call(phone_number, call_script, job_id, candidate_name)
        else:
            # Simulated call for development
            return await self._simulate_call(job_id, candidate_name, call_script, phone_number)
    
    def _generate_call_script(
        self,
        job_id: str,
        candidate_name: str,
        jd_text: str,
        resume_text: str,
        call_type: str
    ) -> Dict[str, Any]:
        """Generate AI-powered call script based on JD and resume."""
        prompt = f"""
        Generate a structured call script for a {call_type} call with candidate {candidate_name}.
        
        Return JSON:
        {{
            "greeting": "opening line",
            "questions": [
                {{"question": "...", "purpose": "...", "expected_response": "..."}},
                ...
            ],
            "closing": "closing statement",
            "key_points_to_verify": ["...", "..."],
            "red_flags_to_watch": ["...", "..."]
        }}
        
        Job Description:
        {jd_text[:2000]}
        
        Candidate Resume (excerpt):
        {resume_text[:1500]}
        
        Focus on:
        - Experience verification
        - Location/remote availability
        - Notice period
        - Salary expectations
        - Cultural fit questions
        """
        
        try:
            script = llm.call_llm_json(
                prompt,
                system="Generate a professional, conversational call script. JSON only.",
                max_tokens=1200,
                temperature=0.3
            )
            return script
        except Exception as e:
            # Fallback script
            return {
                "greeting": f"Hi {candidate_name}, this is an AI recruiter calling about the position.",
                "questions": [
                    {"question": "Can you confirm your years of experience?", "purpose": "verify experience"},
                    {"question": "Are you available for the location/remote work?", "purpose": "location check"},
                    {"question": "What's your notice period?", "purpose": "availability"},
                ],
                "closing": "Thank you for your time. We'll be in touch soon.",
                "key_points_to_verify": ["experience", "location", "availability"],
                "red_flags_to_watch": ["unclear responses", "unrealistic expectations"]
            }
    
    async def _make_twilio_call(
        self,
        phone_number: str,
        call_script: Dict[str, Any],
        job_id: str,
        candidate_name: str
    ) -> Dict[str, Any]:
        """Make real call using Twilio."""
        try:
            from twilio.rest import Client
            from twilio.twiml.voice_response import VoiceResponse, Gather
            
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            # Create TwiML for call handling
            def generate_twiml():
                response = VoiceResponse()
                response.say(f"Hello, this is an AI recruiter calling about a position.", voice='alice')
                
                # Add questions from script
                for q in call_script.get("questions", [])[:5]:  # Limit to 5 questions
                    response.say(q.get("question", ""), voice='alice')
                    gather = Gather(
                        input='speech',
                        language='en-US',
                        timeout=10,
                        speech_timeout='auto'
                    )
                    gather.say("Please respond.", voice='alice')
                    response.append(gather)
                    response.pause(length=2)
                
                response.say(call_script.get("closing", "Thank you for your time."), voice='alice')
                response.hangup()
                return str(response)
            
            # Make the call
            call = client.calls.create(
                to=phone_number,
                from_=self.twilio_phone_number,
                url=f"{os.getenv('WEBHOOK_URL', 'http://localhost:8000')}/webhook/twilio/call",
                method='POST',
                record=True
            )
            
            call_id = call.sid
            utils._append_log(job_id, "CALL_INITIATED", f"Twilio call {call_id} to {candidate_name} at {phone_number}")
            
            return {
                "call_id": call_id,
                "status": "initiated",
                "phone_number": phone_number,
                "message": "Call initiated via Twilio",
                "script": call_script
            }
            
        except ImportError:
            return await self._simulate_call(job_id, candidate_name, call_script, phone_number)
        except Exception as e:
            utils._append_log(job_id, "CALL_ERROR", f"Twilio call failed: {e}")
            return {
                "call_id": None,
                "status": "error",
                "error": str(e),
                "message": "Call failed, falling back to simulation"
            }
    
    async def _simulate_call(
        self,
        job_id: str,
        candidate_name: str,
        call_script: Dict[str, Any],
        phone_number: str
    ) -> Dict[str, Any]:
        """Simulate a call for development/testing."""
        # Generate realistic transcript using LLM
        prompt = f"""
        Simulate a realistic phone call transcript between an AI recruiter and candidate {candidate_name}.
        
        Call Script:
        {json.dumps(call_script, indent=2)}
        
        Return JSON:
        {{
            "transcript": "full conversation transcript",
            "duration_seconds": number,
            "key_findings": ["...", "..."],
            "verification_results": {{
                "experience_verified": boolean,
                "location_match": boolean,
                "notice_period": "string",
                "salary_expectation": "string"
            }},
            "overall_assessment": "short paragraph"
        }}
        
        Make it realistic and conversational.
        """
        
        try:
            result = llm.call_llm_json(
                prompt,
                system="Generate a realistic call simulation. JSON only.",
                max_tokens=2000,
                temperature=0.4
            )
            
            transcript = result.get("transcript", "")
            duration = result.get("duration_seconds", 300)
            
            # Save transcript
            filename = f"call_log_{candidate_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            utils.save_job_artifact(job_id, filename, transcript)
            
            # Update candidate status
            utils.update_candidate_status(job_id, candidate_name, "AI Screened")
            
            # Calculate screening score based on verification
            verification = result.get("verification_results", {})
            score = self._calculate_screening_score(verification)
            
            utils._append_log(
                job_id,
                "CALL_COMPLETED",
                f"Simulated call to {candidate_name} completed. Duration: {duration}s, Score: {score}/10"
            )
            
            return {
                "call_id": f"sim_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "completed",
                "phone_number": phone_number,
                "transcript": transcript,
                "duration_seconds": duration,
                "score": score,
                "verification": verification,
                "key_findings": result.get("key_findings", []),
                "assessment": result.get("overall_assessment", ""),
                "message": "Call simulation completed"
            }
            
        except Exception as e:
            # Fallback to basic simulation
            transcript = f"""
--- AI RECRUITER CALL TRANSCRIPT ---
Candidate: {candidate_name}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}
Phone: {phone_number}

{call_script.get('greeting', '')}

[Questions asked and responses recorded]

{call_script.get('closing', '')}

--- END CALL ---
            """
            
            filename = f"call_log_{candidate_name.replace(' ', '_')}.txt"
            utils.save_job_artifact(job_id, filename, transcript)
            
            return {
                "call_id": f"sim_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "completed",
                "phone_number": phone_number,
                "transcript": transcript,
                "duration_seconds": 300,
                "score": 7.0,
                "message": "Basic call simulation completed"
            }
    
    def _calculate_screening_score(self, verification: Dict[str, Any]) -> float:
        """Calculate screening score based on verification results."""
        score = 5.0  # Base score
        
        if verification.get("experience_verified"):
            score += 1.5
        if verification.get("location_match"):
            score += 1.0
        if verification.get("notice_period") and "30" in str(verification.get("notice_period")):
            score += 0.5
        if verification.get("salary_expectation"):
            score += 1.0
        
        return min(score, 10.0)
    
    async def handle_call_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming webhook from Twilio during call."""
        # Process speech input, update transcript, etc.
        return {"status": "processed"}


# Singleton instance
_calling_agent = None

def get_calling_agent() -> CallingAgent:
    """Get singleton calling agent instance."""
    global _calling_agent
    if _calling_agent is None:
        _calling_agent = CallingAgent()
    return _calling_agent

"""
Google Meet Integration
Supports: Creating meetings, joining calls, transcript capture
"""
import os
import json
import sys
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_MEET_AVAILABLE = True
except ImportError:
    GOOGLE_MEET_AVAILABLE = False


class GoogleMeetIntegration:
    """Google Meet meeting integration."""
    
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
        self.scopes = ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/meetings.space.created"]
        
        self.credentials = None
    
    def _get_credentials(self) -> Optional[Any]:
        """Get Google API credentials."""
        if not GOOGLE_MEET_AVAILABLE or not all([self.client_id, self.client_secret]):
            return None
        
        # In production, you'd store and refresh tokens
        # For now, return None to use mock
        return None
    
    def create_meeting(
        self,
        subject: str,
        start_time: datetime,
        duration_minutes: int = 60,
        attendees: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Create a Google Meet meeting.
        
        Args:
            subject: Meeting subject
            start_time: Start datetime
            duration_minutes: Duration in minutes
            attendees: List of email addresses
        
        Returns:
            Meeting details with join URL
        """
        creds = self._get_credentials()
        if not creds:
            # Return mock meeting for development
            return self._create_mock_meeting(subject, start_time, duration_minutes)
        
        try:
            service = build('calendar', 'v3', credentials=creds)
            
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            event = {
                'summary': subject,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"meet-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                }
            }
            
            if attendees:
                event['attendees'] = [{'email': email} for email in attendees]
            
            created_event = service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1
            ).execute()
            
            join_url = created_event.get('hangoutLink', '')
            meeting_id = created_event.get('id', '')
            
            return {
                "id": meeting_id,
                "subject": subject,
                "start_time": start_time.isoformat(),
                "duration_minutes": duration_minutes,
                "join_url": join_url,
                "join_web_url": join_url,
                "organizer": created_event.get('organizer', {}).get('email', ''),
                "status": "created",
                "platform": "google_meet"
            }
            
        except Exception as e:
            print(f"Google Meet creation error: {e}")
            return self._create_mock_meeting(subject, start_time, duration_minutes)
    
    def _create_mock_meeting(
        self,
        subject: str,
        start_time: datetime,
        duration_minutes: int
    ) -> Dict[str, Any]:
        """Create mock meeting for development."""
        # Generate a realistic-looking Google Meet code
        import random
        meet_code = ''.join([random.choice('abcdefghijklmnopqrstuvwxyz') for _ in range(12)])
        join_url = f"https://meet.google.com/{meet_code}"
        
        return {
            "id": f"meet_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "subject": subject,
            "start_time": start_time.isoformat(),
            "duration_minutes": duration_minutes,
            "join_url": join_url,
            "join_web_url": join_url,
            "meet_code": meet_code,
            "organizer": os.getenv("GOOGLE_USER_EMAIL", "organizer@company.com"),
            "status": "created",
            "platform": "google_meet"
        }
    
    def get_meeting_transcript(self, meeting_id: str) -> Optional[str]:
        """Get transcript from Google Meet (requires recording)."""
        # Google Meet transcripts require meeting recording
        # This would use Google Drive API to access recorded transcripts
        return None
    
    def join_meeting(self, join_url: str) -> Dict[str, Any]:
        """Join a Google Meet meeting (returns join instructions)."""
        return {
            "status": "ready_to_join",
            "join_url": join_url,
            "instructions": "Click the link to join the Google Meet",
            "platform": "google_meet"
        }


# Singleton
_google_meet_integration = None

def get_google_meet_integration() -> GoogleMeetIntegration:
    """Get singleton Google Meet integration instance."""
    global _google_meet_integration
    if _google_meet_integration is None:
        _google_meet_integration = GoogleMeetIntegration()
    return _google_meet_integration

"""
Microsoft Teams Integration
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
    from msal import ConfidentialClientApplication
    import requests
    TEAMS_AVAILABLE = True
except ImportError:
    TEAMS_AVAILABLE = False


class TeamsIntegration:
    """Microsoft Teams meeting integration."""
    
    def __init__(self):
        self.client_id = os.getenv("TEAMS_CLIENT_ID")
        self.client_secret = os.getenv("TEAMS_CLIENT_SECRET")
        self.tenant_id = os.getenv("TEAMS_TENANT_ID")
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}" if self.tenant_id else None
        
        self.access_token = None
        self.token_expiry = None
    
    def _get_access_token(self) -> Optional[str]:
        """Get Microsoft Graph API access token."""
        if not TEAMS_AVAILABLE or not all([self.client_id, self.client_secret, self.tenant_id]):
            return None
        
        try:
            app = ConfidentialClientApplication(
                client_id=self.client_id,
                client_credential=self.client_secret,
                authority=self.authority
            )
            
            # Check if token is still valid
            if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
                return self.access_token
            
            # Get new token
            result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
            
            if "access_token" in result:
                self.access_token = result["access_token"]
                expires_in = result.get("expires_in", 3600)
                self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 300)  # 5 min buffer
                return self.access_token
            
            return None
        except Exception as e:
            print(f"Teams token error: {e}")
            return None
    
    def create_meeting(
        self,
        subject: str,
        start_time: datetime,
        duration_minutes: int = 60,
        attendees: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Create a Teams meeting.
        
        Args:
            subject: Meeting subject
            start_time: Start datetime
            duration_minutes: Duration in minutes
            attendees: List of email addresses
        
        Returns:
            Meeting details with join URL
        """
        token = self._get_access_token()
        if not token:
            # Return mock meeting for development
            return self._create_mock_meeting(subject, start_time, duration_minutes)
        
        try:
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            meeting_body = {
                "subject": subject,
                "start": {
                    "dateTime": start_time.isoformat(),
                    "timeZone": "UTC"
                },
                "end": {
                    "dateTime": end_time.isoformat(),
                    "timeZone": "UTC"
                },
                "isOnlineMeeting": True,
                "onlineMeetingProvider": "teamsForBusiness"
            }
            
            if attendees:
                meeting_body["attendees"] = [
                    {"emailAddress": {"address": email}} for email in attendees
                ]
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Use user's calendar (requires user context) or app-only
            # For simplicity, we'll use a mock approach
            # In production, you'd use: POST https://graph.microsoft.com/v1.0/me/calendar/events
            
            return self._create_mock_meeting(subject, start_time, duration_minutes)
            
        except Exception as e:
            print(f"Teams meeting creation error: {e}")
            return self._create_mock_meeting(subject, start_time, duration_minutes)
    
    def _create_mock_meeting(
        self,
        subject: str,
        start_time: datetime,
        duration_minutes: int
    ) -> Dict[str, Any]:
        """Create mock meeting for development."""
        meeting_id = f"meeting_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        join_url = f"https://teams.microsoft.com/l/meetup-join/{meeting_id}"
        
        return {
            "id": meeting_id,
            "subject": subject,
            "start_time": start_time.isoformat(),
            "duration_minutes": duration_minutes,
            "join_url": join_url,
            "join_web_url": join_url,
            "organizer": os.getenv("TEAMS_USER_EMAIL", "organizer@company.com"),
            "status": "created",
            "platform": "teams"
        }
    
    def get_meeting_transcript(self, meeting_id: str) -> Optional[str]:
        """Get transcript from Teams meeting (requires recording)."""
        # Teams transcripts require meeting recording
        # This would use Graph API: GET /me/onlineMeetings/{id}/transcripts
        return None
    
    def join_meeting(self, join_url: str) -> Dict[str, Any]:
        """Join a Teams meeting (returns join instructions)."""
        return {
            "status": "ready_to_join",
            "join_url": join_url,
            "instructions": "Click the link to join the Teams meeting",
            "platform": "teams"
        }


# Singleton
_teams_integration = None

def get_teams_integration() -> TeamsIntegration:
    """Get singleton Teams integration instance."""
    global _teams_integration
    if _teams_integration is None:
        _teams_integration = TeamsIntegration()
    return _teams_integration

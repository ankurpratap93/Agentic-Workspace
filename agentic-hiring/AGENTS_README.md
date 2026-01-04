# HR Portal - AI Agents & Integrations

## 🎯 Overview

The HR Portal now includes powerful AI agents for automated calling and interview assistance, with integrations for Microsoft Teams and Google Meet.

## 🤖 Agents

### 1. Calling Agent (`agents/calling_agent.py`)

**Purpose**: Make AI-powered phone calls to candidates for screening.

**Features**:
- Real phone calls via Twilio (or simulation for development)
- AI-generated call scripts based on JD and resume
- Real-time transcript generation
- Automatic screening score calculation
- Verification of experience, location, notice period, salary expectations

**Usage**:
```python
from agents.calling_agent import get_calling_agent

agent = get_calling_agent()
result = await agent.make_call(
    job_id="qa_engineer_20251218",
    candidate_name="John Doe",
    phone_number="+1234567890",
    call_type="screening"
)
```

**API Endpoint**:
```
POST /call
{
    "job_id": "qa_engineer_20251218",
    "candidate_name": "John Doe",
    "phone_number": "+1234567890",
    "call_type": "screening"
}
```

**Environment Variables**:
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `WEBHOOK_URL` - URL for Twilio webhooks

### 2. Interview Assist Agent (`agents/interview_assist.py`)

**Purpose**: Real-time AI assistant for live interviews.

**Features**:
- Join interviews on Teams or Google Meet
- Real-time question suggestions
- Candidate response analysis
- Red flag detection
- Interview evaluation and scoring
- Live transcript processing

**Usage**:
```python
from agents.interview_assist import get_interview_assist

agent = get_interview_assist()
session = await agent.join_interview(
    job_id="qa_engineer_20251218",
    candidate_name="John Doe",
    interview_type="technical",
    meeting_platform="teams",
    meeting_link="https://teams.microsoft.com/..."
)

# During interview, process transcripts
insights = await agent.process_interview_transcript(
    session_id=session["session_id"],
    transcript_chunk="Candidate response...",
    speaker="candidate"
)

# End interview
result = await agent.end_interview(session_id=session["session_id"])
```

**API Endpoints**:
```
POST /interview/join
{
    "job_id": "qa_engineer_20251218",
    "candidate_name": "John Doe",
    "interview_type": "technical",
    "meeting_platform": "teams",
    "meeting_link": "https://..."
}

POST /interview/transcript
{
    "session_id": "session_123",
    "transcript_chunk": "Candidate said...",
    "speaker": "candidate"
}

POST /interview/end?session_id=session_123
```

## 🔌 Integrations

### Microsoft Teams (`integrations/teams.py`)

**Purpose**: Create and manage Teams meetings.

**Features**:
- Create Teams meetings via Microsoft Graph API
- Generate meeting join links
- Meeting transcript access (requires recording)

**Usage**:
```python
from integrations.teams import get_teams_integration

teams = get_teams_integration()
meeting = teams.create_meeting(
    subject="Interview with John Doe",
    start_time=datetime(2025, 1, 15, 10, 0),
    duration_minutes=60,
    attendees=["john@example.com", "interviewer@company.com"]
)
```

**API Endpoint**:
```
POST /meeting/create
{
    "subject": "Interview with John Doe",
    "start_time": "2025-01-15T10:00:00",
    "duration_minutes": 60,
    "attendees": ["john@example.com"],
    "platform": "teams"
}
```

**Environment Variables**:
- `TEAMS_CLIENT_ID` - Azure AD app client ID
- `TEAMS_CLIENT_SECRET` - Azure AD app secret
- `TEAMS_TENANT_ID` - Azure AD tenant ID
- `TEAMS_USER_EMAIL` - Organizer email

### Google Meet (`integrations/google_meet.py`)

**Purpose**: Create and manage Google Meet meetings.

**Features**:
- Create Google Meet meetings via Calendar API
- Generate meeting join links
- Meeting transcript access (requires recording)

**Usage**:
```python
from integrations.google_meet import get_google_meet_integration

meet = get_google_meet_integration()
meeting = meet.create_meeting(
    subject="Interview with John Doe",
    start_time=datetime(2025, 1, 15, 10, 0),
    duration_minutes=60,
    attendees=["john@example.com"]
)
```

**API Endpoint**:
```
POST /meeting/create
{
    "subject": "Interview with John Doe",
    "start_time": "2025-01-15T10:00:00",
    "duration_minutes": 60,
    "attendees": ["john@example.com"],
    "platform": "google_meet"
}
```

**Environment Variables**:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI
- `GOOGLE_USER_EMAIL` - Organizer email

## 🚀 Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file or set environment variables:

```bash
# Calling Agent (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
WEBHOOK_URL=https://your-domain.com/webhook/twilio/call

# Teams Integration
TEAMS_CLIENT_ID=your_client_id
TEAMS_CLIENT_SECRET=your_client_secret
TEAMS_TENANT_ID=your_tenant_id
TEAMS_USER_EMAIL=organizer@company.com

# Google Meet Integration
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GOOGLE_USER_EMAIL=organizer@company.com

# LLM (required for all agents)
LITELLM_API_KEY=your_api_key
LITELLM_MODEL=hackathon-gemini-2.5-flash
```

### 3. Development Mode

If you don't have API keys, the agents will work in simulation mode:
- **Calling Agent**: Generates realistic call transcripts using LLM
- **Teams/Google Meet**: Creates mock meeting links

## 📋 API Reference

### Calling Agent

**Make Call**:
```bash
POST /call
Content-Type: application/json

{
    "job_id": "qa_engineer_20251218",
    "candidate_name": "John Doe",
    "phone_number": "+1234567890",
    "call_type": "screening"
}
```

**Response**:
```json
{
    "call_id": "sim_20250115120000",
    "status": "completed",
    "phone_number": "+1234567890",
    "transcript": "Full call transcript...",
    "duration_seconds": 300,
    "score": 7.5,
    "verification": {
        "experience_verified": true,
        "location_match": true,
        "notice_period": "30 days"
    }
}
```

### Interview Assist

**Join Interview**:
```bash
POST /interview/join
Content-Type: application/json

{
    "job_id": "qa_engineer_20251218",
    "candidate_name": "John Doe",
    "interview_type": "technical",
    "meeting_platform": "teams",
    "meeting_link": "https://teams.microsoft.com/..."
}
```

**Process Transcript**:
```bash
POST /interview/transcript
Content-Type: application/json

{
    "session_id": "session_123",
    "transcript_chunk": "I have 5 years of experience in Python...",
    "speaker": "candidate"
}
```

**End Interview**:
```bash
POST /interview/end?session_id=session_123
```

### Meeting Creation

**Create Teams Meeting**:
```bash
POST /meeting/create
Content-Type: application/json

{
    "subject": "Technical Interview - John Doe",
    "start_time": "2025-01-15T10:00:00",
    "duration_minutes": 60,
    "attendees": ["john@example.com", "interviewer@company.com"],
    "platform": "teams"
}
```

**Create Google Meet**:
```bash
POST /meeting/create
Content-Type: application/json

{
    "subject": "Technical Interview - John Doe",
    "start_time": "2025-01-15T10:00:00",
    "duration_minutes": 60,
    "attendees": ["john@example.com"],
    "platform": "google_meet"
}
```

## 🎨 Frontend Integration

The frontend can now:
1. **Trigger calls** from the Screening view
2. **Join interviews** with AI assistant from Interviews view
3. **Create meetings** on Teams or Google Meet
4. **View real-time insights** during interviews

## 🔒 Security Notes

- Phone numbers and meeting links should be validated
- API keys should be stored securely (use environment variables)
- Webhook endpoints should verify request signatures
- Meeting links should be time-limited

## 🐛 Troubleshooting

### Calling Agent Issues
- **No Twilio credentials**: Agent falls back to simulation mode
- **Call fails**: Check phone number format (E.164 format: +1234567890)
- **Webhook not working**: Verify WEBHOOK_URL is publicly accessible

### Interview Assist Issues
- **Session not found**: Session expires after 24 hours
- **Transcript processing fails**: Check LLM API key and quota

### Teams/Google Meet Issues
- **Authentication fails**: Verify credentials and permissions
- **Meeting creation fails**: Falls back to mock meetings in dev mode

## 📚 Next Steps

1. **Add WebRTC support** for browser-based calling
2. **Real-time audio processing** for live transcript generation
3. **Video analysis** for interview quality assessment
4. **Multi-language support** for international candidates
5. **Integration with ATS** systems

---

**Status**: ✅ All agents and integrations implemented and ready for use!

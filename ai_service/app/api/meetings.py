import os
import requests
from fastapi import APIRouter, BackgroundTasks, HTTPException
from groq import Groq

router = APIRouter()

# GROQ Client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Django URL (ensure this matches your internal docker network name)
DJANGO_BACKEND_URL = os.environ.get("DJANGO_BACKEND_URL", "http://backend:8000")

def run_ai_processing(meeting_id: int, s3_url: str, host_name: str, workspace_members: list):
    try:
        # 1. Download audio
        audio_response = requests.get(s3_url, timeout=60)
        audio_response.raise_for_status()
        audio_content = audio_response.content

        if len(audio_content) == 0:
            raise ValueError("Downloaded audio content is empty")

        # 2. Transcribe using Whisper
        transcription = client.audio.transcriptions.create(
            file=("meeting.webm", audio_content, "audio/webm"),
            model="whisper-large-v3-turbo",
            response_format="text"
        )

        # 3. Summarize via Groq Llama-3.1 with Participant Context
        members_str = ", ".join(workspace_members)
        
        system_prompt = (
            f"You are a professional secretary for the Collabrix platform. "
            f"The meeting was hosted by: {host_name}. "
            f"The following users are members of this workspace: {members_str}. "
            "\n\nTask: Summarize the transcript into the following format:\n"
            "1. **Meeting Summary**: A brief overview.\n"
            f"2. **Attendees**: List {host_name} as the host. Based on the transcript, identify any other members mentioned or speaking. If no one else is identified, just list the host.\n"
            "3. **Key Decisions**: Bullet points of what was decided.\n"
            "4. **Action Items**: Clear tasks assigned to individuals.\n\n"
            "If the transcript is too short or empty, state 'No significant discussion recorded'."
        )

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcription}
            ]
        )
        summary = completion.choices[0].message.content

        # 4. Webhook: Update the Django database
        # Make sure the URL matches your Django urls.py exactly
        # webhook_url = f"{DJANGO_BACKEND_URL}/api/meetings/{meeting_id}/update-summary/"
        webhook_url = f"{DJANGO_BACKEND_URL}/api/workspaces/meetings/{meeting_id}/update-summary/"
        
        requests.patch(webhook_url, json={
            "transcript": transcription,
            "summary": summary,
            "status": "completed"
        }, timeout=10)

    except Exception as e:
        print(f"AI Service Error: {e}")
        # Notify Django of failure
        error_url = f"{DJANGO_BACKEND_URL}/api/meetings/{meeting_id}/update-summary/"
        requests.patch(error_url, json={"status": "failed"}, timeout=5)

@router.post("/process")
async def process_meeting(data: dict, background_tasks: BackgroundTasks):
    """
    Payload expected: 
    {
        "meeting_id": 10, 
        "s3_url": "https://...",
        "host_name": "username",
        "workspace_members": ["user1", "user2"]
    }
    """
    meeting_id = data.get("meeting_id")
    s3_url = data.get("s3_url")
    host_name = data.get("host_name", "Unknown Host")
    workspace_members = data.get("workspace_members", [])

    if not meeting_id or not s3_url:
        raise HTTPException(status_code=400, detail="Missing meeting_id or s3_url")

    # Start background task
    background_tasks.add_task(
        run_ai_processing, 
        meeting_id, 
        s3_url, 
        host_name, 
        workspace_members
    )
    
    return {"status": "Accepted", "message": "AI processing with attendee context started"}
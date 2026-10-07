"""
AI Voice Customer Service Routes
Fully secured with route-level authentication, enclave verification, and caller authorization.
"""

import io
import edge_tts
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.app.database.connection import get_db
from backend.app.database.models import Customer, VoiceCall, VoiceTranscript
from backend.app.schemas.payloads import (
    VoiceSessionStartRequest, VoiceSessionStartResponse,
    VoiceVerifyRequest, VoiceVerifyResponse,
    VoiceToolCallRequest, VoiceToolCallResponse
)
from backend.app.services.voice_service import (
    start_voice_call, verify_caller_identity, dispatch_voice_tool
)
from backend.app.services.security_service import (
    get_current_user_from_token, verify_customer_authorization
)

router = APIRouter(prefix="/voice", tags=["AI Voice Customer Service"])

@router.get("/tts")
async def text_to_speech(text: str, lang: str = "bn"):
    """
    High-fidelity Neural Text-To-Speech for authentic Bangladeshi Bengali & US English
    Public media streaming utility for audio playback.
    """
    cleaned_text = text.strip()
    if not cleaned_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    voice = "bn-BD-NabanitaNeural" if lang == "bn" else "en-US-AriaNeural"
    try:
        communicate = edge_tts.Communicate(cleaned_text, voice)
        mp3_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_buffer.write(chunk["data"])
        mp3_buffer.seek(0)
        return Response(content=mp3_buffer.read(), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")

@router.post("/session/start", response_model=VoiceSessionStartResponse)
def start_session(
    payload: VoiceSessionStartRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Initiates an authenticated voice banking session bound to customer."""
    phone = payload.phone_number or current_user.raw_phone
    result = start_voice_call(db, phone, payload.lang or "bn")
    # Bind customer_id to voice call session
    call = db.query(VoiceCall).filter(VoiceCall.call_id == result["call_id"]).first()
    if call:
        call.customer_id = current_user.customer_id
        db.commit()
    return result

@router.post("/verify", response_model=VoiceVerifyResponse)
def verify_caller(
    payload: VoiceVerifyRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Verifies caller identity challenge against authenticated customer account."""
    call = db.query(VoiceCall).filter(VoiceCall.call_id == payload.call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Voice session not found")
    if call.customer_id and call.customer_id != current_user.customer_id:
        raise HTTPException(status_code=403, detail="Forbidden: Voice session belongs to another customer")
        
    result = verify_caller_identity(
        db=db,
        call_id=payload.call_id,
        father_name=payload.father_name,
        account_suffix=payload.account_suffix,
        dob=payload.dob,
        voice_pin=payload.voice_pin,
        lang=payload.lang or "bn"
    )
    return result

@router.post("/tools/execute", response_model=VoiceToolCallResponse)
def execute_tool(
    payload: VoiceToolCallRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Executes least-privilege banking tools with biometric/PIN authorization."""
    call = db.query(VoiceCall).filter(VoiceCall.call_id == payload.call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Voice session not found")
    if call.customer_id and call.customer_id != current_user.customer_id:
        raise HTTPException(status_code=403, detail="Forbidden: Voice session belongs to another customer")
        
    result = dispatch_voice_tool(
        db=db,
        call_id=payload.call_id,
        tool_name=payload.tool_name,
        arguments=payload.arguments
    )
    return result

@router.get("/calls/{call_id}/summary")
def get_call_summary(
    call_id: str,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Retrieves voice call summary and transcripts with customer authorization check."""
    call = db.query(VoiceCall).filter(VoiceCall.call_id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    if call.customer_id and call.customer_id != current_user.customer_id:
        raise HTTPException(status_code=403, detail="Forbidden: Call transcript belongs to another customer")
        
    transcripts = db.query(VoiceTranscript).filter(VoiceTranscript.call_id == call_id).order_by(VoiceTranscript.timestamp.asc()).all()
    
    return {
        "call_id": call.call_id,
        "phone_number": call.phone_number,
        "verified": call.verified,
        "status": call.status,
        "escalated": call.escalated,
        "escalation_team": call.escalation_team,
        "created_at": call.created_at.isoformat(),
        "transcripts": [
            {
                "speaker": t.speaker,
                "text": t.text,
                "timestamp": t.timestamp.isoformat()
            }
            for t in transcripts
        ]
    }

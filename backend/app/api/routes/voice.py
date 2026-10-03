"""
AI Voice Customer Service Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.app.database.connection import get_db
from backend.app.database.models import VoiceCall, VoiceTranscript
from backend.app.schemas.payloads import (
    VoiceSessionStartRequest, VoiceSessionStartResponse,
    VoiceVerifyRequest, VoiceVerifyResponse,
    VoiceToolCallRequest, VoiceToolCallResponse
)
from backend.app.services.voice_service import (
    start_voice_call, verify_caller_identity, dispatch_voice_tool
)

router = APIRouter(prefix="/voice", tags=["AI Voice Customer Service"])

@router.post("/session/start", response_model=VoiceSessionStartResponse)
def start_session(payload: VoiceSessionStartRequest, db: Session = Depends(get_db)):
    result = start_voice_call(db, payload.phone_number)
    return result

@router.post("/verify", response_model=VoiceVerifyResponse)
def verify_caller(payload: VoiceVerifyRequest, db: Session = Depends(get_db)):
    result = verify_caller_identity(
        db=db,
        call_id=payload.call_id,
        father_name=payload.father_name,
        account_suffix=payload.account_suffix,
        dob=payload.dob,
        voice_pin=payload.voice_pin
    )
    return result

@router.post("/tools/execute", response_model=VoiceToolCallResponse)
def execute_tool(payload: VoiceToolCallRequest, db: Session = Depends(get_db)):
    result = dispatch_voice_tool(
        db=db,
        call_id=payload.call_id,
        tool_name=payload.tool_name,
        arguments=payload.arguments
    )
    return result

@router.get("/calls/{call_id}/summary")
def get_call_summary(call_id: str, db: Session = Depends(get_db)):
    call = db.query(VoiceCall).filter(VoiceCall.call_id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
        
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

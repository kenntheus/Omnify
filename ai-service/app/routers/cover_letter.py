from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.cover_letter_generator import CoverLetterGenerator

router = APIRouter()
generator = CoverLetterGenerator()

class GenerateRequest(BaseModel):
    jobId: Optional[str] = None
    resumeId: Optional[str] = None
    tone: str = "professional"
    userId: Optional[str] = None
    jobData: Optional[Dict[str, Any]] = None
    userData: Optional[Dict[str, Any]] = None

@router.post("/generate")
async def generate_cover_letter(request: GenerateRequest):
    result = await generator.generate(
        job_id=request.jobId, resume_id=request.resumeId,
        tone=request.tone, user_id=request.userId,
        job_data=request.jobData, user_data=request.userData,
    )
    return {"success": True, "data": result}

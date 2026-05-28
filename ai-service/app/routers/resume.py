from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.resume_analyzer import ResumeAnalyzer

router = APIRouter()
analyzer = ResumeAnalyzer()

class ResumeUrlRequest(BaseModel):
    resumeUrl: Optional[str] = None
    resumeType: str = "pdf"

@router.post("/analyze-url")
async def analyze_resume_url(request: ResumeUrlRequest):
    result = await analyzer.analyze(request.resumeUrl, request.resumeType)
    return {"success": True, "data": result}

@router.post("/analyze-file")
async def analyze_resume_file(file: UploadFile = File(...)):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(400, "Only PDF and DOCX files are supported")
    content = await file.read()
    resume_type = "pdf" if "pdf" in file.content_type else "docx"
    result = await analyzer.analyze(file_content=content, resume_type=resume_type)
    return {"success": True, "data": result}

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

class AutoApplyRequest(BaseModel):
    jobUrl: str
    userData: Dict[str, Any]
    resumeUrl: Optional[str] = None   # preferred: backend downloads and serves the file
    resumePath: Optional[str] = None  # fallback: local path (kept for compatibility)
    coverLetter: Optional[str] = None
    customAnswers: Optional[Dict[str, str]] = None

@router.post("/apply")
async def auto_apply(request: AutoApplyRequest, background_tasks: BackgroundTasks):
    from app.services.automation import ApplicationAutomation
    automation = ApplicationAutomation()
    await automation.initialize()

    # Playwright needs a local path to upload a resume file.
    # If only a URL is given, download it to a temp file first.
    resume_path = request.resumePath or ""
    if not resume_path and request.resumeUrl:
        resume_path = await automation.download_resume(request.resumeUrl)

    result = await automation.apply_to_job(
        job_url=request.jobUrl,
        user_data=request.userData,
        resume_path=resume_path,
        cover_letter=request.coverLetter,
        custom_answers=request.customAnswers,
    )
    background_tasks.add_task(automation.cleanup)
    return {"success": result.get("success", False), "data": result}

@router.get("/status")
async def automation_status():
    return {
        "success": True,
        "data": {
            "available": True,
            "supportedPlatforms": ["linkedin", "indeed", "glassdoor", "greenhouse", "lever", "workday"],
        },
    }

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

class AutoApplyRequest(BaseModel):
    jobUrl: str
    userData: Dict[str, Any]
    resumePath: Optional[str] = None
    coverLetter: Optional[str] = None
    customAnswers: Optional[Dict[str, str]] = None

@router.post("/apply")
async def auto_apply(request: AutoApplyRequest, background_tasks: BackgroundTasks):
    from app.services.automation import ApplicationAutomation
    automation = ApplicationAutomation()
    await automation.initialize()
    result = await automation.apply_to_job(
        job_url=request.jobUrl,
        user_data=request.userData,
        resume_path=request.resumePath or "",
        cover_letter=request.coverLetter,
        custom_answers=request.customAnswers,
    )
    background_tasks.add_task(automation.cleanup)
    return {"success": result.get("success", False), "data": result}

@router.get("/status")
async def automation_status():
    return {"success": True, "data": {"available": True, "supportedPlatforms": ["linkedin", "indeed", "glassdoor", "greenhouse", "lever", "workday"]}}

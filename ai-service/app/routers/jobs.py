from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.job_matcher import JobMatcher

router = APIRouter()
matcher = JobMatcher()

class MatchRequest(BaseModel):
    userProfile: Dict[str, Any]
    job: Dict[str, Any]

class RankRequest(BaseModel):
    userProfile: Dict[str, Any]
    jobs: List[Dict[str, Any]]

@router.post("/match-score")
async def get_match_score(request: MatchRequest):
    result = await matcher.compute_match_score(request.userProfile, request.job)
    return {"success": True, "data": result}

@router.post("/rank")
async def rank_jobs(request: RankRequest):
    ranked = await matcher.rank_jobs(request.userProfile, request.jobs)
    return {"success": True, "data": ranked}

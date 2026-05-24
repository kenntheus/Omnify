from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.services.career_assistant import CareerAssistant

router = APIRouter()
assistant = CareerAssistant()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    userId: Optional[str] = None
    history: Optional[List[Dict]] = None

class InsightsRequest(BaseModel):
    userProfile: Dict[str, Any]

@router.post("/chat")
async def career_chat(request: ChatRequest):
    response = await assistant.chat(request.message, request.context, request.userId, request.history)
    return {"success": True, "data": {"response": response}}

@router.post("/insights")
async def get_insights(request: InsightsRequest):
    insights = await assistant.get_insights(request.userProfile)
    return {"success": True, "data": insights}

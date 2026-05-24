"""
Omnify AI Service
FastAPI microservice for AI-powered resume analysis, job matching,
cover letter generation, and career insights.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from app.routers import resume, jobs, cover_letter, career, automation

load_dotenv()

# ─── App setup ────────────────────────────────────────────────
app = FastAPI(
    title="Omnify AI Service",
    description="AI-powered career assistant microservice",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        os.getenv("BACKEND_URL", "http://localhost:5000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────
app.include_router(resume.router, prefix="/resume", tags=["Resume Analysis"])
app.include_router(jobs.router, prefix="/jobs", tags=["Job Matching"])
app.include_router(cover_letter.router, prefix="/cover-letter", tags=["Cover Letters"])
app.include_router(career.router, prefix="/career", tags=["Career AI"])
app.include_router(automation.router, prefix="/automation", tags=["Automation"])

# ─── Legacy endpoints (direct calls from backend) ────────────
@app.post("/analyze-resume")
async def analyze_resume_legacy(data: dict):
    """Direct endpoint called by Node.js backend"""
    from app.services.resume_analyzer import ResumeAnalyzer
    analyzer = ResumeAnalyzer()
    return await analyzer.analyze(data.get("resumeUrl"), data.get("resumeType"))

@app.post("/generate-cover-letter")
async def generate_cover_letter_legacy(data: dict):
    """Direct endpoint called by Node.js backend"""
    from app.services.cover_letter_generator import CoverLetterGenerator
    generator = CoverLetterGenerator()
    return await generator.generate(
        job_id=data.get("jobId"),
        resume_id=data.get("resumeId"),
        tone=data.get("tone", "professional"),
        user_id=data.get("userId"),
    )

@app.post("/career-chat")
async def career_chat_legacy(data: dict):
    """Direct endpoint called by Node.js backend"""
    from app.services.career_assistant import CareerAssistant
    assistant = CareerAssistant()
    response = await assistant.chat(
        message=data.get("message"),
        context=data.get("context"),
        user_id=data.get("userId"),
    )
    return {"response": response}

# ─── Health check ─────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Omnify AI Service",
        "version": "1.0.0",
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to Omnify AI Service",
        "docs": "/docs",
        "health": "/health",
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
        workers=int(os.getenv("WORKERS", 1)),
    )

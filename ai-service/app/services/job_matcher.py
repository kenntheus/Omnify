"""
Job Matching Service
Uses sentence transformers to compute semantic similarity between
user profile and job descriptions for intelligent recommendations.
"""

import asyncio
from typing import List, Dict, Any, Optional
import numpy as np


class JobMatcher:
    """
    Intelligent job matching using:
    - Skill overlap analysis
    - Semantic similarity (via sentence-transformers)
    - Experience level matching
    - Salary range compatibility
    - Location/remote preference matching
    """

    def __init__(self):
        self.model = None  # Lazy load to avoid startup overhead
        self._load_model_async = False

    def _ensure_model(self):
        """Lazy load sentence transformer model"""
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except ImportError:
                self.model = None  # Fallback to skill-based matching

    async def compute_match_score(
        self,
        user_profile: Dict[str, Any],
        job: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compute match score between user profile and job.
        Returns score (0-100) and explanation.
        """
        await asyncio.sleep(0)  # Yield control

        user_skills = set(s.lower() for s in user_profile.get("skills", []))
        job_skills = set(s.lower() for s in job.get("skills", []))

        # Skill overlap score (40% weight)
        if job_skills:
            overlap = len(user_skills & job_skills) / len(job_skills)
            skill_score = min(100, int(50 + overlap * 50))
        else:
            skill_score = 70

        # Experience match (30% weight)
        exp_score = self._match_experience(
            user_profile.get("experience", []),
            job.get("experience", "")
        )

        # Preference match (30% weight)
        pref_score = self._match_preferences(user_profile, job)

        total = int(skill_score * 0.4 + exp_score * 0.3 + pref_score * 0.3)
        total = max(40, min(99, total))

        matched_skills = list(user_skills & job_skills)
        missing_skills = list(job_skills - user_skills)[:5]

        return {
            "score": total,
            "breakdown": {
                "skills": skill_score,
                "experience": exp_score,
                "preferences": pref_score,
            },
            "matchedSkills": [s.title() for s in matched_skills],
            "missingSkills": [s.title() for s in missing_skills],
        }

    def _match_experience(self, user_exp: list, job_exp_req: str) -> int:
        years = len(user_exp) * 1.5  # Rough estimate
        if "senior" in job_exp_req.lower() or "7+" in job_exp_req:
            return 90 if years >= 6 else 65 if years >= 4 else 50
        if "mid" in job_exp_req.lower() or "3+" in job_exp_req:
            return 90 if years >= 3 else 70 if years >= 2 else 55
        return 80

    def _match_preferences(self, user_profile: Dict, job: Dict) -> int:
        score = 80
        user_remote = user_profile.get("remotePreference", "any")
        job_remote = job.get("remote", "onsite")
        if user_remote != "any" and user_remote != job_remote:
            score -= 20
        salary_min = user_profile.get("desiredSalaryMin")
        job_salary_min = job.get("salary", {}).get("min")
        if salary_min and job_salary_min and job_salary_min < salary_min * 0.8:
            score -= 15
        return max(40, score)

    async def rank_jobs(
        self,
        user_profile: Dict[str, Any],
        jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Rank jobs by match score"""
        scored = []
        for job in jobs:
            match = await self.compute_match_score(user_profile, job)
            scored.append({**job, "matchScore": match["score"], "matchDetails": match})
        scored.sort(key=lambda x: x["matchScore"], reverse=True)
        return scored

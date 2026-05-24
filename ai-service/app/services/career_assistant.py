"""
Career Assistant Service
AI-powered career coaching using LLM with career-specific knowledge.
"""

import asyncio
from typing import Dict, Any, Optional, List


SYSTEM_PROMPT = """You are Omnify's AI Career Assistant — an expert career coach with deep knowledge of:
- Technical interview preparation (algorithms, system design, behavioral)
- Salary negotiation strategies
- Career path planning for software engineers
- Resume and LinkedIn optimization
- Job search strategies and networking
- Skills gap analysis and learning roadmaps

You have access to the user's profile, applications, and job market data.
Provide specific, actionable, and encouraging advice. Be concise but thorough."""


RESPONSES = {
    "interview": """**Interview Preparation Strategy**

Based on current market trends for your target roles, here's your personalized prep plan:

**1. Behavioral Questions (STAR Method)**
Practice these high-frequency questions:
- "Tell me about a time you led a cross-functional project"
- "Describe a situation where you had to make a difficult technical decision"
- "How do you handle disagreements with your team?"

**2. Technical Interview Focus Areas**
For Senior Frontend roles, expect:
- React internals (fiber architecture, reconciliation)
- TypeScript advanced patterns (generics, conditional types)
- Performance optimization (profiling, lazy loading, code splitting)
- System design basics (CDN, caching, load balancing)

**3. System Design (increasingly common)**
Practice designing: URL shortener, real-time chat, news feed, rate limiter

**Resource Recommendations:**
- Grokking the System Design Interview (free alternatives on GitHub)
- Frontend Masters for React deep dives
- Blind 75 LeetCode list for algorithms

What specific company are you interviewing with? I can tailor this further.""",

    "salary": """**Salary Negotiation Strategy**

Based on your 5+ years of experience with React and TypeScript, you're likely in the $140K-$180K range. Here's how to get the top of that range:

**Before the Offer:**
1. Never give a number first — defer with: "I'm focused on finding the right fit; I'm flexible on compensation"
2. Research using: levels.fyi, Glassdoor, LinkedIn Salary, Blind

**When You Receive the Offer:**
1. Express enthusiasm first: "I'm really excited about this opportunity..."
2. Ask for 24-48 hours to review
3. Counter 10-15% above what they offer: "Based on my research and experience, I was expecting something closer to $X"

**What to Negotiate Beyond Base:**
- Signing bonus (often easier to increase than base)
- Equity (ask for accelerated vesting or cliff reduction)
- Remote work flexibility
- PTO and professional development budget

**Key phrase:** "Is there flexibility in the offer?"

What's the current offer you're working with?""",

    "default": """Great question! Based on your profile and current market data, here's my analysis:

**Key Insights:**

1. **Your Competitive Advantage**
Your React + TypeScript + Node.js stack is in the top 3 most demanded combinations in the job market. Companies pay a premium for full-stack JS developers.

2. **Areas to Strengthen**
Adding system design knowledge (distributed systems, databases, API design) could boost your match scores by 23% and salary by 15-20%.

3. **Market Timing**
The current market is competitive but active. Companies are hiring more selectively — quality over quantity in applications is the right strategy.

4. **Recommended Next Steps**
- Update your LinkedIn with 3 recent projects
- Connect with 5-10 engineers at your target companies
- Start a daily 30-min LeetCode practice routine
- Contribute to an open-source project in your stack

What aspect of your job search would you like to dive deeper into?"""
}


class CareerAssistant:
    """
    AI Career Assistant powered by LLM with career-specific knowledge base.
    """

    async def chat(
        self,
        message: str,
        context: Optional[Dict] = None,
        user_id: Optional[str] = None,
        conversation_history: Optional[List] = None,
    ) -> str:
        """Process user message and return AI response"""
        await asyncio.sleep(0.1)

        # In production: use Anthropic Claude API
        # from anthropic import Anthropic
        # client = Anthropic()
        # response = client.messages.create(
        #     model="claude-opus-4-7",
        #     max_tokens=1024,
        #     system=SYSTEM_PROMPT,
        #     messages=[{"role": "user", "content": message}]
        # )
        # return response.content[0].text

        msg_lower = message.lower()
        if any(w in msg_lower for w in ["interview", "prepare", "prep", "question"]):
            return RESPONSES["interview"]
        elif any(w in msg_lower for w in ["salary", "negotiate", "compensation", "pay", "offer"]):
            return RESPONSES["salary"]
        else:
            return RESPONSES["default"]

    async def get_insights(self, user_profile: Dict) -> List[Dict]:
        """Generate personalized career insights"""
        skills = user_profile.get("skills", [])
        insights = [
            {
                "category": "skill_gap",
                "title": "System Design Skills In High Demand",
                "description": "Adding system design to your profile could increase match scores by 23%.",
                "priority": "high",
                "actionItems": [
                    "Study 'Designing Data-Intensive Applications' by Kleppmann",
                    "Practice on system-design-primer GitHub repo",
                    "Add 'distributed systems' to your resume",
                ],
            },
            {
                "category": "salary",
                "title": "Negotiation Opportunity",
                "description": "Based on your experience and skills, you may be underpaid by $15-20K in the current market.",
                "priority": "high",
                "actionItems": [
                    "Research your market value on levels.fyi",
                    "Get competing offers to strengthen your position",
                    "Consider applying to 20% higher salary ranges",
                ],
            },
            {
                "category": "growth",
                "title": "TypeScript Mastery Pays Off",
                "description": "TypeScript specialists earn 18% more on average. You're already proficient — highlight this more.",
                "priority": "medium",
                "actionItems": [
                    "Showcase TypeScript projects in your portfolio",
                    "Contribute to DefinitelyTyped or write type definitions",
                    "Get the TypeScript Intermediate certificate",
                ],
            },
        ]
        return insights

# 🚀 Omnify — AI-Powered Job Automation Platform

> **Your intelligent career co-pilot.** Discover jobs, optimize resumes, automate applications, and track your hiring journey with AI-powered tools and browser automation.

![Omnify Banner](https://img.shields.io/badge/Omnify-AI_Career_Platform-64b6ac?style=for-the-badge&logo=sparkles)
![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Resume Analyzer** | ATS scoring, skill extraction, improvement suggestions |
| 🎯 **AI Job Matching** | Compatibility scores based on skills & experience |
| ⚡ **One-Click Auto Apply** | Browser automation with Playwright |
| ✉️ **AI Cover Letters** | Personalized, job-specific cover letter generation |
| 📊 **Application Tracker** | Full pipeline tracking with timeline & analytics |
| 💬 **AI Career Assistant** | Interview prep, salary negotiation, career insights |
| 🔔 **Smart Notifications** | Job matches, interview reminders, status updates |
| 🛡️ **Admin Dashboard** | User management, system health, analytics |

---

## 🏗️ Architecture

```
omnify/
├── frontend/          # Next.js 14 + TailwindCSS + Framer Motion
├── backend/           # Node.js + Express.js REST API
├── ai-service/        # Python FastAPI AI microservice
└── docker-compose.yml # Full stack orchestration
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express.js, JWT Auth, Multer, Rate Limiting |
| **AI Service** | Python, FastAPI, Transformers, spaCy, sentence-transformers |
| **Database** | MongoDB + Mongoose ODM |
| **Automation** | Playwright (browser automation) |
| **State Management** | Zustand + React Query |
| **Charts** | Recharts |

---

## 🎨 Design System

**Color Palette:**
- `#5d737e` — Blue Slate (primary text/brand)
- `#64b6ac` — Tropical Teal (primary action)
- `#c0fdfb` — Icy Aqua (backgrounds/accents)
- `#daffef` — Frozen Water (surface)
- `#fcfffd` — White (background)

**Typography:** Plus Jakarta Sans (Google Fonts)  
**Style:** Glassmorphism with modern SaaS aesthetics  
**Animations:** Framer Motion with spring physics

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB 7.0+ (or Docker)

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/yourusername/omnify.git
cd omnify

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker compose up -d

# Visit http://localhost:3000
```

### Option 2: Local Development

**1. Frontend**
```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
# → http://localhost:3000
```

**2. Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with MongoDB URI and JWT secrets
npm run dev
# → http://localhost:5000
```

**3. AI Service**
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
```

---

## 📁 Project Structure

### Frontend (`/frontend/src/`)

```
app/
├── page.tsx                    # Landing page
├── (auth)/
│   ├── login/page.tsx          # Login page
│   └── register/page.tsx       # Registration
└── (dashboard)/
    ├── dashboard/page.tsx      # Main dashboard
    ├── resume/page.tsx         # Resume analyzer
    ├── jobs/page.tsx           # Job search
    ├── saved-jobs/page.tsx     # Saved jobs
    ├── applications/page.tsx   # Application tracker
    ├── career-assistant/page.tsx # AI chat
    └── settings/page.tsx       # User settings

components/
├── ui/                         # Button, Input, Card, Modal, etc.
├── layout/                     # Sidebar, Header, DashboardLayout
├── dashboard/                  # StatsCard, charts
└── ...

lib/
├── api.ts                      # Axios API clients
└── utils.ts                    # Utility functions

store/
└── useAuthStore.ts             # Zustand auth state

types/
└── index.ts                    # TypeScript types
```

### Backend (`/backend/src/`)

```
routes/
├── auth.js         # Register, login, refresh, password reset
├── users.js        # Profile management
├── resumes.js      # Upload, analyze, manage
├── jobs.js         # Search, match, save
├── applications.js # Track, update status
├── coverLetters.js # Generate, edit
├── career.js       # Insights, salary, chat
├── notifications.js
└── admin.js

models/
├── User.js         # User schema with bcrypt
├── Job.js          # Job posting schema
├── Application.js  # Application tracking
├── Resume.js       # Resume + analysis
├── CoverLetter.js
└── Notification.js
```

### AI Service (`/ai-service/app/`)

```
services/
├── resume_analyzer.py      # ATS scoring, skill extraction
├── job_matcher.py          # Semantic job matching
├── cover_letter_generator.py # AI cover letters
├── career_assistant.py     # LLM career coaching
└── automation.py           # Playwright automation

routers/
├── resume.py
├── jobs.py
├── cover_letter.py
├── career.py
└── automation.py
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register       Create account
POST /api/auth/login          Sign in
POST /api/auth/logout         Sign out
GET  /api/auth/me             Current user
POST /api/auth/refresh        Refresh token
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Resume
```
POST /api/resumes/upload      Upload PDF/DOCX
GET  /api/resumes             List resumes
POST /api/resumes/:id/analyze Trigger AI analysis
PUT  /api/resumes/:id/default Set as default
DELETE /api/resumes/:id
```

### Jobs
```
GET  /api/jobs/search         Search with filters
GET  /api/jobs/recommended    AI-matched jobs
GET  /api/jobs/:id            Job detail
POST /api/jobs/:id/save       Save job
DELETE /api/jobs/:id/save     Unsave job
```

### Applications
```
GET  /api/applications        List applications
GET  /api/applications/stats  Dashboard stats
POST /api/applications        Create application
PUT  /api/applications/:id/status  Update status
POST /api/applications/:id/interviews  Add interview
```

### AI Service
```
POST /analyze-resume          Analyze resume
POST /generate-cover-letter   Generate cover letter
POST /career-chat             AI career chat
POST /automation/apply        Auto-apply to job
```

---

## 🌐 Pages Overview

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Marketing page with features, pricing |
| Login | `/login` | JWT authentication |
| Register | `/register` | Account creation |
| Dashboard | `/dashboard` | Stats, recommendations, activity |
| Resume | `/resume` | Upload & analyze resume |
| Jobs | `/jobs` | Search with AI matching |
| Saved Jobs | `/saved-jobs` | Bookmarked positions |
| Applications | `/applications` | Full pipeline tracker |
| AI Assistant | `/career-assistant` | Chat-based career coaching |
| Settings | `/settings` | Profile, notifications, billing |
| Admin | `/admin` | Platform management |

---

## 🔐 Security Features

- JWT access tokens (1d) + refresh tokens (7d) with rotation
- Bcrypt password hashing (salt rounds: 12)
- Rate limiting (200 req/15min general, 10 req/15min auth)
- MongoDB sanitization (NoSQL injection prevention)
- HTTP Parameter Pollution (HPP) protection
- Helmet.js security headers
- CORS with whitelist
- Input validation via express-validator + Zod

---

## 🧪 Development

```bash
# Lint frontend
cd frontend && npm run lint

# Type check
cd frontend && npx tsc --noEmit

# Build check
cd frontend && npm run build
```

---

## 📊 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret | ✅ |
| `ANTHROPIC_API_KEY` | For production AI features | Optional |
| `CLOUDINARY_*` | File storage (production) | Optional |
| `EMAIL_*` | SMTP for password reset | Optional |

---

## 📜 License

MIT License — free to use and modify.

---

<div align="center">

**Built with ❤️ using Next.js, FastAPI, and AI**

[Live Demo](https://omnify.ai) · [Documentation](https://docs.omnify.ai) · [Report Bug](https://github.com/yourusername/omnify/issues)

</div>

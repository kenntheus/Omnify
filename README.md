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

## 🚀 Quick Start

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

<div align="center">

**Built with ❤️ using Next.js, FastAPI, and AI**

[Live Demo](https://omnify.ai) · [Documentation](https://docs.omnify.ai) · [Report Bug](https://github.com/yourusername/omnify/issues)

</div>

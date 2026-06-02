# Omnify

Omnify is a full-stack AI job automation platform built to take the grind out of job hunting. It brings together resume analysis, job matching, automated applications, and career coaching in one place so you can focus on the interviews, not the spreadsheets.

---

## Features

**Resume Analysis**
Uploads your resume and runs an ATS compatibility check, extracts skills, and gives you specific suggestions to improve your score before you apply.

**AI Job Matching**
Every job listing gets a match score based on your skills, experience, and preferences. The recommended feed gets smarter the more your profile fills out.

**One-Click Auto Apply**
Uses Playwright browser automation to submit applications on external job sites. If the automation service is unavailable, the application is still tracked manually.

**AI Cover Letter Generator**
Generates a tailored cover letter for any job listing in your choice of tone. You can edit and regenerate as many times as you want.

**Application Tracker**
Full pipeline view from saved to offer, with a timeline of every status change, interview scheduler, notes, and weekly activity charts.

**Career Assistant**
Chat-based AI assistant for interview prep, salary research, skill gap analysis, and general career questions.

**Smart Notifications**
Alerts for job matches, application status changes, and upcoming interviews. Fully controllable through notification preferences.

**Admin Panel**
User management, platform growth charts, top skills in demand, and system health monitoring.

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand, Recharts |
| Backend | Node.js, Express.js, JWT + refresh token rotation, Multer, express-validator |
| AI Service | Python, FastAPI, Playwright, spaCy, sentence-transformers |
| Database | MongoDB, Mongoose |
| Security | Helmet, rate limiting, mongo-sanitize, HPP, bcrypt (12 rounds) |

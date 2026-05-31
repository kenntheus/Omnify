// ============================================================
// OMNIFY — Type Definitions
// ============================================================

// ─── User & Auth ────────────────────────────────────────────
export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  profile: UserProfile
  preferences: UserPreferences
  subscription: 'free' | 'pro' | 'enterprise'
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  title?: string
  location?: string
  phone?: string
  bio?: string
  linkedin?: string
  github?: string
  portfolio?: string
  skills: string[]
  experience: Experience[]
  education: Education[]
  desiredSalaryMin?: number
  desiredSalaryMax?: number
  desiredLocations?: string[]
  remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'any'
}

export interface UserPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  jobAlerts: boolean
  theme: 'light' | 'dark' | 'system'
  language?: string
  currency?: string
  dateFormat?: string
}

export interface Experience {
  company: string
  title: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
  skills?: string[]
}

export interface Education {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate?: string
  gpa?: number
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// ─── Resume ─────────────────────────────────────────────────
export interface Resume {
  _id: string
  userId: string
  fileName: string
  fileUrl: string
  fileType: 'pdf' | 'docx'
  uploadedAt: string
  analysis?: ResumeAnalysis
  isDefault: boolean
}

export interface ResumeAnalysis {
  atsScore: number
  overallScore: number
  skills: ExtractedSkill[]
  experience: ExperienceItem[]
  education: EducationItem[]
  keywords: string[]
  strengths: string[]
  improvements: SuggestionItem[]
  formattingScore: number
  contentScore: number
  impactScore: number
  analyzedAt: string
}

export interface ExtractedSkill {
  name: string
  category: 'technical' | 'soft' | 'language' | 'tool'
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  yearsOfExperience?: number
}

export interface ExperienceItem {
  company: string
  role: string
  duration: string
  description: string
}

export interface EducationItem {
  institution: string
  degree: string
  year: string
}

export interface SuggestionItem {
  category: 'content' | 'formatting' | 'keywords' | 'impact'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  example?: string
}

// ─── Jobs ────────────────────────────────────────────────────
export interface Job {
  _id: string
  title: string
  company: CompanyInfo
  location: string
  remote: 'remote' | 'hybrid' | 'onsite'
  salary?: SalaryRange
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  skills: string[]
  experience: string
  education?: string
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
  source: 'linkedin' | 'indeed' | 'glassdoor' | 'manual' | 'scraped'
  sourceUrl?: string
  postedAt: string
  deadline?: string
  matchScore?: number
  isSaved?: boolean
  isApplied?: boolean
  tags?: string[]
  createdAt: string
}

export interface CompanyInfo {
  name: string
  logo?: string
  industry?: string
  size?: string
  rating?: number
  website?: string
  description?: string
}

export interface SalaryRange {
  min: number
  max: number
  currency: string
  period: 'hourly' | 'monthly' | 'yearly'
}

export interface JobFilters {
  query?: string
  location?: string
  remote?: string
  type?: string
  salary_min?: number
  salary_max?: number
  experience?: string
  skills?: string[]
  industry?: string
  posted_within?: string
  page?: number
  limit?: number
}

// ─── Applications ────────────────────────────────────────────
export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'pending'
  | 'reviewing'
  | 'phone_screen'
  | 'interview'
  | 'technical'
  | 'final_interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export interface Application {
  _id: string
  userId: string
  jobId: string
  job: Job
  status: ApplicationStatus
  appliedAt?: string
  resumeId?: string
  coverLetter?: string
  notes?: string
  timeline: ApplicationTimelineEvent[]
  interviews: Interview[]
  offer?: JobOffer
  automatedApply: boolean
  customAnswers?: Record<string, string>
  followUpDate?: string
  createdAt: string
  updatedAt: string
}

export interface ApplicationTimelineEvent {
  status: ApplicationStatus
  date: string
  note?: string
  automated: boolean
}

export interface Interview {
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'panel'
  scheduledAt: string
  duration?: number
  location?: string
  meetingLink?: string
  interviewer?: string
  notes?: string
  completed: boolean
  feedback?: string
}

export interface JobOffer {
  salary: number
  currency: string
  equity?: string
  bonus?: number
  startDate?: string
  benefits?: string[]
  deadline?: string
  accepted?: boolean
  notes?: string
}

export interface ApplicationStats {
  total: number
  applied: number
  pending: number
  interviews: number
  offers: number
  rejected: number
  responseRate: number
  avgResponseDays: number
}

// ─── Cover Letter ────────────────────────────────────────────
export interface CoverLetter {
  _id: string
  userId: string
  jobId?: string
  job?: Job
  content: string
  tone: 'professional' | 'enthusiastic' | 'formal' | 'creative'
  generatedAt: string
  edited: boolean
  used: boolean
}

// ─── AI Career ───────────────────────────────────────────────
export interface CareerInsight {
  category: 'skill_gap' | 'salary' | 'growth' | 'interview' | 'networking'
  title: string
  description: string
  actionItems: string[]
  resources?: Resource[]
  priority: 'high' | 'medium' | 'low'
}

export interface Resource {
  title: string
  url: string
  type: 'article' | 'course' | 'video' | 'book'
  free: boolean
}

export interface SalaryEstimate {
  role: string
  location: string
  min: number
  max: number
  median: number
  currency: string
  source: string
  updatedAt: string
}

export interface InterviewQuestion {
  question: string
  category: 'behavioral' | 'technical' | 'situational' | 'company'
  difficulty: 'easy' | 'medium' | 'hard'
  tips: string[]
  sampleAnswer?: string
}

// ─── Notifications ────────────────────────────────────────────
export interface Notification {
  _id: string
  userId: string
  type: 'job_match' | 'application_update' | 'interview_reminder' | 'system' | 'tip'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── Analytics & Dashboard ───────────────────────────────────
export interface DashboardStats {
  applications: ApplicationStats
  savedJobs: number
  resumeScore?: number
  profileCompletion: number
  recentActivity: ActivityItem[]
  upcomingInterviews: Interview[]
  jobRecommendations: Job[]
  weeklyApplications: WeeklyData[]
  applicationsByStatus: StatusData[]
}

export interface ActivityItem {
  type: string
  description: string
  date: string
  metadata?: Record<string, unknown>
}

export interface WeeklyData {
  week: string
  applications: number
  views: number
  responses: number
}

export interface StatusData {
  status: ApplicationStatus
  count: number
  color: string
}

// ─── Admin ────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalApplications: number
  totalJobs: number
  newUsersToday: number
  applicationsToday: number
  systemHealth: SystemHealth
  userGrowth: GrowthData[]
  topSkills: SkillData[]
}

export interface SystemHealth {
  api: 'healthy' | 'degraded' | 'down'
  aiService: 'healthy' | 'degraded' | 'down'
  database: 'healthy' | 'degraded' | 'down'
  automation: 'healthy' | 'degraded' | 'down'
  uptime: number
}

export interface GrowthData {
  date: string
  users: number
  applications: number
}

export interface SkillData {
  skill: string
  count: number
  trend: 'up' | 'down' | 'stable'
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  pagination?: Pagination
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

// ─── Form Types ───────────────────────────────────────────────
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface JobSearchForm {
  query: string
  location: string
  remote: string
  type: string
  experience: string
  salaryMin: string
  salaryMax: string
}

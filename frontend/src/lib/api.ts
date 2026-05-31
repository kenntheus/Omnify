import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const AI_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

// ─── Main API client ─────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('omnify_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = Cookies.get('omnify_refresh')
        if (refresh) {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken: refresh })
          Cookies.set('omnify_token', data.data.token, { expires: 1 })
          original.headers.Authorization = `Bearer ${data.data.token}`
          return api(original)
        }
      } catch {
        Cookies.remove('omnify_token')
        Cookies.remove('omnify_refresh')
        if (typeof window !== 'undefined') window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── AI Service client ────────────────────────────────────────
export const aiApi: AxiosInstance = axios.create({
  baseURL: AI_URL,
  timeout: 60000,
})

aiApi.interceptors.request.use((config) => {
  const token = Cookies.get('omnify_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

// ─── User API ─────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: unknown) => api.put('/users/profile', data),

  updatePreferences: (data: unknown) => api.put('/users/preferences', data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  deleteAccount: () => api.delete('/users/account'),
}

// ─── Resume API ───────────────────────────────────────────────
export const resumeAPI = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('resume', file)
    return api.post('/resumes/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },

  getAll: () => api.get('/resumes'),

  getById: (id: string) => api.get(`/resumes/${id}`),

  analyze: (id: string) => api.post(`/resumes/${id}/analyze`),

  setDefault: (id: string) => api.put(`/resumes/${id}/default`),

  delete: (id: string) => api.delete(`/resumes/${id}`),
}

// ─── Jobs API ─────────────────────────────────────────────────
export const jobsAPI = {
  search: (params: Record<string, unknown>) => api.get('/jobs/search', { params }),

  getById: (id: string) => api.get(`/jobs/${id}`),

  getRecommended: (params?: Record<string, unknown>) =>
    api.get('/jobs/recommended', { params }),

  saveJob: (jobId: string) => api.post(`/jobs/${jobId}/save`),

  unsaveJob: (jobId: string) => api.delete(`/jobs/${jobId}/save`),

  getSaved: (params?: Record<string, unknown>) => api.get('/jobs/saved', { params }),

  getMatchScore: (jobId: string) => api.get(`/jobs/${jobId}/match-score`),
}

// ─── Applications API ─────────────────────────────────────────
export const applicationsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/applications', { params }),

  getById: (id: string) => api.get(`/applications/${id}`),

  create: (data: unknown) => api.post('/applications', data),

  updateStatus: (id: string, status: string, note?: string) =>
    api.put(`/applications/${id}/status`, { status, note }),

  addNote: (id: string, note: string) =>
    api.post(`/applications/${id}/notes`, { note }),

  addInterview: (id: string, data: unknown) =>
    api.post(`/applications/${id}/interviews`, data),

  getStats: () => api.get('/applications/stats'),

  delete: (id: string) => api.delete(`/applications/${id}`),

  autoApply: (jobId: string, resumeId: string, data: unknown) =>
    api.post('/applications/auto-apply', { jobId, resumeId, ...data as object }),
}

// ─── Cover Letter API ─────────────────────────────────────────
export const coverLetterAPI = {
  generate: (jobId: string, resumeId: string, tone?: string) =>
    api.post('/cover-letters/generate', { jobId, resumeId, tone }),

  getAll: () => api.get('/cover-letters'),

  getById: (id: string) => api.get(`/cover-letters/${id}`),

  update: (id: string, content: string) =>
    api.put(`/cover-letters/${id}`, { content }),

  delete: (id: string) => api.delete(`/cover-letters/${id}`),
}

// ─── Career AI API ────────────────────────────────────────────
export const careerAPI = {
  getInsights: () => api.get('/career/insights'),

  getSalaryEstimate: (role: string, location: string) =>
    api.get('/career/salary', { params: { role, location } }),

  getInterviewQuestions: (jobId?: string, skills?: string[]) =>
    api.get('/career/interview-questions', { params: { jobId, skills } }),

  getSkillRecommendations: () => api.get('/career/skill-recommendations'),

  chat: (message: string, context?: Record<string, unknown>) =>
    api.post('/career/chat', { message, context }),
}

// ─── Notifications API ────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/notifications', { params }),

  markRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllRead: () => api.put('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),

  getUnreadCount: () => api.get('/notifications/unread-count'),
}

// ─── Admin API ────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),

  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),

  getUserById: (id: string) => api.get(`/admin/users/${id}`),

  updateUser: (id: string, data: unknown) => api.put(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  getSystemHealth: () => api.get('/admin/health'),

  getLogs: (params?: Record<string, unknown>) => api.get('/admin/logs', { params }),
}

export default api

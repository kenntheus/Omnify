import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { User } from '@/types'
import { authAPI } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setTokens: (token: string, refreshToken: string) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.login(email, password)
          const { user, token, refreshToken } = data.data

          Cookies.set('omnify_token', token, { expires: 1 })
          Cookies.set('omnify_refresh', refreshToken, { expires: 7 })

          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
          set({ error: msg, isLoading: false })
          throw new Error(msg)
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.register(name, email, password)
          const { user, token, refreshToken } = data.data

          Cookies.set('omnify_token', token, { expires: 1 })
          Cookies.set('omnify_refresh', refreshToken, { expires: 7 })

          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed'
          set({ error: msg, isLoading: false })
          throw new Error(msg)
        }
      },

      logout: () => {
        Cookies.remove('omnify_token')
        Cookies.remove('omnify_refresh')
        set({ user: null, token: null, isAuthenticated: false })
        if (typeof window !== 'undefined') window.location.href = '/login'
      },

      loadUser: async () => {
        const token = Cookies.get('omnify_token')
        if (!token) {
          set({ isAuthenticated: false, isLoading: false })
          return
        }
        set({ isLoading: true })
        try {
          const { data } = await authAPI.me()
          set({ user: data.data, token, isAuthenticated: true, isLoading: false })
        } catch {
          Cookies.remove('omnify_token')
          Cookies.remove('omnify_refresh')
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      updateUser: (updates) => {
        const current = get().user
        if (current) set({ user: { ...current, ...updates } })
      },

      setTokens: (token, refreshToken) => {
        Cookies.set('omnify_token', token, { expires: 1 })
        Cookies.set('omnify_refresh', refreshToken, { expires: 7 })
        set({ token })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'omnify-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)

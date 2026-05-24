import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, parseISO } from 'date-fns'

// ─── Class name utility ───────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date utilities ───────────────────────────────────────────
export function timeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return 'Unknown date'
  }
}

export function formatDate(dateString: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateString), fmt)
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy • h:mm a')
  } catch {
    return dateString
  }
}

// ─── Currency utilities ───────────────────────────────────────
export function formatSalary(min: number, max: number, currency = 'USD', period = 'yearly'): string {
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })
  const periodLabel = period === 'yearly' ? '/yr' : period === 'monthly' ? '/mo' : '/hr'
  if (min === max) return `${fmt.format(min)}${periodLabel}`
  return `${fmt.format(min)} – ${fmt.format(max)}${periodLabel}`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatCurrency(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

// ─── Score helpers ────────────────────────────────────────────
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'bg-amber-50 border-amber-200'
  if (score >= 40) return 'bg-orange-50 border-orange-200'
  return 'bg-red-50 border-red-200'
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Great'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

// ─── Status helpers ───────────────────────────────────────────
export const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  saved: { label: 'Saved', color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  applied: { label: 'Applied', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  reviewing: { label: 'Reviewing', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  phone_screen: { label: 'Phone Screen', color: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  interview: { label: 'Interview', color: 'text-cyan-700', bg: 'bg-cyan-50', dot: 'bg-cyan-500' },
  technical: { label: 'Technical', color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500' },
  final_interview: { label: 'Final Interview', color: 'text-fuchsia-700', bg: 'bg-fuchsia-50', dot: 'bg-fuchsia-500' },
  offer: { label: 'Offer Received', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  accepted: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' },
}

export function getStatusConfig(status: string) {
  return statusConfig[status] || statusConfig.applied
}

// ─── String utilities ─────────────────────────────────────────
export function truncate(str: string, len = 100): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + '…'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// ─── Validation ───────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
}

// ─── File utilities ───────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileIcon(type: string): string {
  if (type.includes('pdf')) return 'file-text'
  if (type.includes('word') || type.includes('document')) return 'file-text'
  if (type.includes('image')) return 'image'
  return 'file'
}

// ─── Array utilities ──────────────────────────────────────────
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(arr: T[], key: keyof T, dir: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const va = a[key], vb = b[key]
    if (va < vb) return dir === 'asc' ? -1 : 1
    if (va > vb) return dir === 'asc' ? 1 : -1
    return 0
  })
}

// ─── Color utilities ──────────────────────────────────────────
export function hexToRgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ─── Local storage ────────────────────────────────────────────
export function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

export function setLS<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function removeLS(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

// ─── Debounce ────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bell, Shield, Palette, Trash2, Save, Camera, Check, Plus, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { userAPI, authAPI } from '@/lib/api'
import type { UserPreferences } from '@/types'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Palette },
]

const notifItems: { key: keyof Omit<UserPreferences, 'theme'>; title: string; desc: string }[] = [
  { key: 'jobAlerts', title: 'New job matches', desc: 'Get notified when new jobs match your profile' },
  { key: 'emailNotifications', title: 'Application updates', desc: 'Status changes on your applications' },
  { key: 'pushNotifications', title: 'Interview reminders', desc: '24 hours before scheduled interviews' },
  { key: 'weeklyDigest', title: 'Weekly job digest', desc: 'A weekly summary of top job matches' },
]

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore()

  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ── Profile fields ─────────────────────────────────────────
  const [name, setName] = useState(user?.name || '')
  const [title, setTitle] = useState(user?.profile?.title || '')
  const [location, setLocation] = useState(user?.profile?.location || '')
  const [phone, setPhone] = useState(user?.profile?.phone || '')
  const [linkedin, setLinkedin] = useState(user?.profile?.linkedin || '')
  const [bio, setBio] = useState(user?.profile?.bio || '')
  const [userSkills, setUserSkills] = useState<string[]>(user?.profile?.skills || [])
  const [newSkill, setNewSkill] = useState('')
  const [remotePreference, setRemotePreference] = useState<string>(user?.profile?.remotePreference || 'any')
  const [salaryMin, setSalaryMin] = useState(user?.profile?.desiredSalaryMin?.toString() || '')
  const [salaryMax, setSalaryMax] = useState(user?.profile?.desiredSalaryMax?.toString() || '')

  // ── Notification preferences ───────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    jobAlerts: user?.preferences?.jobAlerts ?? true,
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    weeklyDigest: user?.preferences?.weeklyDigest ?? false,
  })

  // ── Security ───────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // ── App preferences ────────────────────────────────────────
  const [theme, setTheme] = useState<UserPreferences['theme']>(user?.preferences?.theme || 'light')

  const flashSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await userAPI.updateProfile({
        name,
        profile: {
          ...(user?.profile || {}),
          title,
          location,
          phone,
          linkedin,
          bio,
          skills: userSkills,
          remotePreference,
          desiredSalaryMin: salaryMin ? Number(salaryMin) : undefined,
          desiredSalaryMax: salaryMax ? Number(salaryMax) : undefined,
        },
      })
      updateUser(res.data.data)
      flashSaved()
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const resetProfile = () => {
    setName(user?.name || '')
    setTitle(user?.profile?.title || '')
    setLocation(user?.profile?.location || '')
    setPhone(user?.profile?.phone || '')
    setLinkedin(user?.profile?.linkedin || '')
    setBio(user?.profile?.bio || '')
    setUserSkills(user?.profile?.skills || [])
    setRemotePreference(user?.profile?.remotePreference || 'any')
    setSalaryMin(user?.profile?.desiredSalaryMin?.toString() || '')
    setSalaryMax(user?.profile?.desiredSalaryMax?.toString() || '')
  }

  const saveNotifications = async () => {
    setSaving(true)
    try {
      await userAPI.updatePreferences(notifPrefs)
      updateUser({ preferences: { ...user?.preferences, ...notifPrefs } as UserPreferences })
      flashSaved()
      toast.success('Notification preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const saveAppPreferences = async () => {
    setSaving(true)
    try {
      await userAPI.updatePreferences({ theme })
      updateUser({ preferences: { ...user?.preferences, theme } as UserPreferences })
      flashSaved()
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const res = await userAPI.uploadAvatar(file)
      updateUser(res.data.data)
      toast.success('Avatar updated')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated successfully')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to update password')
    } finally {
      setChangingPassword(false)
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('This will permanently deactivate your account. Are you sure?')) return
    try {
      await userAPI.deleteAccount()
      logout()
    } catch {
      toast.error('Failed to delete account')
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !userSkills.includes(newSkill.trim())) {
      setUserSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => setUserSkills(prev => prev.filter(s => s !== skill))

  const toggleNotif = (key: keyof typeof notifPrefs) =>
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))

  const SaveButton = ({ onClick }: { onClick: () => void }) => (
    <Button onClick={onClick} loading={saving} leftIcon={saved ? <Check size={15} /> : <Save size={15} />}>
      {saved ? 'Saved!' : 'Save Changes'}
    </Button>
  )

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* Sidebar tabs */}
        <nav className="flex md:flex-col gap-1 md:w-48 flex-shrink-0 overflow-x-auto scroll-hide md:overflow-visible">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
                activeTab === tab.id
                  ? 'bg-brand-teal/15 text-brand-teal'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              )}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 glass-card p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Profile ──────────────────────────────────── */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-4">Personal Information</h3>

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl object-cover shadow-brand" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center text-white text-2xl font-bold shadow-brand">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Camera size={13} className="text-slate-600" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-500 mb-2">{user?.email}</p>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                        <Button variant="secondary" size="xs" loading={uploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
                          Upload photo
                        </Button>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your full name"
                      />
                      <Input
                        label="Email address"
                        type="email"
                        value={user?.email || ''}
                        placeholder="your@email.com"
                        disabled
                      />
                      <Input
                        label="Job title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Your current or desired title"
                      />
                      <Input
                        label="Location"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="City, State"
                      />
                      <Input
                        label="Phone number"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                      <Input
                        label="LinkedIn URL"
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        placeholder="linkedin.com/in/username"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Professional Bio
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="A brief professional summary..."
                        className="w-full px-4 py-3 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-brand-teal/60 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {userSkills.map(skill => (
                        <div key={skill} className="flex items-center gap-1.5 bg-brand-aqua/40 text-primary-700 border border-brand-teal/20 px-3 py-1.5 rounded-full text-sm font-medium group">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-xs">
                      <Input
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSkill()}
                        placeholder="Add a skill..."
                        className="text-sm"
                      />
                      <Button variant="secondary" onClick={addSkill} leftIcon={<Plus size={14} />}>Add</Button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Job Preferences</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Remote Preference</label>
                        <select
                          value={remotePreference}
                          onChange={e => setRemotePreference(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 focus:outline-none focus:border-brand-teal/60 transition-all"
                        >
                          <option value="any">Any</option>
                          <option value="remote">Remote only</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="onsite">On-site</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Type</label>
                        <select className="w-full px-4 py-3 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 focus:outline-none focus:border-brand-teal/60 transition-all">
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                        </select>
                      </div>
                      <Input
                        label="Minimum salary (USD)"
                        type="number"
                        value={salaryMin}
                        onChange={e => setSalaryMin(e.target.value)}
                        placeholder="120000"
                      />
                      <Input
                        label="Maximum salary (USD)"
                        type="number"
                        value={salaryMax}
                        onChange={e => setSalaryMax(e.target.value)}
                        placeholder="250000"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={resetProfile} disabled={saving}>Cancel</Button>
                    <SaveButton onClick={saveProfile} />
                  </div>
                </div>
              )}

              {/* ── Notifications ─────────────────────────────── */}
              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800">Notification Preferences</h3>
                  {notifItems.map(({ key, title: label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifPrefs[key]}
                          onChange={() => toggleNotif(key)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal" />
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <SaveButton onClick={saveNotifications} />
                  </div>
                </div>
              )}

              {/* ── Security ──────────────────────────────────── */}
              {activeTab === 'security' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800">Security Settings</h3>
                  <div className="space-y-4">
                    <Input
                      label="Current password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                    <Input
                      label="New password"
                      type="password"
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <Input
                      label="Confirm new password"
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      leftIcon={<Shield size={15} />}
                      loading={changingPassword}
                      onClick={changePassword}
                      disabled={!currentPassword || !newPassword || !confirmPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Danger Zone</h4>
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
                      <p className="text-sm font-semibold text-red-700 mb-1">Delete Account</p>
                      <p className="text-xs text-red-600 mb-3">This action is permanent and cannot be undone.</p>
                      <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={deleteAccount}>
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Preferences ───────────────────────────────── */}
              {activeTab === 'preferences' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800">App Preferences</h3>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-700">Theme</p>
                    <select
                      value={theme}
                      onChange={e => setTheme(e.target.value as UserPreferences['theme'])}
                      className="px-3 py-2 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 focus:outline-none focus:border-brand-teal/60 transition-all"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  {[
                    { label: 'Language', options: ['English', 'Spanish', 'French', 'German'], defaultValue: 'English' },
                    { label: 'Currency', options: ['USD', 'EUR', 'GBP', 'CAD'], defaultValue: 'USD' },
                    { label: 'Date format', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], defaultValue: 'MM/DD/YYYY' },
                  ].map(p => (
                    <div key={p.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <p className="text-sm font-medium text-slate-700">{p.label}</p>
                      <select
                        defaultValue={p.defaultValue}
                        className="px-3 py-2 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 focus:outline-none focus:border-brand-teal/60 transition-all"
                      >
                        {p.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <SaveButton onClick={saveAppPreferences} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

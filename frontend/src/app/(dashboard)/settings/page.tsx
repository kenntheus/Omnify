'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bell, Shield, CreditCard, Palette, Trash2, Save, Camera, Check, Plus, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'preferences', label: 'Preferences', icon: Palette },
]

const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'GraphQL', 'AWS', 'Docker']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [userSkills, setUserSkills] = useState(skills)
  const { user } = useAuthStore()

  const handleSave = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addSkill = () => {
    if (newSkill.trim() && !userSkills.includes(newSkill.trim())) {
      setUserSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => setUserSkills(prev => prev.filter(s => s !== skill))

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
              {/* Profile tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-4">Personal Information</h3>

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center text-white text-2xl font-bold shadow-brand">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
                          <Camera size={13} className="text-slate-600" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-500 mb-2">{user?.email}</p>
                        <Button variant="secondary" size="xs">Upload photo</Button>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input label="Full name" defaultValue={user?.name || ''} placeholder="Your full name" />
                      <Input label="Email address" type="email" defaultValue={user?.email || ''} placeholder="your@email.com" />
                      <Input label="Job title" defaultValue="Senior Frontend Engineer" placeholder="Your current or desired title" />
                      <Input label="Location" defaultValue="San Francisco, CA" placeholder="City, State" />
                      <Input label="Phone number" type="tel" placeholder="+1 (555) 000-0000" />
                      <Input label="LinkedIn URL" placeholder="linkedin.com/in/username" />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Professional Bio
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-brand-teal/60 focus:bg-white transition-all"
                        defaultValue="Experienced frontend engineer with 5+ years building scalable React applications. Passionate about performance, accessibility, and developer experience."
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
                        <select className="w-full px-4 py-3 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 focus:outline-none focus:border-brand-teal/60 transition-all">
                          <option>Any</option>
                          <option>Remote only</option>
                          <option>Hybrid</option>
                          <option>On-site</option>
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
                      <Input label="Minimum salary (USD)" type="number" placeholder="120000" defaultValue="120000" />
                      <Input label="Maximum salary (USD)" type="number" placeholder="250000" defaultValue="250000" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} leftIcon={saved ? <Check size={15} /> : <Save size={15} />}>
                      {saved ? 'Saved!' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Notifications tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800">Notification Preferences</h3>
                  {[
                    { title: 'New job matches', desc: 'Get notified when new jobs match your profile', defaultOn: true },
                    { title: 'Application updates', desc: 'Status changes on your applications', defaultOn: true },
                    { title: 'Interview reminders', desc: '24 hours before scheduled interviews', defaultOn: true },
                    { title: 'Weekly job digest', desc: 'A weekly summary of top job matches', defaultOn: false },
                    { title: 'AI insights', desc: 'Career tips and skill recommendations', defaultOn: true },
                    { title: 'System updates', desc: 'Product announcements and feature releases', defaultOn: false },
                  ].map((n, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={n.defaultOn} className="sr-only peer" />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal" />
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button onClick={handleSave}>Save Preferences</Button>
                  </div>
                </div>
              )}

              {/* Security tab */}
              {activeTab === 'security' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800">Security Settings</h3>
                  <div className="space-y-4">
                    <Input label="Current password" type="password" placeholder="••••••••" />
                    <Input label="New password" type="password" placeholder="Create a strong password" />
                    <Input label="Confirm new password" type="password" placeholder="Repeat new password" />
                  </div>
                  <div className="flex justify-end">
                    <Button leftIcon={<Shield size={15} />}>Update Password</Button>
                  </div>
                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Danger Zone</h4>
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
                      <p className="text-sm font-semibold text-red-700 mb-1">Delete Account</p>
                      <p className="text-xs text-red-600 mb-3">This action is permanent and cannot be undone.</p>
                      <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />}>Delete My Account</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing tab */}
              {activeTab === 'billing' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800">Billing & Subscription</h3>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-brand-aqua/30 to-brand-frost/60 border border-brand-teal/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="teal">Free Plan</Badge>
                        <p className="text-lg font-bold text-slate-800 mt-2">$0 / month</p>
                        <p className="text-xs text-slate-500 mt-1">10 applications/month · Basic AI features</p>
                      </div>
                      <Button leftIcon={<CreditCard size={15} />}>Upgrade to Pro</Button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { plan: 'Pro', price: '$29', features: ['Unlimited applications', 'Advanced AI matching', 'Auto-apply', 'Cover letter generator', 'Priority support'] },
                      { plan: 'Enterprise', price: '$79', features: ['Everything in Pro', 'Team management', 'Custom integrations', 'API access', 'Dedicated support'] },
                    ].map(p => (
                      <div key={p.plan} className="border-2 border-brand-teal/20 rounded-2xl p-5 hover:border-brand-teal/50 transition-colors">
                        <p className="text-base font-bold text-slate-800">{p.plan}</p>
                        <p className="text-2xl font-bold gradient-text mt-1">{p.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                        <ul className="mt-3 space-y-1.5">
                          {p.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                              <Check size={12} className="text-brand-teal" /> {f}
                            </li>
                          ))}
                        </ul>
                        <Button fullWidth className="mt-4" size="sm">Upgrade to {p.plan}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-800">App Preferences</h3>
                  {[
                    { label: 'Theme', options: ['Light', 'Dark', 'System'], defaultValue: 'Light' },
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
                    <Button onClick={handleSave}>Save Preferences</Button>
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

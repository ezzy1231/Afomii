'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const STEPS = 3

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher',
  'Gluten-Free', 'Dairy-Free', 'Pescatarian', 'Nut-Free',
]

const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish',
  'Dairy', 'Eggs', 'Soy', 'Wheat', 'Sesame',
]

interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  language: string
  birthDate: string
  gender: string
  phone: string
  city: string
  calendarSync: boolean
  dietaryPrefs: string[]
  allergies: string[]
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              n < current
                ? 'bg-gold text-white'
                : n === current
                ? 'bg-navy text-white'
                : 'bg-[var(--border)] text-app-muted'
            }`}
          >
            {n < current ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            ) : n}
          </div>
          {n < STEPS && <div className={`w-10 h-px ${n < current ? 'bg-gold' : 'bg-[var(--border)]'}`} />}
        </div>
      ))}
    </div>
  )
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
        active
          ? 'bg-navy text-white border-navy'
          : 'bg-[var(--bg-card)] text-app-muted border-[var(--border)] hover:border-navy/40'
      }`}
    >
      {label}
    </button>
  )
}

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say']

export default function UserSignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: 'en',
    birthDate: '',
    gender: '',
    phone: '',
    city: '',
    calendarSync: false,
    dietaryPrefs: [],
    allergies: [],
  })

  function set(field: keyof FormData, value: FormData[keyof FormData]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleList(field: 'dietaryPrefs' | 'allergies', value: string) {
    setForm((prev) => {
      const list = prev[field]
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      }
    })
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.fullName.trim()) return 'Full name is required.'
      if (!form.email.trim()) return 'Email is required.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.'
      if (form.password.length < 8) return 'Password must be at least 8 characters.'
      if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    }
    return null
  }

  function handleNext() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    setStep((s) => s + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role: 'user',
          full_name: form.fullName,
          language: form.language,
          birth_date: form.birthDate,
          gender: form.gender,
          phone: form.phone,
          city: form.city,
          calendar_sync: form.calendarSync,
          dietary_prefs: form.dietaryPrefs,
          allergies: form.allergies,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="card-elevated animate-fade-in-up p-10">
          <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-app-fg mb-2">Check your email</h2>
          <p className="text-sm text-app-muted mb-6">
            We sent a confirmation link to <strong className="text-app-fg">{form.email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/auth/signin"
            className="text-sm font-semibold text-app-fg hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="card-elevated animate-fade-in-up p-8 md:p-10">
        <Link
          href="/auth/role"
          className="inline-flex items-center gap-1.5 text-xs text-app-muted hover:text-app-fg mb-6"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to role selection
        </Link>

        <StepIndicator current={step} />

        {step === 1 && (
          <>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Create your account</h1>
            <p className="text-sm text-app-muted mb-6">Step 1 of {STEPS} — Your basics</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1.5">Full name</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="Jane Smith"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1.5">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1.5">Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1.5">Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="Repeat password"
                  className="input-premium"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="btn-primary w-full !py-2.5"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">About you</h1>
            <p className="text-sm text-app-muted mb-6">Step 2 of {STEPS} — Profile details for UrbanExplore</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-app-fg mb-1.5">Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => set('language', e.target.value)}
                    className="input-premium"
                  >
                    <option value="en">English</option>
                    <option value="am">Amharic</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-fg mb-1.5">Birth date</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => set('birthDate', e.target.value)}
                    className="input-premium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                  className="input-premium"
                >
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1.5">
                  Phone number <span className="text-app-muted font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1.5">
                  City <span className="text-app-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="New York"
                  className="input-premium"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium text-app-fg">Sync events to calendar</p>
                  <p className="text-xs text-app-muted mt-0.5">
                    Automatically add booked events to your calendar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set('calendarSync', !form.calendarSync)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.calendarSync ? 'bg-navy' : 'bg-[var(--border)]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.calendarSync ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setError(null); setStep(1) }}
                className="btn-secondary flex-1 !py-2.5"
              >
                Back
              </button>
              <button
                onClick={() => { setError(null); setStep(3) }}
                className="btn-primary flex-1 !py-2.5"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Your preferences</h1>
            <p className="text-sm text-app-muted mb-6">
              Step 3 of {STEPS} — Help us personalise your experience
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div className="mb-5">
              <p className="text-sm font-medium text-app-fg mb-2.5">
                Dietary preferences <span className="text-app-muted font-normal">(select all that apply)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <ToggleChip
                    key={opt}
                    label={opt}
                    active={form.dietaryPrefs.includes(opt)}
                    onClick={() => toggleList('dietaryPrefs', opt)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-app-fg mb-2.5">
                Allergies <span className="text-app-muted font-normal">(select all that apply)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((opt) => (
                  <ToggleChip
                    key={opt}
                    label={opt}
                    active={form.allergies.includes(opt)}
                    onClick={() => toggleList('allergies', opt)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setError(null); setStep(2) }}
                className="btn-secondary flex-1 !py-2.5"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 !py-2.5"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-app-muted mt-6">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-app-fg hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

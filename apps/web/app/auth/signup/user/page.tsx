'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SignupStepper } from '@/components/auth/SignupStepper'
import { StickyActionBar } from '@/components/patterns/StickyActionBar'

const STEPS = 3

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto',
  'Gluten-Free', 'Dairy-Free / Lactose', 'Halal', 'Kosher',
  'Italar (Orthodox Fasting)', 'Fasting Season — Christian', 'Fasting Season — Islam',
  'Organic Only', 'Non-GMO', 'Low FODMAP', 'Low Carb / Diabetic-Friendly', 'Nut-Free',
]

const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Egg', 'Soy', 'Mustard',
  'Fish', 'Seafood / Shellfish', 'Milk / Dairy', 'Wheat / Gluten', 'Sulfites', 'Sesame',
]

const COUNTRY_OPTIONS = [
  { code: 'ET', label: 'Ethiopia' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'DE', label: 'Germany' },
  { code: 'IT', label: 'Italy' },
  { code: 'KE', label: 'Kenya' },
  { code: 'Other', label: 'Other' },
]

interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  language: string
  birthDate: string
  birthCalendar: 'gc' | 'ec'
  gender: string
  phone: string
  city: string
  country: string
  calendarSync: boolean
  dietaryPrefs: string[]
  allergies: string[]
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
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[36px] rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border-gold bg-gold text-navy'
          : 'border-app-border bg-app-card text-app-muted hover:border-gold/50 hover:text-app-fg'
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
    birthCalendar: 'gc',
    gender: '',
    phone: '',
    city: '',
    country: 'ET',
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
          birth_calendar: form.birthCalendar,
          gender: form.gender,
          phone: form.phone,
          city: form.city,
          country: form.country,
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

        <SignupStepper steps={['Account', 'About You', 'Preferences']} current={step} />

        {step === 1 && (
          <>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Create your account</h1>
            <p className="text-sm text-app-muted mb-6">Step 1 of {STEPS} — Your basics</p>

            {error && (
              <div className="mb-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="eyebrow mb-1.5 block">Full name</label>
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
                <label className="eyebrow mb-1.5 block">Email address</label>
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
                <label className="eyebrow mb-1.5 block">Password</label>
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
                <label className="eyebrow mb-1.5 block">Confirm password</label>
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

            <StickyActionBar
              className="mt-6"
              primary={{ label: 'Continue', onClick: handleNext, tone: 'navy' }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">About you</h1>
            <p className="text-sm text-app-muted mb-6">Step 2 of {STEPS} — Profile details for UrbanExplore</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow mb-1.5 block">Language</label>
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
                  <label className="eyebrow mb-1.5 block">Birth date</label>
                  <div className="mb-1.5 inline-flex rounded-md border border-app-border p-0.5">
                    {([
                      { key: 'gc', label: 'Gregorian (GC)' },
                      { key: 'ec', label: 'Ethiopian (EC)' },
                    ] as const).map((cal) => (
                      <button
                        key={cal.key}
                        type="button"
                        onClick={() => set('birthCalendar', cal.key)}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          form.birthCalendar === cal.key
                            ? 'bg-navy text-ivory'
                            : 'text-app-muted hover:text-app-fg'
                        }`}
                      >
                        {cal.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => set('birthDate', e.target.value)}
                    className="input-premium"
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block">Gender</label>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow mb-1.5 block">
                    Country
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                    className="input-premium"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="eyebrow mb-1.5 block">
                    City <span className="ml-1 font-medium normal-case tracking-normal text-app-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Addis Ababa"
                    className="input-premium"
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block">
                  Phone number <span className="ml-1 font-medium normal-case tracking-normal text-app-muted">(optional)</span>
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+251 91 234 5678"
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

            <StickyActionBar
              className="mt-6"
              secondary={{ label: 'Back', onClick: () => { setError(null); setStep(1) } }}
              primary={{ label: 'Continue', onClick: () => { setError(null); setStep(3) }, tone: 'navy' }}
            />
          </>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Curate your experience</h1>
            <p className="text-sm text-app-muted mb-6">
              Tell us what you like so we can recommend the best spots in Addis.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <h3 className="font-serif text-lg font-semibold text-app-fg">Dietary preferences</h3>
              <p className="mb-3 mt-0.5 text-xs text-app-muted">Select all that apply</p>
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

            <hr className="my-6 border-[var(--border)]" />

            <div>
              <h3 className="font-serif text-lg font-semibold text-app-fg">Allergies &amp; restrictions</h3>
              <p className="mb-3 mt-0.5 text-xs text-app-muted">Select all that apply</p>
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

            <StickyActionBar
              className="mt-8"
              secondary={{ label: 'Back', onClick: () => { setError(null); setStep(2) } }}
              primary={{
                type: 'submit',
                tone: 'navy',
                disabled: loading,
                label: loading ? 'Completing setup…' : 'Complete Setup',
              }}
            />
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

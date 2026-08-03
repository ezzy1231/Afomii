'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const STEPS = 4

const CATEGORIES = [
  'Music & Concerts', 'Arts & Theater', 'Sports & Fitness',
  'Food & Drink', 'Business & Networking', 'Community & Culture',
  'Comedy & Entertainment', 'Other',
]

interface FormData {
  contactName: string
  email: string
  password: string
  confirmPassword: string
  orgName: string
  category: string
  description: string
  address: string
  city: string
  country: string
  phone: string
  website: string
  plan: 'free' | 'premium_monthly' | 'premium_yearly'
}

function StepIndicator({ current }: { current: number }) {
  const labels = ['Account', 'Org', 'Location', 'Plan']
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div               className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${n < current ? 'bg-gold text-white' : n === current ? 'bg-navy text-white' : 'bg-[var(--border)] text-app-muted'}`}>
              {n < current ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              ) : n}
            </div>
            <span className={`text-[10px] mt-0.5 ${n === current ? 'text-navy font-medium' : 'text-app-muted'}`}>{labels[n - 1]}</span>
          </div>
          {n < STEPS && <div className={`w-8 h-px mb-4 ${n < current ? 'bg-gold' : 'bg-[var(--border)]'}`} />}
        </div>
      ))}
    </div>
  )
}

const PLANS = [
  {
    key: 'free' as const,
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Up to 3 events per month', 'Standard listing', 'Basic analytics'],
  },
  {
    key: 'premium_monthly' as const,
    name: 'Premium',
    price: '$29',
    period: 'per month',
    badge: 'Popular',
    features: ['Unlimited events', 'Featured placement', 'Ticket QR scanning app', 'Full analytics'],
  },
  {
    key: 'premium_yearly' as const,
    name: 'Premium Yearly',
    price: '$290',
    period: 'per year',
    badge: 'Save $58',
    features: ['Everything in Premium', 'White-label tickets', 'Dedicated account manager'],
  },
]

const inputCls = 'input-premium'

const Field = ({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-app-fg mb-1.5">
      {label}{optional && <span className="text-app-muted font-normal ml-1">(optional)</span>}
    </label>
    {children}
  </div>
)

export default function OrganizerSignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState<FormData>({
    contactName: '', email: '', password: '', confirmPassword: '',
    orgName: '', category: 'Music & Concerts', description: '',
    address: '', city: '', country: '', phone: '', website: '',
    plan: 'free',
  })

  function set(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function validate(): string | null {
    if (step === 1) {
      if (!form.contactName.trim()) return 'Contact name is required.'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Valid email is required.'
      if (form.password.length < 8) return 'Password must be at least 8 characters.'
      if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    }
    if (step === 2) {
      if (!form.orgName.trim()) return 'Organisation name is required.'
    }
    return null
  }

  function next() {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setStep((s) => s + 1)
  }

  function back() {
    setError(null)
    setStep((s) => s - 1)
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
          role: 'event_organizer',
          full_name: form.contactName,
          org_name: form.orgName,
          org_category: form.category.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          org_description: form.description,
          org_address: form.address,
          org_city: form.city,
          org_country: form.country,
          org_phone: form.phone,
          org_website: form.website,
          org_plan: form.plan,
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
            We sent a confirmation link to <strong className="text-app-fg">{form.email}</strong>. After confirming, your organiser profile will be created.
          </p>
          <Link href="/auth/signin" className="text-sm font-semibold text-app-fg hover:underline">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
      <div className="w-full max-w-lg">
        <div className="card-elevated animate-fade-in-up p-8 md:p-10">
          <Link href="/auth/role" className="inline-flex items-center gap-1.5 text-xs text-app-muted hover:text-app-fg mb-6">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to role selection
        </Link>

        <StepIndicator current={step} />

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
        )}

        {step === 1 && (
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Create your account</h1>
            <p className="text-sm text-app-muted mb-6">Your login credentials for UrbanExplore</p>
            <div className="space-y-4">
              <Field label="Your name"><input type="text" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Jane Smith" className={inputCls} /></Field>
              <Field label="Email address"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" className={inputCls} /></Field>
              <Field label="Password"><input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 characters" className={inputCls} /></Field>
              <Field label="Confirm password"><input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Repeat password" className={inputCls} /></Field>
            </div>
            <button onClick={next} className="btn-primary w-full !py-2.5">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">About your organisation</h1>
            <p className="text-sm text-app-muted mb-6">Tell attendees what you are promoting on UrbanExplore</p>
            <div className="space-y-4">
              <Field label="Organisation name"><input type="text" value={form.orgName} onChange={(e) => set('orgName', e.target.value)} placeholder="City Arts Collective" className={inputCls} /></Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Short description" optional>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="We bring world-class artists to local venues…" rows={3} className={`${inputCls} resize-none`} />
              </Field>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={back} className="btn-secondary flex-1 !py-2.5">Back</button>
              <button onClick={next} className="btn-primary flex-1 !py-2.5">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Location & contact</h1>
            <p className="text-sm text-app-muted mb-6">Help attendees find and contact you on UrbanExplore</p>
            <div className="space-y-4">
              <Field label="Street address" optional><input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St" className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City"><input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="New York" className={inputCls} /></Field>
                <Field label="Country"><input type="text" value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="USA" className={inputCls} /></Field>
              </div>
              <Field label="Phone" optional><input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls} /></Field>
              <Field label="Website" optional><input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourorganisation.com" className={inputCls} /></Field>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={back} className="btn-secondary flex-1 !py-2.5">Back</button>
              <button onClick={next} className="btn-primary flex-1 !py-2.5">Continue</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit}>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Choose your plan</h1>
            <p className="text-sm text-app-muted mb-6">You can upgrade at any time</p>
            <div className="space-y-3 mb-6">
              {PLANS.map((plan) => (
                <label key={plan.key} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${form.plan === plan.key ? 'border-navy bg-navy/5' : 'border-[var(--border)] hover:border-navy/40'}`}>
                  <input type="radio" name="plan" value={plan.key} checked={form.plan === plan.key} onChange={() => setForm((p) => ({ ...p, plan: plan.key }))} className="mt-1 accent-navy" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-app-fg">{plan.name}</span>
                      {plan.badge && <span className="text-[10px] bg-gold/20 text-gold font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">{plan.badge}</span>}
                    </div>
                    <div className="text-lg font-bold text-app-fg">{plan.price} <span className="text-xs font-normal text-app-muted">{plan.period}</span></div>
                    <ul className="mt-2 space-y-0.5">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-app-muted flex items-center gap-1.5">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gold flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={back} className="btn-secondary flex-1 !py-2.5">Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 !py-2.5">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-app-muted mt-6">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-app-fg hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoryPicker, type CategoryOption } from '@/components/auth/CategoryPicker'
import { SignupStepper } from '@/components/auth/SignupStepper'
import { StickyActionBar } from '@/components/patterns/StickyActionBar'
import { FileUploadTile } from '@/components/auth/FileUploadTile'
import {
  PayoutDetailsFields,
  payoutDetailsValue,
  type PayoutDetails,
} from '@/components/auth/PayoutDetailsFields'
import { ConsentCheckbox } from '@/components/auth/ConsentCheckbox'

const CATEGORIES: CategoryOption[] = [
  { label: 'Event Organizer', icon: '🎪' },
  { label: 'Nightclub / Club', icon: '🪩' },
  { label: 'Concert Organizer', icon: '🎤' },
  { label: 'Festival Organizer', icon: '🎡' },
  { label: 'Show Organizer', icon: '🎭' },
  { label: 'Conference Organizer', icon: '🎙️' },
  { label: 'Event Venue', icon: '🏟️' },
  { label: 'Theater / Performing Arts', icon: '🎬' },
  { label: 'Wedding Planner', icon: '💐' },
  { label: 'Sports & Fitness', icon: '🏆' },
  { label: 'Other', icon: '✨' },
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
    <label className="eyebrow mb-1.5 block">
      {label}{optional && <span className="ml-1 font-medium normal-case tracking-normal text-app-muted">(optional)</span>}
    </label>
    {children}
  </div>
)

export default function OrganizerSignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState<FormData>({
    contactName: '', email: '', password: '', confirmPassword: '',
    orgName: '', category: 'Event Organizer', description: '',
    address: '', city: '', country: '', phone: '', website: '',
    plan: 'free',
  })

  function set(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  // Client-side-only selections until a storage bucket exists.
  const [logoName, setLogoName] = useState<string | null>(null)
  const [payoutDocsName, setPayoutDocsName] = useState<string | null>(null)
  const [payout, setPayout] = useState<PayoutDetails>(() => payoutDetailsValue())
  const [consented, setConsented] = useState(false)

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
    const { error, data } = await supabase.auth.signUp({
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
          org_payout_bank: payout.bank,
          org_payout_account_holder: payout.accountHolder,
          org_payout_account_number: payout.accountNumber,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Confirmation off / autoconfirmed: a live session exists — run role
    // provisioning through the callback route, then continue.
    if (data.session) {
      router.push('/auth/callback?next=/dashboard/organizer')
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="card-elevated animate-fade-in-up p-10">
          <div className="w-14 h-14 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-ember">
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
        <div className="hero-warm animate-fade-in-up mb-4 rounded-xl border border-app-border py-5 text-center shadow-card">
          <span className="font-serif text-xl font-bold text-app-fg">
            UrbanExplore <span className="text-ember">Partners</span>
          </span>
        </div>
        <div className="card-elevated p-8 md:p-10">
          <Link href="/auth/role" className="inline-flex items-center gap-1.5 text-xs text-app-muted hover:text-app-fg mb-6">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to role selection
        </Link>

        <SignupStepper steps={['Account', 'Organisation', 'Contact & Payout', 'Plan']} current={step} />

        {error && (
          <div className="mb-5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3">{error}</div>
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
            <StickyActionBar className="mt-6" primary={{ label: 'Continue', onClick: next, tone: 'navy' }} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">About your organisation</h1>
            <p className="text-sm text-app-muted mb-6">This information will be displayed publicly to attendees</p>
            <div className="space-y-5">
              <Field label="Organisation name"><input type="text" value={form.orgName} onChange={(e) => set('orgName', e.target.value)} placeholder="e.g. Addis Nights Collective" className={inputCls} /></Field>
              <Field label="Category">
                <CategoryPicker options={CATEGORIES} value={form.category} onChange={(v) => set('category', v)} />
              </Field>
              <div className="max-w-[10rem]">
                <FileUploadTile label="Upload Logo Tile" variant="square" fileName={logoName} onSelect={(f) => setLogoName(f?.name ?? null)} />
                <p className="mt-1.5 text-center text-[11px] text-app-muted">Recommended 512×512px · PNG or JPG under 2MB</p>
              </div>
              <Field label="Short description" optional>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell attendees what makes your events special…" rows={3} className={`${inputCls} resize-none`} />
              </Field>
            </div>
            <StickyActionBar
              className="mt-6"
              secondary={{ label: 'Back', onClick: back }}
              primary={{ label: 'Continue to Contact & Payout', onClick: next, tone: 'navy' }}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Contact &amp; payout</h1>
            <p className="text-sm text-app-muted mb-6">Help attendees find and contact you on UrbanExplore</p>
            <div className="space-y-4">
              <Field label="Street address" optional><input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Bole Road, Kirkos" className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City"><input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Addis Ababa" className={inputCls} /></Field>
                <Field label="Country"><input type="text" value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Ethiopia" className={inputCls} /></Field>
              </div>
              <Field label="Phone" optional><input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+251 91 234 5678" className={inputCls} /></Field>
              <Field label="Website" optional><input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourorganisation.com" className={inputCls} /></Field>
            </div>

            <div className="mt-6">
              <PayoutDetailsFields
                value={payout}
                onChange={setPayout}
                docsFileName={payoutDocsName}
                onDocsSelect={(f) => setPayoutDocsName(f?.name ?? null)}
              />
            </div>

            <StickyActionBar
              className="mt-8"
              secondary={{ label: 'Back', onClick: back }}
              primary={{ label: 'Continue', onClick: next, tone: 'navy' }}
            />
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit}>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Choose your plan</h1>
            <p className="text-sm text-app-muted mb-6">You can upgrade at any time</p>
            <div className="space-y-3 mb-6">
              {PLANS.map((plan) => (
                <label key={plan.key} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${form.plan === plan.key ? 'border-ink bg-ink/5' : 'border-[var(--border)] hover:border-ink/40'}`}>
                  <input type="radio" name="plan" value={plan.key} checked={form.plan === plan.key} onChange={() => setForm((p) => ({ ...p, plan: plan.key }))} className="mt-1 accent-navy" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-app-fg">{plan.name}</span>
                      {plan.badge && <span className="text-[10px] bg-ember/12 text-ember font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">{plan.badge}</span>}
                    </div>
                    <div className="text-lg font-bold text-app-fg">{plan.price} <span className="text-xs font-normal text-app-muted">{plan.period}</span></div>
                    <ul className="mt-2 space-y-0.5">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-app-muted flex items-center gap-1.5">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-ember flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              ))}
            </div>
            <ConsentCheckbox checked={consented} onChange={setConsented} />
            <StickyActionBar
              className="mt-4"
              secondary={{ label: 'Back', onClick: back }}
              primary={{
                type: 'submit',
                tone: 'navy',
                disabled: loading || !consented,
                label: loading ? 'Creating account…' : 'Create organizer account',
              }}
            />
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoryPicker, type CategoryOption } from '@/components/auth/CategoryPicker'
import { SignupStepper } from '@/components/auth/SignupStepper'
import { StickyActionBar } from '@/components/patterns/StickyActionBar'
import { FileUploadTile, DocumentUploadRow } from '@/components/auth/FileUploadTile'

const CATEGORIES: CategoryOption[] = [
  { label: 'Restaurant', icon: '🍽️' },
  { label: 'Café / Coffee Shop', icon: '☕' },
  { label: 'Bakery', icon: '🥐' },
  { label: 'Bar', icon: '🍸' },
  { label: 'Lounge', icon: '🛋️' },
  { label: 'Pub', icon: '🍺' },
  { label: 'Food Truck', icon: '🚚' },
  { label: 'Ice Cream & Dessert Shop', icon: '🍦' },
  { label: 'Hotel Restaurant', icon: '🏨' },
  { label: 'Juice / Smoothie Bar', icon: '🥤' },
  { label: 'Cloud Kitchen', icon: '📦' },
  { label: 'Catering', icon: '🍱' },
  { label: 'Other', icon: '🏪' },
]

interface FormData {
  contactName: string
  email: string
  password: string
  confirmPassword: string
  businessName: string
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
    features: ['Basic listing', 'Up to 10 menu items', 'Standard support'],
  },
  {
    key: 'premium_monthly' as const,
    name: 'Premium',
    price: '$29',
    period: 'per month',
    badge: 'Popular',
    features: ['Unlimited menu items', 'Featured placement', 'Analytics dashboard', 'Priority support'],
  },
  {
    key: 'premium_yearly' as const,
    name: 'Premium Yearly',
    price: '$290',
    period: 'per year',
    badge: 'Save $58',
    features: ['Everything in Premium', 'Custom promotions', 'Dedicated account manager'],
  },
]

const Field = ({
  label,
  optional,
  children,
}: {
  label: string
  optional?: boolean
  children: React.ReactNode
}) => (
  <div>
    <label className="eyebrow mb-1.5 block">
      {label}
      {optional && <span className="ml-1 font-medium normal-case tracking-normal text-app-muted">(optional)</span>}
    </label>
    {children}
  </div>
)

const inputCls = 'input-premium'

export default function BusinessSignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState<FormData>({
    contactName: '', email: '', password: '', confirmPassword: '',
    businessName: '', category: 'Restaurant', description: '',
    address: '', city: '', country: '', phone: '', website: '',
    plan: 'free',
  })

  function set(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  // Visual-asset and license selections are held client-side only until a
  // storage bucket exists; they intentionally do not reach the signUp payload.
  const [logoName, setLogoName] = useState<string | null>(null)
  const [coverName, setCoverName] = useState<string | null>(null)
  const [licenseName, setLicenseName] = useState<string | null>(null)

  function validate(): string | null {
    if (step === 1) {
      if (!form.contactName.trim()) return 'Contact name is required.'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Valid email is required.'
      if (form.password.length < 8) return 'Password must be at least 8 characters.'
      if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    }
    if (step === 2) {
      if (!form.businessName.trim()) return 'Business name is required.'
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

  const router = useRouter()
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
          role: 'food_business',
          full_name: form.contactName,
          business_name: form.businessName,
          business_category: form.category.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          business_description: form.description,
          business_address: form.address,
          business_city: form.city,
          business_country: form.country,
          business_phone: form.phone,
          business_website: form.website,
          business_plan: form.plan,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }


    // Confirmation off / autoconfirmed: a live session exists � run role
    // provisioning through the callback route, then continue.
    if (data.session) {
      router.push('/auth/callback?next=/dashboard/restaurant')
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
            We sent a confirmation link to <strong className="text-app-fg">{form.email}</strong>. After confirming, your business listing will be created.
          </p>
          <Link href="/auth/signin" className="text-sm font-semibold text-app-fg hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
      <div className="w-full max-w-lg">
        <div className="hero-warm animate-fade-in-up mb-4 rounded-xl border border-app-border py-5 text-center shadow-card">
          <span className="font-serif text-xl font-bold text-app-fg">
            UrbanExplore <span className="text-gold-soft">Partners</span>
          </span>
        </div>
        <div className="card-elevated p-8 md:p-10">
          <Link href="/auth/role" className="inline-flex items-center gap-1.5 text-xs text-app-muted hover:text-app-fg mb-6">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to role selection
        </Link>

        <SignupStepper steps={['Account', 'Business', 'Contact', 'Listing']} current={step} />

        {error && (
          <div className="mb-5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3">
            {error}
          </div>
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
            <StickyActionBar
              className="mt-6"
              primary={{ label: 'Continue', onClick: next, tone: 'navy' }}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Business details</h1>
            <p className="text-sm text-app-muted mb-6">Define your brand&apos;s presence on our curated marketplace</p>
            <div className="space-y-5">
              <Field label="Business name">
                <input type="text" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="e.g. The Blue Nile Reserve" className={inputCls} />
              </Field>
              <Field label="Business category">
                <CategoryPicker options={CATEGORIES} value={form.category} onChange={(v) => set('category', v)} />
              </Field>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label className="eyebrow block">
                    Editorial description
                    <span className="ml-1 font-medium normal-case tracking-normal text-app-muted">(optional)</span>
                  </label>
                  <span aria-hidden className="text-[11px] font-semibold tabular-nums tracking-widest text-app-muted">
                    {form.description.length} / 500
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value.slice(0, 500))}
                  placeholder="Describe your atmosphere, culinary philosophy, and what makes your establishment a premier destination…"
                  rows={4}
                  maxLength={500}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="border-t border-[var(--border)] pt-5">
                <h3 className="mb-1 font-serif text-base font-semibold text-app-fg">Visual assets</h3>
                <p className="mb-3 text-xs text-app-muted">Strong photography gets listings featured.</p>
                <div className="grid grid-cols-2 gap-3">
                  <FileUploadTile label="Logo" variant="square" fileName={logoName} onSelect={(f) => setLogoName(f?.name ?? null)} />
                  <FileUploadTile label="Cover Photo (Wide)" variant="wide" fileName={coverName} onSelect={(f) => setCoverName(f?.name ?? null)} />
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-5">
                <h3 className="mb-1 font-serif text-base font-semibold text-app-fg">Legal &amp; verification</h3>
                <p className="mb-3 text-xs text-app-muted">For verification</p>
                <DocumentUploadRow
                  label="Upload Business License"
                  fileName={licenseName}
                  onSelect={(f) => setLicenseName(f?.name ?? null)}
                />
                <div className="mt-3 flex items-start gap-2.5 rounded-md border border-gold/25 bg-gold/10 px-3.5 py-3">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs leading-relaxed text-app-muted">
                    Listings go live after a quick verification review. Ensure your details match official documents.
                  </p>
                </div>
              </div>
            </div>
            <StickyActionBar
              className="mt-8"
              secondary={{ label: 'Back', onClick: back }}
              primary={{ label: 'Continue to Contact', onClick: next, tone: 'navy' }}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Location & contact</h1>
            <p className="text-sm text-app-muted mb-6">Help customers find and contact your venue on UrbanExplore</p>
            <div className="space-y-4">
              <Field label="Street address" optional><input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Bole Road, Kirkos" className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City"><input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Addis Ababa" className={inputCls} /></Field>
                <Field label="Country"><input type="text" value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Ethiopia" className={inputCls} /></Field>
              </div>
              <Field label="Phone" optional><input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+251 91 234 5678" className={inputCls} /></Field>
              <Field label="Website" optional><input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourrestaurant.com" className={inputCls} /></Field>
            </div>
            <StickyActionBar
              className="mt-6"
              secondary={{ label: 'Back', onClick: back }}
              primary={{ label: 'Continue to Listing', onClick: next, tone: 'navy' }}
            />
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit}>
            <h1 className="font-serif text-2xl font-bold text-app-fg mb-1">Choose your plan</h1>
            <p className="text-sm text-app-muted mb-6">You can upgrade at any time</p>
            <div className="space-y-3 mb-6">
              {PLANS.map((plan) => (
                <label
                  key={plan.key}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    form.plan === plan.key ? 'border-navy bg-navy/5' : 'border-[var(--border)] hover:border-navy/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.key}
                    checked={form.plan === plan.key}
                    onChange={() => setForm((p) => ({ ...p, plan: plan.key }))}
                    className="mt-1 accent-navy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-app-fg">{plan.name}</span>
                      {plan.badge && (
                        <span className="text-[10px] bg-gold/20 text-gold-soft font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">{plan.badge}</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-app-fg">
                      {plan.price} <span className="text-xs font-normal text-app-muted">{plan.period}</span>
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {plan.features.map((f) => (
                          <li key={f} className="text-xs text-app-muted flex items-center gap-1.5">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gold flex-shrink-0">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              ))}
            </div>
            <StickyActionBar
              className="mt-2"
              secondary={{ label: 'Back', onClick: back }}
              primary={{
                type: 'submit',
                tone: 'navy',
                disabled: loading,
                label: loading ? 'Creating account…' : 'Create account',
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

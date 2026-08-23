'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error: requestError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/signin` })
    setLoading(false)
    if (requestError) { setError(requestError.message); return }
    setMessage('Check your inbox for a password reset link.')
  }

  return (
    <div className="w-full max-w-md">
      <div className="card-elevated animate-fade-in-up p-7 sm:p-9">
        <Link href="/auth/signin" className="mb-7 inline-flex items-center gap-1.5 text-sm font-semibold text-app-muted hover:text-app-fg">
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>

        <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-ivory">
          <Mail className="size-5" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-bold text-app-fg">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          Enter your account email and we will send a secure reset link.
        </p>

        {message && (
          <p className="animate-pop-in mt-5 rounded-xl bg-gold/10 border border-gold/20 px-4 py-3 text-sm text-app-fg">
            {message}
          </p>
        )}
        {error && (
          <p className="animate-pop-in mt-5 rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <form className="mt-6" onSubmit={handleSubmit}>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-app-fg">Email address</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="input-premium" placeholder="you@example.com" />
          <button disabled={loading} className="btn-primary mt-4 w-full !py-3">
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  )
}

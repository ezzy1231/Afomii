'use client'

import { useState, useTransition } from 'react'
import { createEventListing, type DashboardActionState } from '@/app/dashboard/actions'

export default function EventListingForm() {
  const [state, setState] = useState<DashboardActionState>({ ok: false, message: '' })
  const [pending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createEventListing(state, formData)
      setState(result)
    })
  }

  return (
    <section className="card-elevated p-6 sm:p-8">
      <h2 className="font-serif text-xl font-bold text-app-fg">Create event</h2>
      <p className="mt-2 text-sm text-app-muted">Publish upcoming events to the discover feed.</p>

      <form action={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-app-fg sm:col-span-2">
          <span className="mb-1.5 block">Event title</span>
          <input name="title" required className="input-premium" placeholder="Night Market Sessions" />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Category</span>
          <input name="category" className="input-premium" placeholder="Food and music" />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Venue</span>
          <input name="venueName" required className="input-premium" placeholder="Harbour Hall" />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Start date and time</span>
          <input name="startsAt" type="datetime-local" className="input-premium" />
        </label>
        <label className="block text-sm font-medium text-app-fg">
          <span className="mb-1.5 block">Price label</span>
          <input name="priceLabel" className="input-premium" placeholder="From $12" />
        </label>

        <button type="submit" disabled={pending} className="btn-primary sm:col-span-2 mt-2 !py-3">
          {pending ? 'Creating event...' : 'Create event'}
        </button>
      </form>

      {state.message && (
        <p className={`animate-pop-in mt-5 rounded-xl px-4 py-3 text-sm ${state.ok ? 'bg-gold/10 text-app-fg border border-gold/20' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {state.message}
        </p>
      )}
    </section>
  )
}

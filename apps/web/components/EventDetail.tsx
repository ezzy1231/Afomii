'use client'

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  MapPin,
  Navigation,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { purchaseTickets, type TicketActionState } from '@/app/events/actions'
import { TierRow, StickyActionBar, type Tier } from '@/components/patterns'
import { DateBadge } from '@/components/patterns/DateBadge'

type TicketType = {
  id: string
  name: string
  tier: string
  price: number
  totalQuantity: number
  remainingQuantity: number
  salesStart: string | null
  salesEnd: string | null
}

type Event = {
  id: string
  title: string
  description: string | null
  category: string
  venueName: string
  latitude: number | null
  longitude: number | null
  startDateTime: string
  endDateTime: string
  coverImageUrl: string | null
  status: string
  ticketTypes: TicketType[]
  organizer: { id: string; email: string }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function timeRange(event: Event) {
  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${fmt(event.startDateTime)} - ${fmt(event.endDateTime)}`
}

function dateBadge(dateStr: string) {
  const d = new Date(dateStr)
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  }
}

function isOnSale(t: TicketType) {
  const now = Date.now()
  if (t.salesStart && new Date(t.salesStart).getTime() > now) return false
  if (t.salesEnd && new Date(t.salesEnd).getTime() < now) return false
  return true
}

export default function EventDetail({ event }: { event: Event }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<TicketActionState | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  const badge = dateBadge(event.startDateTime)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
  }, [])

  function handleQuantity(id: string, qty: number) {
    setQuantities((current) => ({ ...current, [id]: qty }))
  }

  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0)
  const total = event.ticketTypes.reduce(
    (sum, t) => sum + (quantities[t.id] ?? 0) * t.price,
    0
  )

  async function handleBook() {
    const selected = event.ticketTypes.filter((t) => (quantities[t.id] ?? 0) > 0)
    if (!selected.length) return
    setResult(null)
    setSubmitting(true)
    let last: TicketActionState = { ok: false, message: 'Nothing selected.' }
    let purchased = 0
    for (const t of selected) {
      const qty = quantities[t.id] ?? 0
      last = await purchaseTickets({ ticketTypeId: t.id, quantity: qty })
      if (last.ok) purchased += qty
      else break
    }
    setSubmitting(false)
    if (purchased > 0) {
      setResult({ ...last, message: `Purchased ${purchased} ticket${purchased > 1 ? 's' : ''} successfully.` })
    } else {
      setResult(last)
    }
  }

  if (result?.ok) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 glass-subtle rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
        >
          <ArrowLeft className="size-4 text-ember" strokeWidth={2.5} />
          Back to events
        </Link>

        <div className="mx-auto max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-app-border bg-ink p-8 text-center shadow-elevate animate-pop-in">
            <div className="absolute inset-x-0 top-0 h-2 bg-ember" aria-hidden />
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-app-border bg-ember text-white">
              <Check className="size-7" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-white">You&apos;re going!</h1>
            <p className="mt-2 text-sm font-medium text-white/70">{result.message}</p>

            {/* Perforated tear line */}
            <div className="relative my-6">
              <div className="border-t-2 border-dashed border-white/30" aria-hidden />
              <span className="absolute -left-4 top-1/2 size-6 -translate-y-1/2 rounded-full border border-app-border bg-app-bg" aria-hidden />
              <span className="absolute -right-4 top-1/2 size-6 -translate-y-1/2 rounded-full border border-app-border bg-app-bg" aria-hidden />
            </div>

            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ember">
              Ticket code — show at the door
            </div>
            <div className="mt-2 rounded-xl border border-white/25 bg-white/10 p-4 font-mono text-xl font-bold tracking-wider text-white">
              {result.code}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-white/50">
              Screenshot this screen or find it anytime under your tickets.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/settings"
                className="rounded-xl bg-gradient-to-br from-ember to-ember-deep px-5 py-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                View my tickets
              </Link>
              <Link
                href="/events"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                Browse more events
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tiers: Tier[] = event.ticketTypes.map((t) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    remaining: t.remainingQuantity,
    premium: t.tier === 'vip' || t.tier === 'vvip',
    salesOpen: isOnSale(t),
  }))

  const organizerName = event.organizer.email.split('@')[0]

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/events"
        className="mb-5 inline-flex items-center gap-2 glass-subtle rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
      >
        <ArrowLeft className="size-4 text-ember" strokeWidth={2.5} />
        Back to events
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* Left column */}
        <div>
          <div className="relative h-72 overflow-hidden rounded-3xl shadow-glass-strong sm:h-[420px]">
            {event.coverImageUrl ? (
              <Image
                src={event.coverImageUrl}
                alt={event.title}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(140deg,rgb(var(--amber-rgb)/0.5),rgb(var(--ember-deep-rgb)/0.95))]">
                <span className="text-6xl font-bold text-white">
                  {event.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(15,13,11,0.92))]" aria-hidden />
            <span className="absolute bottom-5 left-5">
              <DateBadge month={badge.month} day={badge.day} size="lg" />
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                {event.title}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white/80">
                Hosted by {organizerName}
                <BadgeCheck className="size-4 text-ember" strokeWidth={2.5} />
              </p>
            </span>
          </div>

          {/* Info card */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 glass rounded-2xl p-4">
            <span className="flex items-center gap-3 text-sm">
              <Clock3 className="size-5 shrink-0 text-ember" strokeWidth={2.5} />
              <span>
                <span className="block font-bold text-app-fg">{timeRange(event)}</span>
                <span className="block text-xs font-medium text-app-muted">{formatDate(event.startDateTime)}</span>
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-3 text-sm">
              <MapPin className="size-5 shrink-0 text-ember" strokeWidth={2.5} />
              <span className="min-w-0">
                <span className="block truncate font-bold text-app-fg">{event.venueName}</span>
                <span className="block text-xs font-medium text-app-muted">Addis Ababa</span>
              </span>
            </span>
            <Link
              href={`/ride?to=${encodeURIComponent(event.venueName)}${event.latitude && event.longitude ? `&lat=${event.latitude}&lng=${event.longitude}` : ''}`}
              className="glass-subtle shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
            >
              View Map
            </Link>
          </div>

          {/* About */}
          {event.description && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-app-fg">About the Event</h2>
              <p className="mt-3 leading-7 text-app-muted">{event.description}</p>
            </div>
          )}

          {/* Organizer */}
          <div className="mt-8 flex items-center justify-between gap-4 glass rounded-2xl p-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-app-border bg-ember text-lg font-bold text-white">
                {organizerName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-semibold text-app-fg">
                  <span className="truncate">{organizerName}</span>
                  <BadgeCheck className="size-4 shrink-0 text-ember" strokeWidth={2.5} />
                </span>
                <span className="block truncate text-xs font-medium text-app-muted">
                  Creating unforgettable experiences in Addis Ababa.
                </span>
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-app-fg">Location</h2>
            <Link
              href={`/ride?to=${encodeURIComponent(event.venueName)}${event.latitude && event.longitude ? `&lat=${event.latitude}&lng=${event.longitude}` : ''}`}
              className="dot-grid glass mt-3 flex h-44 items-center justify-center rounded-2xl text-app-muted transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass"
            >
              <span className="glass flex flex-col items-center gap-2 rounded-xl px-5 py-4 text-sm font-semibold text-app-fg">
                <MapPin className="size-6 text-ember" strokeWidth={2.5} />
                {event.venueName} — plan your ride
              </span>
            </Link>
          </div>
        </div>

        {/* Right column — Select Tickets */}
        <div>
          <div id="select-tickets" className="scroll-mt-24 lg:sticky lg:top-20">
            <div className="overflow-hidden glass rounded-2xl">
              <div className="border-b border-app-border bg-ink px-5 py-4">
                <h2 className="text-xl font-bold text-white">Select Tickets</h2>
              </div>
              <div className="px-5 py-2">
                {tiers.map((tier) => (
                  <TierRow
                    key={tier.id}
                    tier={tier}
                    quantity={quantities[tier.id] ?? 0}
                    onQuantityChange={handleQuantity}
                  />
                ))}
              </div>
              <div className="border-t border-app-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-app-fg">Total</span>
                  <span className="text-2xl font-bold tabular-nums text-app-fg">
                    ETB {total.toLocaleString()}
                  </span>
                </div>

                {signedIn === false && (
                  <p className="mt-3 rounded-lg border border-ember/25 bg-ember/10 p-2.5 text-xs font-semibold text-app-fg">
                    <Link href="/auth/signin?next=/events" className="underline">
                      Sign in
                    </Link>{' '}
                    to buy tickets.
                  </p>
                )}

                {result && !result.ok && (
                  <p className="mt-3 text-xs font-semibold text-danger">{result.message}</p>
                )}

                <button
                  type="button"
                  onClick={handleBook}
                  disabled={totalQty === 0 || submitting || signedIn === false}
                  className="mt-4 w-full rounded-xl bg-gradient-to-br from-ember to-ember-deep py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(var(--ember-rgb)/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgb(var(--ember-rgb)/0.45)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                >
                  {submitting
                    ? 'Processing…'
                    : totalQty > 0
                    ? `Book ${totalQty} Ticket${totalQty > 1 ? 's' : ''}`
                    : 'Book Tickets'}
                </button>
              </div>
            </div>

            {/* Ride actions */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href={`/ride?to=${encodeURIComponent(event.venueName)}${event.latitude && event.longitude ? `&lat=${event.latitude}&lng=${event.longitude}` : ''}`}
                className="glass glass-hover flex flex-col items-center gap-1 rounded-2xl px-4 py-4 text-center"
              >
                <Navigation className="size-5 text-ember" strokeWidth={2.5} />
                <span className="text-xs font-semibold uppercase tracking-widest text-app-fg">Go</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">Navigate</span>
              </Link>
              <Link
                href={`/ride?to=${encodeURIComponent(event.venueName)}${event.latitude && event.longitude ? `&lat=${event.latitude}&lng=${event.longitude}` : ''}`}
                className="glass glass-hover flex flex-col items-center gap-1 rounded-2xl px-4 py-4 text-center"
              >
                <CarFront className="size-5 text-ember" strokeWidth={2.5} />
                <span className="text-xs font-semibold uppercase tracking-widest text-app-fg">Book Ride</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">Get a ride</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile thumb-zone CTA: book + ride (hidden on desktop where the
          sticky ticket panel already carries both actions) */}
      <StickyActionBar
        className="sm:hidden"
        primary={{
          label: 'Book Tickets',
          onClick: () =>
            document.getElementById('select-tickets')?.scrollIntoView({ behavior: 'smooth' }),
        }}
        secondary={{ label: 'Get a Ride', href: `/ride?to=${encodeURIComponent(event.venueName)}${event.latitude && event.longitude ? `&lat=${event.latitude}&lng=${event.longitude}` : ''}` }}
      />
    </div>
  )
}

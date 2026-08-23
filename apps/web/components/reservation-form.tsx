'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createReservation, type ReservationActionState } from '@/app/restaurants/actions'
import type { DetailBranch, RestaurantDetail } from '@/lib/supabase/queries'
import Link from 'next/link'

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
function pad(n: number) {
  return String(n).padStart(2, '0')
}
function fromMinutes(m: number) {
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}
function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function buildSlots(
  ranges: { open: string; close: string }[] | undefined,
  slotMin: number
) {
  const list: string[] = []
  const source = ranges && ranges.length ? ranges : [{ open: '12:00', close: '22:00' }]
  for (const r of source) {
    let cur = toMinutes(r.open)
    const end = toMinutes(r.close)
    while (cur < end) {
      list.push(fromMinutes(cur))
      cur += slotMin
    }
  }
  return Array.from(new Set(list)).sort()
}

export function ReservationForm({
  restaurant,
  branch,
}: {
  restaurant: RestaurantDetail
  branch: DetailBranch
}) {
  const config = branch.bookingConfig
  const slotMin = config?.slotDurationMinutes ?? 30
  const totalTables = config?.totalTables ?? 0
  const maxGuests = config?.maxGuestPerTable ?? 8

  const [date, setDate] = useState(todayString())
  const [partySize, setPartySize] = useState(2)
  const [timeSlot, setTimeSlot] = useState<string | null>(null)
  const [booked, setBooked] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ReservationActionState | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  const weekday = WEEKDAYS[new Date(date + 'T00:00:00').getDay()]
  const ranges = restaurant.openingHours?.[weekday]
  const slots = useMemo(() => buildSlots(ranges, slotMin), [ranges, slotMin])

  useEffect(() => {
    let active = true
    createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setTimeSlot(null)
    let active = true
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('reservations')
        .select('time_slot')
        .eq('branch_id', branch.id)
        .eq('reservation_date', date)
        .in('status', ['pending', 'confirmed'])
      if (!active) return
      const counts: Record<string, number> = {}
      for (const r of (data ?? []) as { time_slot: string | null }[]) {
        if (r.time_slot) counts[r.time_slot] = (counts[r.time_slot] ?? 0) + 1
      }
      setBooked(counts)
    }
    load()
    return () => {
      active = false
    }
  }, [branch.id, date])

  if (!config || totalTables === 0) {
    return (
      <div className="rounded-xl border border-app-border bg-app-card p-4 text-sm text-app-muted">
        This branch is not accepting reservations yet.
      </div>
    )
  }

  const nowMinutes = (() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })()
  const isToday = date === todayString()

  const remaining = (slot: string) => totalTables - (booked[slot] ?? 0)
  const isPast = (slot: string) => isToday && toMinutes(slot) <= nowMinutes
  const isFull = (slot: string) => remaining(slot) <= 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    if (!timeSlot) {
      setResult({ ok: false, message: 'Please select a time slot.' })
      return
    }
    if (isPast(timeSlot) || isFull(timeSlot)) {
      setResult({ ok: false, message: 'That time slot is no longer available.' })
      return
    }
    setSubmitting(true)
    const res = await createReservation({
      branchId: branch.id,
      reservationDate: date,
      timeSlot,
      guestCount: partySize,
    })
    setSubmitting(false)
    setResult(res)
  }

  if (result?.ok) {
    return (
      <div className="rounded-xl border border-app-border bg-app-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-success">
          <Check className="size-4" />
          Reservation {result.status === 'confirmed' ? 'confirmed' : 'requested'}
        </div>
        <p className="mt-1.5 text-sm text-app-muted">{result.message}</p>
        <p className="mt-2 text-xs font-medium text-gold-soft">
          {branch.branchName} · {date} · {timeSlot} · {partySize} guests
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-4 rounded-md border border-app-border px-4 py-2 text-xs font-semibold text-app-muted transition-colors hover:text-app-fg"
        >
          Make another reservation
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-sm)]">
      <h3 className="font-serif text-xl font-bold text-app-fg">Reserve a Table</h3>

      {signedIn === false && (
        <div className="mt-3 rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-gold-soft">
          <Link href="/auth/signin?next=/restaurants" className="font-semibold underline">
            Sign in
          </Link>{' '}
          to make a reservation.
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-app-fg">Date</label>
          <input
            type="date"
            min={todayString()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2.5 text-sm text-app-fg outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-app-fg">Time</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const full = isFull(slot)
              const past = isPast(slot)
              const disabled = full || past
              const selected = timeSlot === slot
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTimeSlot(slot)}
                  className={cn(
                    'rounded-md border px-2 py-2 text-xs font-medium transition-all active:scale-[0.97]',
                    selected
                      ? 'border-navy bg-navy font-semibold text-ivory dark:border-gold dark:bg-gold dark:text-navy'
                      : disabled
                      ? 'cursor-not-allowed border-app-border bg-app-input text-app-muted/50 line-through'
                      : 'border-app-border bg-app-bg text-app-fg hover:border-gold/60'
                  )}
                >
                  {slot}
                </button>
              )
            })}
          </div>
          {timeSlot && (
            <p className="mt-1.5 text-xs text-app-muted">
              {remaining(timeSlot)} table{remaining(timeSlot) === 1 ? '' : 's'} left at {timeSlot}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-app-fg">Guests</label>
          <div className="flex items-center justify-between rounded-md border border-app-border bg-app-bg px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-app-fg">
              <span className="flex size-6 items-center justify-center rounded-full bg-gold/15 text-xs text-gold-soft">
                👤
              </span>
              {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Fewer guests"
                onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                className="flex size-7 items-center justify-center rounded text-app-muted transition-colors hover:text-app-fg"
              >
                <Minus className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="More guests"
                onClick={() => setPartySize((n) => Math.min(Math.max(1, maxGuests), n + 1))}
                className="flex size-7 items-center justify-center rounded text-app-muted transition-colors hover:text-app-fg"
              >
                <Plus className="size-3.5" />
              </button>
            </span>
          </div>
        </div>

        {result && !result.ok && (
          <p className="text-xs text-danger">{result.message}</p>
        )}

        <button
          type="submit"
          disabled={submitting || signedIn === false}
          className="w-full rounded-md bg-gold py-3 text-sm font-bold text-navy transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
        >
          {submitting ? 'Reserving…' : 'Confirm Reservation'}
        </button>

        <div className="space-y-1.5">
          {['Instant Confirmation', 'No Prepayment Required'].map((note) => (
            <p key={note} className="flex items-center gap-1.5 text-xs text-app-muted">
              <Check className="size-3.5 text-success" />
              {note}
            </p>
          ))}
        </div>
      </div>
    </form>
  )
}

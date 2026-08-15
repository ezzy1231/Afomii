'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
      <div className="rounded-[22px] border border-[#d7b778]/20 bg-[#0d1d2f] p-4 text-sm text-[#d5cbbd]">
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
      <div className="rounded-[22px] border border-[#d7b778]/30 bg-[#0d1d2f] p-4">
        <div className="text-sm font-semibold text-[#f7f0e7]">Reservation {result.status === 'confirmed' ? 'confirmed' : 'requested'}</div>
        <p className="mt-1 text-sm text-[#d5cbbd]">{result.message}</p>
        <p className="mt-2 text-xs text-[#d7b778]">
          {branch.branchName} · {date} · {timeSlot} · {partySize} guests
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setResult(null)}>
          Make another reservation
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[22px] border border-[#d7b778]/20 bg-[#0d1d2f] p-4">
      <div className="mb-3 text-sm font-semibold text-[#f7f0e7]">Reserve a table</div>

      {signedIn === false && (
        <div className="mb-3 rounded-lg border border-[#d7b778]/25 bg-[#d7b778]/10 p-3 text-xs text-[#f1d79a]">
          <Link href="/auth/signin?next=/restaurants" className="underline font-semibold">
            Sign in
          </Link>{' '}
          to make a reservation.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-[#d3cabf]">Date</label>
          <input
            type="date"
            min={todayString()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-[#d7b778]/20 bg-[#0c1d30] px-3 py-2 text-sm text-[#f7f0e7] outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#d3cabf]">Party size</label>
          <select
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full rounded-lg border border-[#d7b778]/20 bg-[#0c1d30] px-3 py-2 text-sm text-[#f7f0e7] outline-none"
          >
            {Array.from({ length: Math.max(1, maxGuests) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#d3cabf]">Time slot</label>
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
                    'rounded-lg border px-2 py-1.5 text-xs transition',
                    selected
                      ? 'border-[#d7b778] bg-[#d7b778] text-[#06182d] font-semibold'
                      : disabled
                      ? 'border-[#d7b778]/10 bg-[#101f32] text-[#5b6573] cursor-not-allowed'
                      : 'border-[#d7b778]/25 bg-[#0c1d30] text-[#f2ece2] hover:border-[#d7b778]/50'
                  )}
                >
                  {slot}
                  {!disabled && (
                    <span className="block text-[10px] text-[#d3cabf]">{remaining(slot)} left</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {result && !result.ok && (
          <p className="text-xs text-red-300">{result.message}</p>
        )}

        <Button type="submit" disabled={submitting || signedIn === false} className="w-full">
          {submitting ? 'Reserving…' : 'Reserve'}
        </Button>
      </div>
    </form>
  )
}

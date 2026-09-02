'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReservationQuickActions } from '@/components/dashboard/reservation-quick-actions'
import { cn } from '@/lib/utils'

type InboxReservation = {
  id: string
  reservationDate: string
  timeSlot: string | null
  guestCount: number
  status: string
  guestName: string
}

type Range = 'day' | 'week' | 'month'
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed'

const CONSOLE_CARD = 'glass rounded-2xl'

function statusPill(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-success/20 text-success'
    case 'rejected':
    case 'cancelled':
      return 'bg-danger/15 text-danger'
    case 'completed':
      return 'bg-ember/20 text-ember'
    default:
      return 'bg-app-elevated/80 text-app-muted'
  }
}

function isoDay(offsetDays: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export default function ReservationsPage() {
  const [rows, setRows] = useState<InboxReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('day')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (!business) {
        setLoading(false)
        return
      }

      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('business_id', business.id)
      const branchIds = (branches ?? []).map((b) => b.id)
      if (!branchIds.length) {
        setLoading(false)
        return
      }

      // Next 31 days covers Day / Week / Month views.
      const { data } = await supabase
        .from('reservations')
        .select('id, reservation_date, time_slot, guest_count, status, user_id')
        .in('branch_id', branchIds)
        .gte('reservation_date', isoDay(0))
        .lte('reservation_date', isoDay(30))
        .order('reservation_date', { ascending: true })
        .order('time_slot', { ascending: true })
        .limit(200)

      const userIds = Array.from(
        new Set((data ?? []).map((r) => r.user_id).filter((v): v is string => Boolean(v))),
      )
      type CustomerContact = { id: string; email?: string | null }
      const contactsResult = userIds.length
        ? await supabase.rpc('partner_customer_contacts', { p_user_ids: userIds })
        : { data: [] as CustomerContact[] | null }
      const contacts = new Map(
        ((contactsResult.data ?? []) as CustomerContact[]).map((c) => [c.id, c.email ?? null]),
      )

      setRows(
        (data ?? []).map((r) => ({
          id: r.id,
          reservationDate: r.reservation_date,
          timeSlot: r.time_slot,
          guestCount: r.guest_count,
          status: r.status,
          guestName: (() => {
            const email = contacts.get(r.user_id ?? '') ?? ''
            const cleaned = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
            return cleaned
              ? cleaned
                  .split(' ')
                  .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                  .join(' ')
              : 'Guest'
          })(),
        })),
      )
      setLoading(false)
    }
    load()
  }, [])

  const today = isoDay(0)
  const weekEnd = isoDay(7)

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (range === 'day' && r.reservationDate !== today) return false
      if (range === 'week' && r.reservationDate > weekEnd) return false
      if (
        statusFilter !== 'all' &&
        r.status !== statusFilter &&
        !(statusFilter === 'completed' && (r.status === 'cancelled' || r.status === 'completed'))
      ) {
        return false
      }
      return true
    })
  }, [rows, range, statusFilter, today, weekEnd])

  const grouped = useMemo(() => {
    const map = new Map<string, InboxReservation[]>()
    for (const row of filtered) {
      const key = `${row.reservationDate}${row.timeSlot ? ` · ${row.timeSlot}` : ''}`
      map.set(key, [...(map.get(key) ?? []), row])
    }
    return Array.from(map.entries())
  }, [filtered])

  const counts = useMemo(() => {
    const scoped = rows.filter((r) =>
      range === 'day' ? r.reservationDate === today : range === 'week' ? r.reservationDate <= weekEnd : true,
    )
    return {
      all: scoped.length,
      pending: scoped.filter((r) => r.status === 'pending').length,
      confirmed: scoped.filter((r) => r.status === 'confirmed').length,
      completed: scoped.filter((r) => r.status === 'completed' || r.status === 'cancelled').length,
    }
  }, [rows, range, today, weekEnd])

  return (
    <div className="min-h-full px-4 pb-16 pt-8 text-app-fg sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
              Partner console
            </p>
            <h1 className="mt-1  text-3xl font-bold">Reservations</h1>
          </div>

          {/* Range segmented control */}
          <div className="glass flex rounded-xl p-1">
            {(['day', 'week', 'month'] as Range[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  'min-h-9 rounded-md px-4 text-sm font-semibold capitalize transition-colors',
                  range === option ? 'bg-ember text-white' : 'text-app-muted hover:text-app-fg',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </header>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'confirmed', 'completed'] as StatusFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatusFilter(option)}
              className={cn(
                'min-h-9 rounded-full border px-4 text-sm font-semibold capitalize transition-colors',
                statusFilter === option
                  ? 'border-ember/40 bg-ember/15 text-ember'
                  : 'border-app-border bg-app-card/70 text-app-muted hover:border-app-border',
              )}
            >
              {option} ({counts[option]})
            </button>
          ))}
        </div>

        {/* Slot-grouped timeline */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-app-card/70" />
            ))}
          </div>
        ) : grouped.length > 0 ? (
          <div className="space-y-6">
            {grouped.map(([slotKey, slotRows]) => (
              <section key={slotKey} className="space-y-2">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
                  {slotKey}
                  <span className="size-1 rounded-full bg-app-muted/60" aria-hidden />
                  {slotRows.length} {slotRows.length === 1 ? 'table' : 'tables'}
                </h2>
                {slotRows.map((row) => {
                  const terminal =
                    row.status === 'cancelled' || row.status === 'rejected' || row.status === 'completed'
                  return (
                    <div
                      key={row.id}
                      className={cn(CONSOLE_CARD, 'flex items-center justify-between gap-3 p-4', terminal && 'opacity-70')}
                    >
                      <div className="min-w-0">
                        <p className={cn('truncate font-semibold', terminal && 'line-through')}>{row.guestName}</p>
                        <p className="mt-0.5 text-xs tabular-nums text-app-muted">
                          {row.reservationDate}
                          {row.timeSlot ? ` · ${row.timeSlot}` : ''} · Party of {row.guestCount}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                            statusPill(row.status),
                          )}
                        >
                          {row.status}
                        </span>
                        <ReservationQuickActions reservationId={row.id} status={row.status} />
                      </div>
                    </div>
                  )
                })}
              </section>
            ))}
          </div>
        ) : (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-10 text-center')}>
            <p className="font-semibold">Nothing here for this view</p>
            <p className="mt-1 text-sm text-app-muted">
              Try a wider date range or a different status filter.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

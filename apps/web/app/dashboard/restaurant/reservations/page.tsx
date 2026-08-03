'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReservationCalendarGrid } from '@/components/dashboard/reservation-calendar'

type Reservation = {
  id: string
  reservationDate: string
  timeSlot: string | null
  guestCount: number
  status: string
  user: { email?: string; phone?: string }
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!business) { setLoading(false); return }

      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('business_id', business.id)

      if (!branches?.length) { setLoading(false); return }

      const branchIds = branches.map(b => b.id)
      const { data } = await supabase
        .from('reservations')
        .select('id, reservation_date, time_slot, guest_count, status, user_id')
        .in('branch_id', branchIds)
        .order('reservation_date', { ascending: false })
        .limit(50)

      if (data) {
        const mapped: Reservation[] = await Promise.all(
          data.map(async (r) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, phone')
              .eq('id', r.user_id)
              .maybeSingle()

            return {
              id: r.id,
              reservationDate: r.reservation_date,
              timeSlot: r.time_slot,
              guestCount: r.guest_count,
              status: r.status,
              user: { email: profile?.email, phone: profile?.phone },
            }
          })
        )
        setReservations(mapped)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleUpdateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('reservations').update({ status }).eq('id', id)
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Restaurant</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Reservations</h1>
      <p className="mt-2 text-sm text-app-muted">
        View and manage incoming table bookings.
      </p>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--bg-input)]" />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <ReservationCalendarGrid
            reservations={reservations}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      )}
    </div>
  )
}

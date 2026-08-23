import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConsumerReservations, getConsumerTickets } from '@/lib/supabase/queries'
import { formatDate } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { StatusBadge } from '@/components/ui/badge'
import SignOutButton from './SignOutButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin?next=/settings')

  const meta = user.user_metadata
  const role = (meta?.role as string) ?? 'user'
  const fullName = (meta?.full_name as string) ?? ''
  const phone = (meta?.phone as string) ?? ''
  const city = (meta?.city as string) ?? ''

  const reservations = await getConsumerReservations(user.id)
  const tickets = await getConsumerTickets(user.id)

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <h1 className="font-serif text-4xl font-bold text-app-fg mb-10">Account Settings</h1>

        <section className="card-elevated p-6 sm:p-8 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Profile</h2>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-14 h-14 rounded-full bg-navy text-ivory flex items-center justify-center text-xl font-bold font-serif shadow-soft">
              {fullName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="font-semibold text-app-fg">{fullName || '—'}</p>
              <p className="text-sm text-app-muted">{user.email}</p>
              <span
                className={`inline-flex mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  role === 'food_business'
                    ? 'bg-gold/20 text-app-fg'
                    : role === 'event_organizer'
                    ? 'bg-gold/20 text-app-fg'
                    : 'bg-gold/20 text-app-fg'
                }`}
              >
                {role === 'food_business'
                  ? 'Food Business'
                  : role === 'event_organizer'
                  ? 'Event Organizer'
                  : 'Explorer'}
              </span>
            </div>
          </div>

          <dl className="space-y-4 text-sm">
            <Row label="Full name" value={fullName || '—'} />
            <Row label="Email" value={user.email ?? '—'} />
            <Row label="Phone" value={phone || '—'} />
            <Row label="City" value={city || '—'} />
          </dl>
        </section>

        <section className="card-elevated p-6 sm:p-8 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Account</h2>
          <div className="space-y-3 text-sm">
            <p className="text-app-muted">
              Member since{' '}
              <span className="text-app-fg font-medium">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>
        </section>

        <section className="card-elevated p-6 sm:p-8 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Your Reservations</h2>
          {reservations.length ? (
            <div className="space-y-3">
              {reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3">
                  <div>
                    <p className="font-medium text-app-fg">{r.restaurantName || 'Restaurant'}</p>
                    <p className="text-sm text-app-muted">
                      {[r.branchName, r.address].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-0.5 text-xs text-app-muted">
                      {formatDate(r.reservationDate)}
                      {r.timeSlot ? ` · ${r.timeSlot}` : ''} · {r.guestCount} guests
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-app-muted">You have no reservations yet.</p>
          )}
        </section>

        <section className="card-elevated p-6 sm:p-8 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Your Tickets</h2>
          {tickets.length ? (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3">
                  <div>
                    <p className="font-medium text-app-fg">{t.eventTitle || 'Event'}</p>
                    <p className="text-sm text-app-muted">{t.ticketName} · {t.quantity} ticket{t.quantity > 1 ? 's' : ''}</p>
                    <p className="mt-0.5 text-xs text-app-muted">
                      {t.amount === 0 ? 'Free' : `ETB ${t.amount}`} ·{' '}
                      <span className="font-mono">{t.qrCode}</span>
                      {t.attended && <span className="ml-2 text-emerald-600">Attended</span>}
                    </p>
                  </div>
                  <StatusBadge status={t.paymentStatus} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-app-muted">You have no tickets yet.</p>
          )}
        </section>

        <section className="card-elevated p-6 sm:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Session</h2>
          <SignOutButton />
        </section>
      </main>
      <Footer />
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <dt className="text-app-muted">{label}</dt>
      <dd className="text-app-fg text-right font-medium">{value}</dd>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
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
              <span className="inline-flex mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold-soft">
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
            <div className="rounded-xl border border-dashed border-gold/40 bg-app-input p-6 text-center">
              <p className="font-semibold text-app-fg">No reservations yet</p>
              <p className="mt-1 text-sm text-app-muted">
                Find a table and your bookings will live here.
              </p>
              <Link href="/restaurants" className="btn-accent mt-4 inline-block !py-2.5 text-sm">
                Explore restaurants
              </Link>
            </div>
          )}
        </section>

        <section className="card-elevated p-6 sm:p-8 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Your Tickets</h2>
          {tickets.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {tickets.map((t) => (
                <article
                  key={t.id}
                  className="relative overflow-hidden rounded-2xl bg-navy text-ivory shadow-[var(--shadow-md)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gold" aria-hidden />
                  <div className="flex items-start justify-between gap-3 p-5 pb-3">
                    <div className="min-w-0">
                      <p className="truncate font-serif text-lg font-bold">{t.eventTitle || 'Event'}</p>
                      <p className="mt-0.5 text-xs text-ivory/60">
                        {t.ticketName} · {t.quantity} ticket{t.quantity > 1 ? 's' : ''} ·{' '}
                        {t.amount === 0 ? 'Free' : `ETB ${t.amount}`}
                      </p>
                    </div>
                    <StatusBadge status={t.paymentStatus} />
                  </div>

                  {/* Perforated tear line */}
                  <div className="relative my-1">
                    <div className="border-t border-dashed border-ivory/25" aria-hidden />
                    <span
                      className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-app-border bg-app-bg"
                      aria-hidden
                    />
                    <span
                      className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-app-border bg-app-bg"
                      aria-hidden
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-5 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                        Ticket code
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold tracking-wider">{t.qrCode}</p>
                    </div>
                    {t.attended && (
                      <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Attended
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gold/40 bg-app-input p-6 text-center">
              <p className="font-semibold text-app-fg">No tickets yet</p>
              <p className="mt-1 text-sm text-app-muted">
                Browse events and your stubs will live here.
              </p>
              <Link href="/events" className="btn-accent mt-4 inline-block !py-2.5 text-sm">
                Explore events
              </Link>
            </div>
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

import Link from 'next/link'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'

export default function AdminNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl py-12">
      <section className={`${CONSOLE_CARD} p-8`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-app-muted">Admin console</p>
        <h2 className="mt-2 text-xl font-bold text-app-fg">Record not found</h2>
        <p className="mt-2 text-sm text-app-muted">This record may have been removed or the link may be incorrect.</p>
        <nav aria-label="Admin lists" className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-ember">
          <Link href="/dashboard/admin/businesses" className="underline-offset-4 hover:underline">Businesses</Link>
          <Link href="/dashboard/admin/organizers" className="underline-offset-4 hover:underline">Organizers</Link>
          <Link href="/dashboard/admin/events" className="underline-offset-4 hover:underline">Events</Link>
          <Link href="/dashboard/admin/reservations" className="underline-offset-4 hover:underline">Reservations</Link>
        </nav>
      </section>
    </div>
  )
}

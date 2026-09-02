'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function RoleClient() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const roles = [
    {
      key: 'user',
      tint: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
      label: 'User',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
      headline: 'Discover, book, and go',
      description: 'Find places to eat, events to attend, and the best ride to get there.',
      features: [
        'Browse restaurants and events in one feed',
        'Save favourites and keep track of bookings',
        'Compare ride options when you are ready to go',
        'Use a single account across dining and entertainment',
      ],
      cta: 'Continue as User',
      href: `/auth/signup/user?next=${encodeURIComponent(next)}`,
    },
    {
      key: 'business',
      tint: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
      label: 'Food & Dining Business',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
      headline: 'Grow your venue',
      description: 'List your restaurant, cafe, or food venue and reach nearby customers.',
      features: [
        'Create a rich venue profile',
        'Manage menus, photos, and offers',
        'Handle bookings and reservations',
        'Unlock analytics and premium plans',
      ],
      cta: 'List My Venue',
      href: `/auth/signup/business?next=${encodeURIComponent(next)}`,
    },
    {
      key: 'organizer',
      tint: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
      label: 'Events & Entertainment',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
      headline: 'Promote your events',
      description: 'Sell tickets, grow your audience, and manage your live events effortlessly.',
      features: [
        'Create and publish events quickly',
        'Sell tickets with QR code support',
        'Track sales, attendance, and live status',
        'Reach a local audience that is ready to buy',
      ],
      cta: 'List My Events',
      href: `/auth/signup/organizer?next=${encodeURIComponent(next)}`,
    },
  ]

  return (
    <div className="w-full max-w-5xl">
      <div className="text-center mb-12">
        <p className="eyebrow mb-3">Get started</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-app-fg mb-3">
          How will you use UrbanExplore?
        </h1>
        <p className="text-app-muted text-base md:text-lg">
          One account for dining out, going out, and getting there.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role, i) => (
          <div
            key={role.key}
            className="card-elevated animate-fade-in-up p-6 sm:p-8 flex flex-col !rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:border-gold/50"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div
              className={`mb-4 flex size-14 items-center justify-center rounded-full ${role.tint}`}
            >
              {role.icon}
            </div>
            <h2 className="font-serif text-lg font-bold text-app-fg mb-2">
              {role.label}
            </h2>
            <p className="text-sm text-app-muted mb-5">{role.description}</p>

            <ul className="space-y-2.5 mb-8 flex-1">
              {role.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-app-muted">
                  <svg className="w-4 h-4 text-ember mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <Link href={role.href} className="btn-primary text-center !py-2.5 text-sm">
              {role.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-app-muted mt-10">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-app-fg font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
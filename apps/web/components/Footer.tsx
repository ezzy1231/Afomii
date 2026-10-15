"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandWordmark } from './BrandMark'

const LINKS = {
  Explore: [
    { label: 'Restaurants', href: '/restaurants' },
    { label: 'Events', href: '/events' },
    { label: 'Ride estimate', href: '/ride' },
    { label: 'My Plans', href: '/plans' },
  ],
  Partners: [
    { label: 'List a restaurant', href: '/auth/signup/business' },
    { label: 'Host events', href: '/auth/signup/organizer' },
    { label: 'Partner sign in', href: '/auth/signin' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Product vision', href: '/vision' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
}

export default function Footer() {
  const pathname = usePathname()
  const hideOnMobile = pathname !== '/'

  return (
    <footer className={`footer-warm relative text-[rgb(237_234_225)] ${hideOnMobile ? 'hidden md:block' : 'block'}`}>
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-14 sm:px-6 md:pb-12 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex rounded-lg" aria-label="UrbanExplore home">
              <BrandWordmark inverted />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[rgb(237_234_225/0.72)]">
              Find a table or a ticket in Addis Ababa, book it, then estimate the
              meter-taxi fare to get there.
            </p>
          </div>
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(237_234_225/0.55)]">{group}</p>
              <ul className="mt-3 space-y-0.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-[rgb(237_234_225/0.86)] underline-offset-4 transition-colors hover:text-[rgb(255_252_245)] hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-[rgb(237_234_225/0.14)] pt-6 text-xs text-[rgb(237_234_225/0.6)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 UrbanExplore. Addis Ababa, Ethiopia.</p>
          <p>Prices in Ethiopian birr (ETB). Ride fares are estimates.</p>
        </div>
      </div>
    </footer>
  )
}

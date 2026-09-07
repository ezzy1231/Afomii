"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'

const LINKS = {
  Platform: [
    { label: 'Discover', href: '/restaurants' },
    { label: 'Book', href: '/events' },
    { label: 'Go', href: '/ride' },
    { label: 'For Businesses', href: '/auth/signup/business' },
    { label: 'For Organisers', href: '/auth/signup/organizer' },
  ],
  Company: [
    { label: 'Product vision', href: '/vision' },
    { label: 'About', href: '/about' },
  ],
  Legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
}

export default function Footer() {
  const pathname = usePathname()
  const hideOnMobile = pathname !== '/'

  return (
    <footer className={`footer-warm gold-stripe-t relative border-t border-app-border text-white ${hideOnMobile ? 'hidden md:block' : 'block'}`}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-ember-deep text-sm font-bold text-white">
                U
              </span>
              <p className="text-2xl font-bold tracking-tight text-white">UrbanExplore</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
              Elevating your dining and event experiences with seamless, premium
              transportation.
            </p>
            <p className="mt-6 text-xs text-white/40">© 2026 UrbanExplore. All rights reserved.</p>
          </div>

          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">{group}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1 text-sm font-medium text-white/70 transition-all hover:text-ember"
                    >
                      {l.label}
                      <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Made for Addis Ababa
          </p>
          <div className="flex gap-3">
            {['App Store', 'Google Play'].map((store) => (
              <span
                key={store}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/75"
              >
                {store}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

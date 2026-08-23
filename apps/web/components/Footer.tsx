"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

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
    <footer className={`bg-navy text-ivory/70 ${hideOnMobile ? 'hidden md:block' : 'block'}`}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-2xl font-bold text-ivory">UrbanExplore</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              Elevating your dining and event experiences with seamless, premium
              transportation.
            </p>
            <p className="mt-6 text-xs">© 2026 UrbanExplore. All rights reserved.</p>
          </div>

          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-sm font-semibold text-ivory">{group}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm transition-colors hover:text-gold"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
          <Globe className="size-4 text-ivory/50" aria-hidden />
          <div className="flex gap-3">
            {['App Store', 'Google Play'].map((store) => (
              <span
                key={store}
                className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-ivory/80"
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

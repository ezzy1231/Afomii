import Link from 'next/link'
import MobileNavigation from './MobileNavigation'
import NavLinks from './NavLinks'
import HeaderAccount from './HeaderAccount'
import { BrandWordmark } from './BrandMark'

/**
 * Site header.
 *
 * Deliberately NOT an async server component, and deliberately free of
 * `cookies()`. It used to await the Supabase session and the unread
 * notification count, which opted every page that renders it out of static
 * rendering and forced `cache-control: no-store` at the CDN. The account corner
 * now hydrates client-side via HeaderAccount; the real authorisation check
 * stays in middleware.ts.
 */
export default function Navbar() {
  return (
    <>
      <header className="chrome-navy sticky top-0 z-50 border-b border-app-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="rounded-lg transition-transform active:scale-[0.98]" aria-label="UrbanExplore home">
            <BrandWordmark inverted />
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <NavLinks />
          </div>

          <HeaderAccount />
        </div>
      </header>
      <MobileNavigation />
    </>
  )
}

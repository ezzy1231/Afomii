import Link from 'next/link'
import Image from 'next/image'
import { BrandWordmark } from '@/components/BrandMark'
import ThemeToggle from '@/components/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-app-bg">
      {/* Editorial panel — atmosphere only, never presented as a listing. */}
      <aside className="relative hidden w-[42%] max-w-[620px] shrink-0 overflow-hidden bg-[rgb(14_24_41)] lg:block">
        <Image src="/places/food-4.jpg" alt="" fill sizes="42vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(14_24_41/0.35),rgb(14_24_41/0.92))]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-[rgb(250_248_243)]">
          <Link href="/" className="inline-flex w-fit rounded-lg" aria-label="UrbanExplore home">
            <BrandWordmark inverted />
          </Link>
          <div>
            <p className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] xl:text-5xl">
              Plan the evening.
              <br />
              Book the table.
              <br />
              Know the fare.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[rgb(250_248_243/0.78)]">
              One account for reservations, tickets and saved plans. Partner
              accounts manage listings, bookings and check-ins.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-app-border px-4 py-3 sm:px-8">
          <Link href="/" className="inline-flex rounded-lg lg:invisible" aria-label="UrbanExplore home">
            <BrandWordmark />
          </Link>
          <ThemeToggle />
        </header>

        <main id="main" className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-14">
          <div className="animate-fade-in-up w-full max-w-xl">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-6 text-xs text-app-muted">
          <span>&copy; 2026 UrbanExplore</span>
          <Link href="/privacy" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-app-fg hover:underline">Privacy</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-app-fg hover:underline">Terms</Link>
        </footer>
      </div>
    </div>
  )
}

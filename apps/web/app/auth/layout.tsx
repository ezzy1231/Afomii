import Link from 'next/link'
import Image from 'next/image'
import { BrandWordmark } from '@/components/BrandMark'
import ThemeToggle from '@/components/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-app-bg">
      {/* Editorial panel — atmosphere only, never presented as a listing. */}
      {/*
        The editorial panel only earns its 40% of the viewport from `xl` up.
        Below that it was stealing width from pages that need it — /auth/role
        lays out three role cards and was being squeezed into ~176px columns,
        wrapping its copy every two words.
      */}
      <aside className="relative hidden w-[34%] max-w-[480px] shrink-0 overflow-hidden bg-[rgb(11_31_58)] xl:block">
        <Image src="/places/food-4.jpg" alt="" fill sizes="42vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_31_58/0.35),rgb(11_31_58/0.92))]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-[rgb(251_245_240)]">
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
            <p className="mt-5 max-w-sm text-sm leading-6 text-[rgb(251_245_240/0.78)]">
              One account for reservations, tickets and saved plans. Partner
              accounts manage listings, bookings and check-ins.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-app-border px-4 py-3 sm:px-8">
          <Link href="/" className="inline-flex rounded-lg xl:invisible" aria-label="UrbanExplore home">
            <BrandWordmark />
          </Link>
          <ThemeToggle />
        </header>

        <main id="main" className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-14">
          {/*
            Pages own their own width: the sign-in and sign-up forms declare
            `max-w-md`, while /auth/role declares `max-w-5xl` for its three
            cards. A blanket `max-w-xl` here clamped the role grid to 576px and
            broke it. `items-center` keeps the narrow forms centred without each
            page needing `mx-auto`.
          */}
          <div className="animate-fade-in-up flex w-full max-w-5xl flex-col items-center">{children}</div>
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

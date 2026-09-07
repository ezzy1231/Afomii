import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <header className="border-b-[1.5px] border-app-border bg-[var(--nav-bg)] px-6 py-5 nav-blur">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-[10px] border border-app-border bg-ember text-sm font-extrabold text-[#080C17] shadow-soft transition-transform group-hover:rotate-6">
            U
          </span>
          <span className="text-2xl font-bold tracking-tight text-app-fg">UrbanExplore</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="text-center text-xs font-medium text-app-muted py-6">
        Â© 2026 UrbanExplore. &nbsp;
        <Link href="/privacy" className="underline hover:text-app-fg">Privacy</Link>
              &nbsp;·&nbsp;
              <Link href="/terms" className="underline hover:text-app-fg">Terms</Link>
      </footer>
    </div>
  )
}

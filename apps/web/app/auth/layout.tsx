import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <header className="border-b border-app-border bg-app-card/85 px-6 py-5 nav-blur">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-navy">UrbanExplore</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="text-center text-xs text-app-muted py-6">
        © 2026 UrbanExplore. &nbsp;
        <Link href="/privacy" className="underline hover:text-app-fg">Privacy</Link>
              &nbsp;·&nbsp;
              <Link href="/terms" className="underline hover:text-app-fg">Terms</Link>
      </footer>
    </div>
  )
}

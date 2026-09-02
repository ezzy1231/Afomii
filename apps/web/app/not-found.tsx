import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-12">
      <section className="card-elevated animate-fade-in-up w-full p-8 sm:p-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ember">404</p>
        <h1 className="font-serif text-3xl font-bold text-app-fg">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted">
          This page does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-primary mt-6 inline-flex"
        >
          Back to home
        </Link>
      </section>
    </main>
  )
}

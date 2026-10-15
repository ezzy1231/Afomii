export default function GlobalLoading() {
  return (
    <main id="main" aria-busy="true" className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <p className="sr-only" role="status">Loading</p>
      <div className="skeleton mb-4 h-4 w-32" />
      <div className="skeleton mb-10 h-12 w-full max-w-md" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-app-border bg-app-card">
            <div className="skeleton aspect-[4/3] !rounded-none" />
            <div className="space-y-2.5 p-5">
              <div className="skeleton h-3 w-1/4" />
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

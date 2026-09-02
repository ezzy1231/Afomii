export default function GlobalLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-6 w-40 animate-pulse rounded bg-app-elevated" />
      <div className="mb-8 h-10 w-72 animate-pulse rounded bg-app-elevated" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-elevated p-5">
            <div className="mb-4 h-32 animate-pulse rounded-xl bg-app-input" />
            <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-app-elevated" />
            <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-app-elevated" />
            <div className="h-11 animate-pulse rounded-lg bg-app-elevated" />
          </div>
        ))}
      </div>
    </main>
  )
}

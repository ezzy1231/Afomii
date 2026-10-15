import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center px-4 py-16">
      <section className="animate-fade-in-up w-full">
        <p className="font-display text-[7rem] font-extrabold leading-none tracking-[-0.06em] text-ember/20 sm:text-[10rem]" aria-hidden>404</p>
        <h1 className="mt-2 text-3xl font-bold text-app-fg sm:text-4xl">This address isn’t on the map.</h1>
        <p className="mt-3 max-w-md text-base leading-7 text-app-muted">
          The page may have moved, or the link was mistyped. Start again from discovery.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary"><Compass className="size-4" aria-hidden />Back to home</Link>
          <Link href="/restaurants" className="btn-secondary">Restaurants</Link>
          <Link href="/events" className="btn-secondary">Events</Link>
        </div>
      </section>
    </main>
  )
}

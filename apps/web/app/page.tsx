import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Discover',
    description: 'Search thousands of restaurants, events, and ride options near you — filtered by your taste.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Book',
    description: 'Reserve a table, grab event tickets, or compare fares from Uber, Bolt, and more — in seconds.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Enjoy',
    description: 'Show up, scan your ticket, and enjoy. Track everything in one place — no juggling apps.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
  },
]

const PILLARS = [
  {
    key: 'restaurants',
    href: '/restaurants',
    label: 'Restaurants',
    headline: 'Eat well, every time',
    description: 'From cosy neighbourhood cafés to upscale dining — discover restaurants curated for your palate.',
    cta: 'Browse restaurants',
  },
  {
    key: 'events',
    href: '/events',
    label: 'Events',
    headline: 'Never miss a moment',
    description: 'Music, art, sport, food — get tickets to the best events happening in your city.',
    cta: 'Explore events',
  },
  {
    key: 'ride',
    href: '/ride',
    label: 'Ride',
    headline: 'Get there in style',
    description: 'Compare fares from Uber, Bolt, Careem and more. One search, the best price.',
    cta: 'Compare rides',
  },
]

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-navy text-ivory">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-44 relative">
            <div className="max-w-2xl animate-fade-in-up">
              <p className="badge-gold inline-flex mb-5 !bg-gold/20 !text-gold">
                The UrbanExplore Super-App
              </p>
              <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6">
                Eat. Celebrate.{' '}
                <span className="text-gold">Ride.</span>
              </h1>
              <p className="text-ivory/70 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                Discover restaurants, book events, and get a ride — all in one simple place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/role"
                  className="btn-accent !text-navy !font-bold !px-7 !py-3.5"
                >
                    Get started
                </Link>
                <Link
                  href="/restaurants"
                  className="btn-secondary !border-ivory/30 !text-ivory hover:!bg-ivory/10 !px-7 !py-3.5"
                >
                  Browse restaurants
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-[var(--bg-alt)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">How it works</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-app-fg">
                Simple. Fast. One account.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((item, i) => (
                <div key={item.step} className="card-elevated animate-fade-in-up text-center p-8 sm:p-10" style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mx-auto mb-6">
                    {item.icon}
                  </div>
                  <div className="badge-gold inline-flex mb-3">{item.step}</div>
                  <h3 className="font-serif text-xl font-bold text-app-fg mb-3">{item.title}</h3>
                  <p className="text-sm text-app-muted leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-[var(--bg-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">What we offer</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-app-fg">
                One app. Three superpowers.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PILLARS.map((p, i) => (
                <div
                  key={p.key}
                  className="card-elevated animate-fade-in-up group flex flex-col p-8 sm:p-10"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="badge-gold mb-4 inline-flex w-fit">{p.label}</span>
                  <h3 className="font-serif text-2xl font-bold text-app-fg mb-3">{p.headline}</h3>
                  <p className="text-sm text-app-muted leading-relaxed flex-1 mb-8">
                    {p.description}
                  </p>
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-app-fg transition-all group-hover:gap-3"
                  >
                    {p.cta}
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-28 bg-navy text-ivory">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="badge-gold inline-flex mb-5 !bg-gold/20 !text-gold">For businesses</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-5">
              Grow your business with UrbanExplore
            </h2>
            <p className="text-ivory/70 text-lg mb-10 max-w-xl mx-auto">
              Join restaurants and event organisers reaching new customers through discovery, bookings, and ride handoff.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/signup/business"
                className="btn-accent !px-7 !py-3.5"
              >
                List your restaurant
              </Link>
              <Link
                href="/auth/signup/organizer"
                className="btn-secondary !border-ivory/30 !text-ivory hover:!bg-ivory/10 !px-7 !py-3.5"
              >
                Promote your events
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

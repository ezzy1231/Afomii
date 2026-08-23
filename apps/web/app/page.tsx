import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Bookmark, CarFront, Heart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HomeSearch from '@/components/HomeSearch'
import { SectionHeader, ListingCard } from '@/components/patterns'
import {
  getRestaurantCatalogue,
  getEventCatalogue,
  type CatalogueItem,
} from '@/lib/catalogue'

function eventParts(item: CatalogueItem) {
  const match = item.detail.match(/,\s*(\w{3})\s+(\d{1,2})/)
  return {
    month: match ? match[1].toUpperCase() : 'SOON',
    day: match ? match[2] : '·',
  }
}

export default async function HomePage() {
  const [restaurants, events] = await Promise.all([
    getRestaurantCatalogue(),
    getEventCatalogue(),
  ])

  const trending = restaurants.items.slice(0, 3)
  const featured = events.items[0]
  const upcoming = events.items.slice(1, 3)
  const featuredParts = featured ? eventParts(featured) : null

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-app-bg text-app-fg">
        {/* Hero */}
        <section className="relative">
          <div className="absolute inset-0">
            <Image
              src="/places/food-3.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,31,58,0.72),rgba(11,31,58,0.82))]" />
          </div>

          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
            <h1 className="font-serif text-4xl font-bold text-white sm:text-6xl">
              Discover. Book. Go.
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/85 sm:text-lg">
              Your all-in-one platform for premium dining, exclusive events, and
              luxury rides.
            </p>

            <div className="mt-8 w-full max-w-2xl">
              <HomeSearch />
            </div>
          </div>
        </section>

        {/* Trending Restaurants */}
        <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Trending Restaurants"
            eyebrow="Most booked this week"
            href="/restaurants"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((item) => (
              <Link
                key={item.id}
                href={`/restaurants/${item.id}`}
                className="group overflow-hidden rounded-xl border border-app-border bg-app-card shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative h-44">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 400px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(194,168,120,0.35),rgba(11,31,58,0.9))]">
                      <span className="font-serif text-4xl font-bold text-gold-soft">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-app-card/90 text-app-fg shadow-sm">
                    <Bookmark className="size-4" />
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-serif text-xl font-bold text-app-fg">
                      {item.name}
                    </h3>
                    <span className="shrink-0 rounded-md bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold-soft">
                      ★ {item.rating}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-app-muted">{item.category}</p>
                  <p className="mt-0.5 truncate text-xs text-app-muted">{item.detail} · {item.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Events */}
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Featured Events"
            eyebrow="Concerts, shows and festivals near you"
            href="/events"
          />

          <div className="grid gap-5 lg:grid-cols-2">
            {featured && (
              <Link
                href={`/events/${featured.id}`}
                className="group relative block min-h-[340px] overflow-hidden rounded-xl"
              >
                {featured.imageUrl ? (
                  <Image
                    src={featured.imageUrl}
                    alt={featured.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(194,168,120,0.4),rgba(11,31,58,0.95))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(11,31,58,0.92))]" />

                <span className="absolute left-4 top-4 rounded-lg bg-app-card px-3 py-1.5 text-center leading-none shadow-md">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-danger">
                    {featuredParts?.month}
                  </span>
                  <span className="mt-0.5 block text-lg font-bold text-app-fg">
                    {featuredParts?.day}
                  </span>
                </span>
                <span className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-app-card/90 text-app-fg shadow-sm">
                  <Heart className="size-4" />
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-serif text-3xl font-bold text-white">{featured.name}</h3>
                  <p className="mt-1 text-sm text-white/75">{featured.location}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/60">From</p>
                      <p className="font-serif text-2xl font-bold text-white">{featured.rating}</p>
                    </div>
                    <span className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-transform group-hover:scale-[1.02]">
                      Book Now
                    </span>
                  </div>
                </div>
              </Link>
            )}

            <div className="flex flex-col gap-4">
              {upcoming.map((item) => {
                const parts = eventParts(item)
                return (
                  <Link
                    key={item.id}
                    href={`/events/${item.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-app-border bg-app-card p-3 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
                  >
                    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-app-input leading-none">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-danger">
                        {parts.month}
                      </span>
                      <span className="mt-0.5 text-base font-bold text-app-fg">{parts.day}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-lg font-bold text-app-fg transition-colors group-hover:text-gold-soft">
                        {item.name}
                      </span>
                      <span className="block truncate text-xs text-app-muted">{item.location}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-app-fg">
                        From {item.rating}
                      </span>
                    </span>
                    <Heart className="size-4 shrink-0 text-app-muted" />
                  </Link>
                )
              })}

              {/* Promo card */}
              <div className="relative flex-1 overflow-hidden rounded-xl bg-navy p-6">
                <h3 className="font-serif text-2xl font-bold text-white">
                  Book Events. Enjoy Rides.
                </h3>
                <p className="mt-1.5 max-w-[240px] text-sm text-ivory/70">
                  Get to your event on time with UrbanExplore.
                </p>
                <Link
                  href="/ride"
                  className="mt-4 inline-block rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-transform active:scale-[0.98]"
                >
                  Book a Ride
                </Link>
                <CarFront
                  className="absolute -bottom-4 -right-3 size-28 text-white/10"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </section>

        {/* Business CTA */}
        <section className="mx-auto mt-14 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-navy p-6 sm:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                  For businesses
                </div>
                <h2 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
                  Grow your reach with UrbanExplore
                </h2>
                <p className="mt-2 max-w-lg text-sm text-ivory/70">
                  List your restaurant or events, manage reservations and tickets, and
                  track real analytics — all from one partner dashboard.
                </p>
              </div>
              <Link
                href="/auth/role"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-navy transition-transform active:scale-[0.98]"
              >
                List your business
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

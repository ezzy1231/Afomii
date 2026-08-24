import Link from 'next/link'
import { ArrowRight, BadgeCheck, CarFront, Clock3 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HomeSearch from '@/components/HomeSearch'
import CategoryRow from '@/components/CategoryRow'
import { SectionHeader } from '@/components/patterns'
import { ListingCard, ListingCardLarge } from '@/components/patterns/ListingCard'
import {
  getRestaurantCatalogue,
  getEventCatalogue,
} from '@/lib/catalogue'

export default async function HomePage() {
  const [restaurants, events] = await Promise.all([
    getRestaurantCatalogue(),
    getEventCatalogue(),
  ])

  const trending = restaurants.items.slice(0, 6)
  const [featured, ...upcoming] = events.items

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-app-bg text-app-fg">
        {/* Hero — warm editorial, photo-light */}
        <section className="hero-warm">
          <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-14 pt-16 text-center sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
            <p className="eyebrow">Addis Ababa · Eat · Go out · Get there</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-[1.04] tracking-tight text-app-fg sm:text-6xl">
              Find a place you’ll love.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-app-muted sm:text-lg">
              Restaurants worth booking, nights worth leaving the house for — and
              a ride to get you there.
            </p>

            <div className="mt-8 w-full max-w-xl text-left">
              <HomeSearch />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-app-muted">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-success" />
                Verified partners only
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-gold" />
                Real-time table availability
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CarFront className="size-3.5 text-gold" />
                Fares in ETB, upfront
              </span>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <CategoryRow />
        </section>

        {/* Trending restaurants — snap carousel mobile → grid desktop */}
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Trending Restaurants"
            eyebrow="Most booked this week"
            href="/restaurants"
          />
          {trending.length > 0 ? (
            <div className="snap-row">
              {trending.map((item) => (
                <ListingCardLarge
                  key={item.id}
                  item={item}
                  type="restaurants"
                  href={`/restaurants/${item.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-app-border bg-app-card p-6 text-sm text-app-muted">
              No restaurants listed yet — partners are onboarding now.
            </p>
          )}
        </section>

        {/* Events — featured poster + dated rows */}
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="This Week’s Events"
            eyebrow="Concerts, shows and festivals near you"
            href="/events"
          />

          <div className="grid gap-5 lg:grid-cols-2">
            {featured ? (
              <ListingCardLarge
                item={featured}
                type="events"
                href={`/events/${featured.id}`}
                className="min-h-[340px]"
              />
            ) : (
              <div className="rounded-xl border border-dashed border-app-border bg-app-card p-6 text-sm text-app-muted">
                No published events yet.
              </div>
            )}

            <div className="flex flex-col gap-4">
              {upcoming.slice(0, 2).map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  type="events"
                  href={`/events/${item.id}`}
                />
              ))}

              {/* Cross-sell: the loop that makes this platform unique */}
              <div className="relative flex-1 overflow-hidden rounded-2xl bg-navy p-6">
                <h3 className="font-serif text-2xl font-bold text-white">
                  Book it. Then ride.
                </h3>
                <p className="mt-1.5 max-w-[260px] text-sm text-ivory/70">
                  Compare meter-taxi fares across providers and get to your
                  reservation on time.
                </p>
                <Link
                  href="/ride"
                  className="mt-4 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-transform active:scale-[0.98]"
                >
                  Estimate a fare
                </Link>
                <CarFront
                  className="absolute -bottom-4 -right-3 size-28 text-white/10"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </section>

        {/* Partner CTA */}
        <section className="mx-auto mt-14 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-navy p-6 sm:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="eyebrow !text-gold">For businesses</div>
                <h2 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
                  Grow your reach with UrbanExplore
                </h2>
                <p className="mt-2 max-w-lg text-sm text-ivory/70">
                  List your restaurant or events, manage reservations and tickets,
                  and track real analytics — all from one partner dashboard.
                </p>
              </div>
              <Link
                href="/auth/role"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy transition-transform active:scale-[0.98]"
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

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarCheck, CarFront, MapPin, QrCode, Store, Ticket, UtensilsCrossed } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HomeSearch from '@/components/HomeSearch'
import CategoryRow from '@/components/CategoryRow'
import { SectionHeader } from '@/components/patterns'
import { ListingCardLarge } from '@/components/patterns/ListingCard'
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion'
import { getRestaurantCatalogue, getEventCatalogue, getTrendingRestaurantIds, type CatalogueItem } from '@/lib/catalogue'

/** One listing gets an editorial spread; more get a grid. */
function FeaturedSpread({ item, type }: { item: CatalogueItem; type: 'restaurants' | 'events' }) {
  const href = `/${type}/${item.id}`
  const numeric = /^\d+(\.\d+)?$/.test(item.rating.trim())
  return (
    <Link href={href} className="glass glass-hover group grid overflow-hidden rounded-2xl md:grid-cols-[1.3fr_1fr]">
      <div className="relative aspect-[16/10] bg-app-elevated md:aspect-auto md:min-h-[340px]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]" />
        ) : (
          <div aria-hidden className="dot-grid absolute inset-0 flex items-center justify-center">
            <span className="font-display text-8xl font-bold text-app-muted/40">{item.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-text">{item.category}</p>
        <h3 className="mt-2 text-3xl font-bold leading-tight text-app-fg sm:text-4xl">{item.name}</h3>
        <dl className="mt-5 space-y-2 text-sm text-app-muted">
          <div className="flex items-center gap-2"><dt className="sr-only">Location</dt><MapPin className="size-4 shrink-0" aria-hidden /><dd>{item.location}</dd></div>
          <div className="flex items-center gap-2"><dt className="sr-only">{type === 'events' ? 'When' : 'Hours'}</dt><CalendarCheck className="size-4 shrink-0" aria-hidden /><dd>{item.detail}</dd></div>
          <div className="flex items-center gap-2"><dt className="sr-only">{type === 'events' ? 'Price' : 'Rating'}</dt><Ticket className="size-4 shrink-0" aria-hidden /><dd>{type === 'restaurants' && numeric ? `Rated ${item.rating}` : item.rating}</dd></div>
        </dl>
        {item.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-app-muted">{item.description}</p>}
        <span className="mt-auto pt-6">
          <span className="btn-primary w-full sm:w-fit">
            {type === 'events' ? 'See tickets' : 'Reserve a table'}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </div>
    </Link>
  )
}

function ListingGrid({ items, type }: { items: CatalogueItem[]; type: 'restaurants' | 'events' }) {
  if (items.length === 1) return <Reveal><FeaturedSpread item={items[0]} type={type} /></Reveal>
  return (
    <StaggerGroup className={items.length === 2 ? 'grid gap-5 sm:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
      {items.map((item) => (
        <StaggerItem key={item.id} className="h-full">
          <ListingCardLarge item={item} type={type} href={`/${type}/${item.id}`} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}

function SectionEmpty({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-app-border bg-app-alt p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div>
        <p className="font-semibold text-app-fg">{title}</p>
        <p className="mt-1 max-w-lg text-sm leading-6 text-app-muted">{body}</p>
      </div>
      <Link href={href} className="btn-secondary shrink-0">{cta}</Link>
    </div>
  )
}

export default async function HomePage() {
  const [restaurants, events, trendingIds] = await Promise.all([
    getRestaurantCatalogue(),
    getEventCatalogue(),
    getTrendingRestaurantIds(),
  ])

  // Rated listings first; "New" (unrated) never outranks a real score.
  const topRated = [...restaurants.items]
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, 6)

  const now = Date.now()
  const inSevenDays = now + 7 * 24 * 60 * 60 * 1000
  const upcomingEvents = events.items.filter((item) => {
    if (!item.startsAt) return true
    const at = new Date(item.startsAt).getTime()
    return Number.isNaN(at) || at >= now
  })
  const allThisWeek = upcomingEvents.length > 0 && upcomingEvents.every((item) => {
    const at = item.startsAt ? new Date(item.startsAt).getTime() : NaN
    return !Number.isNaN(at) && at <= inSevenDays
  })
  const eventRows = upcomingEvents.slice(0, 5)

  // Hero showcase — the trending restaurant paired with the next event, so the
  // column carries real inventory instead of decoration. Capped at two: one
  // feature card plus one companion tile is a composition, three would be a
  // list.
  //
  // `trendingIds` comes from the reservation-volume aggregate. When that RPC is
  // unavailable (migration not applied) the list is empty and we rank by the
  // public rating instead — and the badge says so. The label never claims
  // "trending" for a ranking that is only a rating.
  const trendingRanked = trendingIds
    .map((id) => restaurants.items.find((item) => item.id === id))
    .filter((item): item is CatalogueItem => Boolean(item))
  const featuredRestaurant = trendingRanked[0] ?? topRated[0]
  const featuredBadge = trendingRanked.length > 0 ? 'Trending' : 'Top rated'

  const showcase: Array<{
    href: string
    name: string
    badge: string
    location: string
    detail: string
    imageUrl?: string | null
  }> = []
  if (featuredRestaurant) {
    showcase.push({
      href: `/restaurants/${featuredRestaurant.id}`,
      name: featuredRestaurant.name,
      badge: featuredBadge,
      location: featuredRestaurant.location,
      detail: featuredRestaurant.detail,
      imageUrl: featuredRestaurant.imageUrl,
    })
  }
  const nextEvent = upcomingEvents[0]
  if (nextEvent) {
    showcase.push({
      href: `/events/${nextEvent.id}`,
      name: nextEvent.name,
      // For an event `detail` is the "when" line, which is the useful hook.
      badge: 'Event',
      location: nextEvent.location,
      detail: nextEvent.detail,
      imageUrl: nextEvent.imageUrl,
    })
  }
  const [feature, companion] = showcase

  return (
    <>
      <Navbar />

      <main id="main" className="flex-1 bg-app-bg pb-24 text-app-fg md:pb-0">
        {/* HERO */}
        <section className="relative border-b border-app-border">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:px-8 lg:pb-20 lg:pt-16">
            <div className="min-w-0">
              <Reveal>
                <p className="eyebrow">Addis Ababa &middot; Eat, go out, get there</p>
              </Reveal>
              <Reveal delay={0.06}>
                <h1 className="mt-5 text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-app-fg sm:text-6xl lg:text-[5.25rem]">
                  Dinner, a show,
                  <br />
                  <span className="text-ember">and the ride there.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 max-w-lg text-base leading-7 text-app-muted sm:text-lg">
                  Reserve a table with a verified restaurant, get tickets from a
                  verified organizer, and see the taxi fare before you leave the house.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <div className="mt-8 w-full max-w-xl">
                  <HomeSearch />
                </div>
              </Reveal>
            </div>

            {/*
              Hero showcase. Three things have occupied this column: stock
              photos that were neither ours nor Ethiopian, an abstract brand
              panel, and a list in a card. None earned the space.

              This is a composition instead — one photo-forward feature card for
              the trending restaurant, one companion tile for what is next, and
              a quiet text link. Real inventory, no container, no list.
            */}
            <Reveal delay={0.1} className="relative hidden sm:block">
              <div className="ml-auto flex max-w-xl flex-col gap-4">
                {feature ? (
                  <>
                    <Link
                      href={feature.href}
                      className="group relative block h-[300px] overflow-hidden rounded-2xl bg-app-elevated lg:h-[360px]"
                    >
                      {feature.imageUrl ? (
                        <Image
                          src={feature.imageUrl}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 45vw, 560px"
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span aria-hidden className="dot-grid absolute inset-0 flex items-center justify-center font-display text-7xl font-bold text-app-muted/40">
                          {feature.name.charAt(0)}
                        </span>
                      )}

                      {/* Scrim so the name stays legible over any photo. */}
                      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(6_15_29/0.12)_28%,rgb(6_15_29/0.88))]" />

                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-[rgb(251_245_240/0.94)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(11_31_58)]">
                        <span aria-hidden className="size-1.5 rounded-full bg-[rgb(var(--gold-rgb))]" />
                        {feature.badge}
                      </span>

                      <span className="absolute inset-x-5 bottom-5 block text-[rgb(251_245_240)]">
                        <span className="block font-display text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em]">
                          {feature.name}
                        </span>
                        <span className="mt-2 flex items-center gap-2 text-sm">
                          <MapPin className="size-3.5 shrink-0 opacity-80" aria-hidden />
                          <span className="truncate opacity-90">{feature.location}</span>
                          <span aria-hidden className="opacity-50">·</span>
                          <span className="truncate opacity-90">{feature.detail}</span>
                        </span>
                      </span>
                    </Link>

                    {companion && (
                      <Link
                        href={companion.href}
                        className="group flex items-center gap-4 rounded-2xl border border-app-border bg-app-card p-3.5 transition-colors hover:bg-app-alt"
                      >
                        <span className="relative size-[68px] shrink-0 overflow-hidden rounded-xl bg-app-elevated">
                          {companion.imageUrl ? (
                            <Image src={companion.imageUrl} alt="" fill sizes="68px" className="object-cover" />
                          ) : (
                            <span aria-hidden className="dot-grid flex h-full items-center justify-center font-display text-2xl font-bold text-app-muted/50">
                              {companion.name.charAt(0)}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="shrink-0 rounded-md bg-ember-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ember-deep">
                              {companion.badge}
                            </span>
                            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-app-subtle">
                              {companion.detail}
                            </span>
                          </span>
                          <span className="mt-1 block truncate font-semibold text-app-fg group-hover:underline">
                            {companion.name}
                          </span>
                          <span className="block truncate text-[13px] text-app-muted">{companion.location}</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-app-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                    )}

                    <Link
                      href="/restaurants"
                      className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ember underline-offset-4 hover:underline"
                    >
                      Browse everything <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </>
                ) : (
                  <p className="rounded-2xl border border-dashed border-app-border bg-app-alt p-6 text-sm leading-6 text-app-muted">
                    Verified restaurants and events appear here as soon as partners publish them.
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <CategoryRow />
        </section>

        {/* RESTAURANTS */}
        <section aria-labelledby="home-restaurants" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div id="home-restaurants">
              <SectionHeader
                eyebrow="Tables"
                title={topRated.length === 1 ? 'Book a table' : 'Restaurants to book'}
                href="/restaurants"
                actionLabel="All restaurants"
              />
            </div>
          </Reveal>
          {topRated.length > 0 ? (
            <ListingGrid items={topRated} type="restaurants" />
          ) : (
            <SectionEmpty title="No restaurants are taking bookings yet" body="Verified restaurants appear here as soon as they publish a listing." href="/auth/signup/business" cta="List your restaurant" />
          )}
        </section>

        {/* EVENTS — same card grid as the tables above */}
        <section aria-labelledby="home-events" className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div id="home-events">
              <SectionHeader eyebrow="Tickets" title={allThisWeek ? 'This week' : 'Coming up'} href="/events" actionLabel="All events" />
            </div>
          </Reveal>
          {eventRows.length === 0 ? (
            <SectionEmpty title="No upcoming events right now" body="Published events from verified organizers are listed here with dates and ticket prices." href="/auth/signup/organizer" cta="Host an event" />
          ) : (
            <ListingGrid items={eventRows} type="events" />
          )}
        </section>

        {/* HOW AN EVENING COMES TOGETHER */}
        <section className="mt-20 bg-[rgb(11_31_58)] text-[rgb(251_245_240)] dark:bg-app-alt">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-20">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(251_245_240/0.65)] dark:text-app-muted">How it works</p>
              <h2 className="mt-3 text-4xl font-bold leading-[1.05] sm:text-5xl dark:text-app-fg">From “where should we go” to the door.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-[rgb(251_245_240/0.8)] dark:text-app-muted">
                Bookings land in My Plans with a check-in code. Open the ride planner
                from there and the destination is already the venue.
              </p>
            </Reveal>
            <ol className="grid gap-px overflow-hidden rounded-2xl bg-[rgb(251_245_240/0.14)] sm:grid-cols-3 dark:bg-app-border">
              {[
                { icon: UtensilsCrossed, title: 'Choose', body: 'Search restaurants by cuisine or area, or browse dated events.', href: '/restaurants', cta: 'Browse' },
                { icon: QrCode, title: 'Confirm', body: 'Reserve a table or buy tickets. Your code is saved to My Plans.', href: '/plans', cta: 'My plans' },
                { icon: CarFront, title: 'Go', body: 'Set pickup and destination, compare the estimated fare by vehicle.', href: '/ride', cta: 'Ride planner' },
              ].map(({ icon: Icon, title, body, href, cta }, i) => (
                <li key={title} className="flex flex-col bg-[rgb(11_31_58)] p-6 dark:bg-app-card">
                  <span className="font-mono text-xs text-[rgb(251_245_240/0.55)] dark:text-app-subtle">0{i + 1}</span>
                  <Icon className="mt-4 size-6 text-[rgb(var(--gold-rgb))]" aria-hidden />
                  <h3 className="mt-3 text-xl font-bold dark:text-app-fg">{title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-6 text-[rgb(251_245_240/0.78)] dark:text-app-muted">{body}</p>
                  <Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline dark:text-ember">
                    {cta} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PARTNERS */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader eyebrow="For businesses" title="Run bookings from one console" />
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { icon: Store, title: 'Restaurants', points: ['Listings, branches and menus', 'Reservation requests with accept, decline or suggest a time', 'Check-in by booking code'], href: '/auth/signup/business', cta: 'List your restaurant' },
              { icon: Ticket, title: 'Event organizers', points: ['Events with ticket tiers', 'Calendar and ticket sales in one place', 'Public organizer profile'], href: '/auth/signup/organizer', cta: 'Start hosting' },
            ].map(({ icon: Icon, title, points, href, cta }, i) => (
              <Reveal key={title} delay={i * 0.06}>
                <div className="glass flex h-full flex-col rounded-2xl p-6 sm:p-8">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-ember-soft text-ember"><Icon className="size-5" aria-hidden /></span>
                  <h3 className="mt-4 text-2xl font-bold text-app-fg">{title}</h3>
                  <ul className="mt-4 flex-1 space-y-2.5 text-sm text-app-muted">
                    {points.map((p) => (
                      <li key={p} className="flex gap-2.5"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" />{p}</li>
                    ))}
                  </ul>
                  <Link href={href} className="btn-primary mt-6 w-full sm:w-fit">{cta}<ArrowRight className="size-4" aria-hidden /></Link>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm text-app-muted">
            Already a partner? <Link href="/auth/signin" className="font-semibold text-ember underline-offset-4 hover:underline">Sign in to your dashboard</Link>
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}

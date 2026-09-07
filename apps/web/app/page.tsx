import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BadgeCheck, CarFront, Clock3, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HomeSearch from '@/components/HomeSearch'
import CategoryRow from '@/components/CategoryRow'
import { SectionHeader } from '@/components/patterns'
import { ListingCard, ListingCardLarge } from '@/components/patterns/ListingCard'
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion'
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
        {/* ═══════════ HERO — midnight navy, amber glow (ref) ═══════════ */}
        <section className="relative overflow-hidden bg-[#080C17] text-[#F0ECE4]">
          {/* Ambient amber glows — the reference's warm highlights */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(55% 80% at 85% -15%, rgb(232 154 60 / 0.22), transparent 60%), radial-gradient(45% 65% at 8% 105%, rgb(64 84 120 / 0.25), transparent 55%)',
            }}
          />
          {/* Fine dot texture — adds depth without noise */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'radial-gradient(rgb(240 236 228 / 0.12) 1px, transparent 1.3px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Copy column */}
              <div className="text-center lg:text-left">
                <Reveal>
                  <span className="eyebrow !bg-[rgb(240_168_72/0.14)] !text-[#F0A848]">
                    <Sparkles className="size-3.5" strokeWidth={2.5} />
                    Addis Ababa · Eat · Go out · Get there
                  </span>
                </Reveal>

                <Reveal delay={0.08}>
                  <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-[#F0ECE4] sm:text-6xl lg:text-7xl">
                    Find a place
                    <br />
                    you&apos;ll{' '}
                    <span className="relative inline-block">
                      <span className="relative z-10 text-[#F0A848]">love.</span>
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-1.5 z-0 h-3 -rotate-1 rounded-sm bg-[#F0A848]/25 sm:h-4"
                      />
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={0.16}>
                  <p className="mx-auto mt-6 max-w-md text-base leading-7 text-[#B9BECB] sm:text-lg lg:mx-0">
                    Restaurants worth booking, nights worth leaving the
                    house for — and a ride to get you there.
                  </p>
                </Reveal>

                <Reveal delay={0.24}>
                  <div className="mx-auto mt-8 w-full max-w-xl text-left lg:mx-0">
                    <HomeSearch variant="onDark" />
                  </div>
                </Reveal>

                <Reveal delay={0.32}>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#848A9E] lg:justify-start">
                    <span className="inline-flex items-center gap-1.5">
                      <BadgeCheck className="size-3.5 text-[#F0A848]" strokeWidth={2.5} />
                      Verified partners only
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-[#F0A848]" strokeWidth={2.5} />
                      Real-time table availability
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CarFront className="size-3.5 text-[#F0A848]" strokeWidth={2.5} />
                      Fares in ETB, upfront
                    </span>
                  </div>
                </Reveal>
              </div>

              {/* Photo collage — floating glass-framed stack */}
              <Reveal delay={0.2} className="relative mx-auto hidden w-full max-w-md lg:block">
                <div className="relative h-[420px]">
                  {/* Back card — nightlife */}
                  <div className="absolute right-0 top-6 w-56 rotate-3 overflow-hidden rounded-3xl shadow-elevate transition-transform duration-300 ease-out hover:rotate-1">
                    <div className="relative aspect-[4/5]">
                      <Image
                        src="/places/night-2.jpg"
                        alt="Nightlife in Addis Ababa"
                        fill
                        sizes="224px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Left card — food */}
                  <div className="absolute left-0 top-0 w-60 -rotate-2 overflow-hidden rounded-3xl shadow-elevate transition-transform duration-300 ease-out hover:rotate-0">
                    <div className="relative aspect-[4/5]">
                      <Image
                        src="/places/food-4.jpg"
                        alt="Dish at a partner restaurant"
                        fill
                        sizes="240px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Front card — event */}
                  <div className="absolute bottom-0 left-14 w-64 rotate-1 overflow-hidden rounded-3xl bg-white/70 shadow-glass-strong backdrop-blur-xl backdrop-saturate-150 transition-transform duration-300 ease-out hover:rotate-0 dark:bg-white/10">
                    <div className="relative aspect-[16/10]">
                      <Image
                        src="/places/event-1.jpg"
                        alt="Live event"
                        fill
                        sizes="256px"
                        className="object-cover"
                      />
                    </div>
                    <div className="px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ember">
                        Tonight
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-app-fg">
                        Night Market Sessions
                      </p>
                    </div>
                  </div>

                  {/* Glass pill accents — amber on navy glass */}
                  <span className="absolute -left-3 top-28 z-10 rounded-full border border-white/25 bg-[rgb(240_236_228/0.12)] px-3.5 py-1.5 text-xs font-semibold text-[#F0ECE4] shadow-glass backdrop-blur-xl">
                    ★ 4.9 rated
                  </span>
                  <span className="absolute -right-2 bottom-28 z-10 rounded-full border border-white/25 bg-[#F0A848]/90 px-3.5 py-1.5 text-xs font-semibold text-[#080C17] shadow-glass backdrop-blur-xl">
                    ETB fares
                  </span>
                </div>
              </Reveal>
            </div>

            {/* ── Stats trust bar (pro element) ─────────────────── */}
            <Reveal delay={0.4}>
              <div className="mt-14 grid grid-cols-2 gap-3 border-t border-white/10 pt-8 sm:grid-cols-4 sm:gap-4">
                {[
                  { value: '120+', label: 'Partner venues' },
                  { value: '40+', label: 'Weekly events' },
                  { value: '3', label: 'Ride providers' },
                  { value: '4.9★', label: 'Average rating' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <p className="text-2xl font-bold tabular-nums text-[#F0A848] sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#848A9E]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════ Categories ═══════════ */}
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <CategoryRow />
        </section>

        {/* ═══════════ Trending restaurants ═══════════ */}
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              title="Trending Restaurants"
              eyebrow="Most booked this week"
              href="/restaurants"
            />
          </Reveal>
          {trending.length > 0 ? (
            <StaggerGroup className="snap-row !py-1">
              {trending.map((item) => (
                <StaggerItem key={item.id} className="h-full">
                  <ListingCardLarge
                    item={item}
                    type="restaurants"
                    href={`/restaurants/${item.id}`}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <p className="glass-subtle mt-4 rounded-2xl p-6 text-sm text-app-muted">
              No restaurants listed yet — partners are onboarding now.
            </p>
          )}
        </section>

        {/* ═══════════ Events — featured poster + dated rows ═══════════ */}
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              title="This Week’s Events"
              eyebrow="Concerts, shows and festivals near you"
              href="/events"
            />
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-2">
            {featured ? (
              <Reveal>
                <ListingCardLarge
                  item={featured}
                  type="events"
                  href={`/events/${featured.id}`}
                  className="h-full"
                />
              </Reveal>
            ) : (
              <div className="glass-subtle rounded-2xl p-6 text-sm text-app-muted">
                No published events yet.
              </div>
            )}

            <div className="flex flex-col gap-4">
              {upcoming.slice(0, 2).map((item, i) => (
                <Reveal key={item.id} delay={i * 0.08}>
                  <ListingCard
                    item={item}
                    type="events"
                    href={`/events/${item.id}`}
                  />
                </Reveal>
              ))}

              {/* Cross-sell band — accent glass */}
              <Reveal delay={0.16} className="flex-1">
                <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-ember to-ember-deep p-6 shadow-[0_8px_32px_rgb(var(--ember-rgb)/0.35)]">
                  <h3 className="text-2xl font-bold text-white">
                    Book it. Then ride.
                  </h3>
                  <p className="mt-1.5 max-w-[260px] text-sm leading-6 text-white/85">
                    Compare meter-taxi fares across providers and get to your
                    reservation on time.
                  </p>
                  <Link
                    href="/ride"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
                  >
                    Estimate a fare
                    <ArrowRight className="size-4" strokeWidth={2.5} />
                  </Link>
                  <CarFront
                    className="absolute -bottom-4 -right-3 size-28 text-white/20"
                    aria-hidden
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════ Partner CTA — navy band, amber accents ═══════════ */}
        <section className="mt-20">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <Reveal>
              <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0D1120] p-8 text-center shadow-glass-strong sm:p-10">
                {/* Ambient amber glow inside the card */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(70% 90% at 85% -20%, rgb(240 168 72 / 0.18), transparent 60%), radial-gradient(50% 70% at 0% 120%, rgb(64 84 120 / 0.22), transparent 55%)',
                  }}
                />
                <p className="eyebrow relative mx-auto !bg-[rgb(240_168_72/0.14)] !text-[#F0A848]">
                  For businesses
                </p>
                <h2 className="relative mt-4 text-3xl font-bold tracking-tight text-[#F0ECE4] sm:text-4xl">
                  Grow your reach with UrbanExplore
                </h2>
                <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-[#B9BECB]">
                  List your restaurant or events, manage reservations and tickets,
                  and track real analytics — all from one partner dashboard.
                </p>
                <Link
                  href="/auth/role"
                  className="btn-primary relative mt-6 !px-7 !py-3.5"
                >
                  List your business
                  <ArrowRight className="size-4" strokeWidth={2.5} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

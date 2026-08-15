import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Bell, CalendarDays, CarFront, Check, Compass, MapPinned, Sparkles, Star, Ticket, Utensils } from 'lucide-react'

const features = [
  {
    title: 'Restaurants',
    accent: 'Food & Dining',
    description: 'Restaurants, cafés, bakeries, bars, lounges, pubs, food trucks, and hotels.',
    icon: Utensils,
  },
  {
    title: 'Events',
    accent: 'Events & Entertainment',
    description: 'Concerts, festivals, shows, conferences, exhibitions, nightlife, and live experiences.',
    icon: CalendarDays,
  },
  {
    title: 'Ride',
    accent: 'Go by Ride',
    description: 'Compare prices, book rides, and travel seamlessly between places in your city.',
    icon: CarFront,
  },
]

const howItWorks = [
  { step: '1', title: 'Discover', copy: 'Search for restaurants, events, and rides near you.' },
  { step: '2', title: 'Book', copy: 'Reserve tables, buy tickets, or compare ride prices instantly.' },
  { step: '3', title: 'Enjoy', copy: 'Show up, scan, and move through the day without friction.' },
]

const quickCards = [
  { title: 'Discover', emoji: '🔎', tone: 'bg-[#fdf6ed] text-[#0d2138]' },
  { title: 'Book', emoji: '📅', tone: 'bg-[#f2ead9] text-[#0d2138]' },
  { title: 'Go', emoji: '🚕', tone: 'bg-[#f4e7d6] text-[#0d2138]' },
  { title: 'Enjoy', emoji: '✨', tone: 'bg-[#ede4d5] text-[#0d2138]' },
]

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#07192b] text-[#f8f2ea]">
        <section className="relative overflow-hidden bg-[#07192b] text-[#f3ebdf]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(204,168,103,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(33,62,95,0.7),transparent_35%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="rounded-[28px] border border-[#d7b778]/35 bg-[#071a2f]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.38)] lg:p-8">
              <div className="mb-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7b778]/50 bg-[#d7b778]/10 text-[#d7b778]">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold tracking-tight">FoodRide</div>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[#d7b778]">Discover. Reserve. Go.</div>
                  </div>
                </div>

                <div className="hidden items-center gap-6 text-sm text-[#e8dfd4] md:flex">
                  <span>Restaurants</span>
                  <span>Events</span>
                  <span>Ride</span>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7b778]/40 bg-[#d7b778]/10 text-[#d7b778]">
                    <Bell className="h-4 w-4" />
                  </button>
                  <Link href="/auth/role" className="rounded-full bg-[#d7b778] px-4 py-2 text-sm font-semibold text-[#081a2e]">
                    Join now
                  </Link>
                </div>
              </div>

              <div className="grid gap-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <p className="mb-4 inline-flex rounded-full border border-[#d7b778]/40 bg-[#d7b778]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d7b778]">
                    One app, all your plans
                  </p>
                  <h1 className="font-serif text-4xl font-bold leading-none tracking-tight text-[#f7f2ea] sm:text-5xl lg:text-7xl">
                    Discover. <span className="text-[#d7b778]">Book.</span>
                    <br />
                    Enjoy.
                  </h1>
                  <p className="mt-5 max-w-xl text-base text-[#d7d0c6] sm:text-lg">
                    Explore restaurants, book event tickets, and compare rides in one elegant super-app designed for city life.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/auth/role" className="rounded-xl bg-[#d7b778] px-6 py-3 text-sm font-semibold text-[#081a2e] shadow-[0_10px_25px_rgba(215,183,120,0.28)]">
                      Get started
                    </Link>
                    <Link href="/restaurants" className="rounded-xl border border-[#d7b778]/35 bg-transparent px-6 py-3 text-sm font-semibold text-[#f6efe6]">
                      Browse now
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#d7b778]/30 bg-[#0e2340] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                  <div className="mb-4 flex items-center justify-between text-[#d7b778]">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em]">
                      <MapPinned className="h-3.5 w-3.5" />
                      Nearby
                    </div>
                    <button className="rounded-full border border-[#d7b778]/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f0e4c8]">
                      Secure
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#d7b778]/20 bg-[#091d30] p-4">
                      <div className="mb-2 flex items-center justify-between text-[#e8dfd4]">
                        <span className="text-lg font-semibold">Sky Garden Restaurant</span>
                        <span className="rounded-full bg-[#d7b778]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#d7b778]">4.7</span>
                      </div>
                      <div className="text-sm text-[#d2cabc]">Italian · Bole, Addis Ababa</div>
                    </div>

                    <div className="rounded-2xl border border-[#d7b778]/20 bg-[#091d30] p-4">
                      <div className="mb-2 flex items-center justify-between text-[#e8dfd4]">
                        <span className="text-lg font-semibold">Summer Jazz Night</span>
                        <span className="rounded-full bg-[#d7b778]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#d7b778]">Live</span>
                      </div>
                      <div className="text-sm text-[#d2cabc]">Friday · 8:00 PM · Addis Ababa</div>
                    </div>

                    <div className="rounded-2xl border border-[#d7b778]/20 bg-[#091d30] p-4">
                      <div className="mb-2 flex items-center justify-between text-[#e8dfd4]">
                        <span className="text-lg font-semibold">Go by Ride</span>
                        <span className="rounded-full bg-[#d7b778]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#d7b778]">ETA</span>
                      </div>
                      <div className="text-sm text-[#d2cabc]">Uber and Yango fares in real-time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#07192b] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.26em] text-[#d7b778]">What we offer</div>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#f5efe9] sm:text-4xl">Restaurants, Events & More — All in One Place</h2>
              </div>
              <div className="hidden items-center gap-3 text-sm text-[#e9e0d3] md:flex">
                <button className="rounded-full border border-[#d7b778]/25 bg-[#d7b778]/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#e4ce96]">
                  App Store
                </button>
                <button className="rounded-full border border-[#d7b778]/25 bg-[#d7b778]/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#e4ce96]">
                  Google Play
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {features.map(({ title, accent, description, icon: Icon }) => (
                <div key={title} className="rounded-[24px] border border-[#d7b778]/25 bg-[#0a1d32] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7b778]/10 text-[#d7b778]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-serif text-2xl font-bold text-[#f5efe9]">{title}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#d7b778]">{accent}</div>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-[#d8d0c6]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#07192b] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#d7b778]">How it works</div>
              <h2 className="mt-3 font-serif text-3xl font-bold text-[#f7f0e8] sm:text-4xl">From discovery to dinner in three steps</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {howItWorks.map(({ step, title, copy }) => (
                <div key={title} className="rounded-[24px] border border-[#d7b778]/25 bg-[#091d30] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-[12px] uppercase tracking-[0.22em] text-[#d7b778]">Step {step}</div>
                    <ArrowRight className="h-4 w-4 text-[#d7b778]" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#f9f3ec]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#d5cfc6]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#07192b] pb-20 pt-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[30px] border border-[#d7b778]/30 bg-[#0a1d32] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.28)] md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#d7b778]">For businesses</div>
                  <h2 className="mt-2 font-serif text-3xl font-bold text-[#f7f1ea]">Grow your reach with FoodRide</h2>
                </div>
                <Link href="/auth/role" className="rounded-full border border-[#d7b778]/35 bg-[#d7b778]/10 px-4 py-2 text-sm font-semibold text-[#f1e5c7]">
                  List your business
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {quickCards.map(({ title, emoji, tone }) => (
                  <div key={title} className={`flex items-center gap-3 rounded-2xl border border-[#d7b778]/20 p-4 ${tone}`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07192b]/10 text-2xl">{emoji}</div>
                    <div className="text-lg font-semibold">{title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

import { ArrowRight, Bell, CalendarDays, CarFront, Check, ShieldCheck, Sparkles, Star, Ticket, Users, Utensils } from 'lucide-react'

const palette = [
  { name: 'Navy (accent)', hex: '#173970', className: 'bg-[#173970]' },
  { name: 'Gold (stripe accent)', hex: '#B08D4C', className: 'bg-[#B08D4C]' },
  { name: 'Near-white base', hex: '#F8F8FA', className: 'bg-[#F8F8FA]' },
  { name: 'Near-black ink', hex: '#0F0F12', className: 'bg-[#0F0F12]' },
  { name: 'Glass white', hex: 'white/62%', className: 'bg-white/60' },
]

const featureCards = [
  'Dashboard overview',
  'Event calendar',
  'Create event',
  'Ticket management',
  'Published events',
]

const stats = [
  { label: 'Bookings', value: '1,850' },
  { label: 'Followers', value: '12.5K' },
  { label: 'Revenue', value: 'ETB 6.2K' },
]

export default function SystemDesignPage() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-8 text-app-fg sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Glass navbar sample */}
        <header className="glass rounded-2xl">
          <div className="flex items-center justify-between gap-5 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-ember-deep text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.35)]">
                <CarFront className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight">UrbanExplore</div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-app-muted">
                  Discover. Reserve. Go.
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-8 text-sm text-app-muted md:flex">
              <span className="transition-colors hover:text-app-fg">Restaurants</span>
              <span className="transition-colors hover:text-app-fg">Events</span>
              <span className="transition-colors hover:text-app-fg">Ride</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="glass-subtle flex size-10 items-center justify-center rounded-full text-app-muted">
                <Bell className="h-4 w-4" />
              </div>
              <button className="rounded-full bg-gradient-to-br from-ember to-ember-deep px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] transition-all duration-200 hover:-translate-y-0.5">
                Get started
              </button>
            </div>
          </div>
        </header>

        {/* Feature grid */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              UrbanExplore — Restaurant features
            </h2>
            <div className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </div>
          </div>
          <p className="mb-8 text-base text-app-muted md:text-xl">
            Everything a restaurant needs to grow with UrbanExplore
          </p>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {featureCards.map((title, index) => (
              <div
                key={title}
                className="glass glass-hover rounded-2xl p-5 transition-all duration-200"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ember">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <ArrowRight className="h-4 w-4 text-app-muted" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-app-muted">
                  {index === 0 && 'Overview of your entire business'}
                  {index === 1 && 'Manage all your reservations in one calendar'}
                  {index === 2 && 'Add all the details of your event'}
                  {index === 3 && 'Create and manage ticket types'}
                  {index === 4 && 'Manage all your published content'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Three-column showcase */}
        <section className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_1fr_1.15fr]">
          {/* Restaurant card */}
          <div className="glass glass-hover rounded-3xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ember">
                  Restaurant
                </div>
                <div className="mt-2 text-2xl font-bold">Sky Garden</div>
              </div>
              <div className="rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ember">
                Premium
              </div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-app-border bg-app-input/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-ember/10 text-ember">
                      {item === 1 ? (
                        <Utensils className="h-5 w-5" />
                      ) : item === 2 ? (
                        <CalendarDays className="h-5 w-5" />
                      ) : (
                        <Ticket className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-base font-medium">
                        {item === 1 ? 'Reservations' : item === 2 ? 'Live menu' : 'Special offers'}
                      </div>
                      <div className="text-xs text-app-muted">
                        {item === 1 ? '12 tables available' : item === 2 ? 'Updated today' : 'Weekend promo'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-ember">
                    {item === 1 ? '24' : item === 2 ? '8' : '5'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-app-border bg-app-input/70 p-3 text-center"
                >
                  <div className="text-xl font-bold tabular-nums">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-app-muted">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create event form sample */}
          <div className="glass glass-hover rounded-3xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-2xl font-bold">Create Event</div>
              <button className="glass-subtle rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-app-fg">
                Add event
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl">
              <div className="h-44 bg-[radial-gradient(circle_at_top,rgb(var(--ember-rgb)/0.5),transparent_35%),linear-gradient(135deg,rgb(var(--ember-deep-rgb)/0.8),rgb(var(--ink-rgb)))]" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-app-muted">
                  Event name
                </label>
                <input
                  value="Sunset Brunch Party"
                  readOnly
                  className="input-premium w-full"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-app-muted">
                    Date
                  </label>
                  <input value="May 25, 2025" readOnly className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-app-muted">
                    Time
                  </label>
                  <input value="4:00 PM" readOnly className="input-premium w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Ride card sample */}
          <div className="glass glass-hover rounded-3xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ember">
                  Ride
                </div>
                <div className="mt-2 text-2xl font-bold">Go by Ride</div>
              </div>
              <div className="glass-subtle flex size-10 items-center justify-center rounded-full text-app-muted">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-2xl border border-app-border bg-app-input/70 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="size-3.5 rounded-full bg-ember" />
                <div className="text-sm">Your location</div>
              </div>
              <div className="rounded-2xl border border-app-border bg-app-bg/60 p-3 text-sm text-app-muted">
                Pickup: Bole, Addis Ababa
              </div>
              <div className="mt-3 rounded-2xl border border-app-border bg-app-bg/60 p-3 text-sm text-app-muted">
                Destination: Sky Garden Restaurant
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {['Uber', 'Yango', 'Lynx', 'Feres'].map((name, idx) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-2xl border border-app-border bg-app-input/70 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-ember/10 text-xs font-bold text-ember">
                      {name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-app-muted">{idx + 2} min · ETA</div>
                    </div>
                  </div>
                  <div className="text-base font-semibold tabular-nums text-ember">
                    ETB {220 + idx * 20}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Token reference */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Color palette', icon: <Sparkles className="h-4 w-4" /> },
            { title: 'Typography', icon: <Star className="h-4 w-4" /> },
            { title: 'UI elements', icon: <Users className="h-4 w-4" /> },
            { title: 'Usage guide', icon: <Check className="h-4 w-4" /> },
          ].map((item) => (
            <div key={item.title} className="glass rounded-2xl p-5">
              <div className="mb-5 flex items-center gap-2 text-ember">
                {item.icon}
                <h3 className="text-lg font-semibold">{item.title}</h3>
              </div>

              {item.title === 'Color palette' && (
                <div className="grid grid-cols-2 gap-4">
                  {palette.map((color) => (
                    <div key={color.name} className="space-y-2">
                      <div
                        className={`h-16 rounded-xl border border-app-border ${color.className}`}
                      />
                      <div className="text-xs text-app-muted">{color.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-app-muted/70">
                        {color.hex}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {item.title === 'Typography' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-7xl font-bold tracking-tight">Aa</div>
                    <div className="mt-2 text-sm text-app-muted">Space Grotesk — display &amp; body</div>
                  </div>
                  <div>
                    <div className="text-3xl font-semibold tracking-tight">Aa</div>
                    <div className="mt-2 text-sm text-app-muted">
                      One family, weight-driven hierarchy
                    </div>
                  </div>
                </div>
              )}

              {item.title === 'UI elements' && (
                <div className="space-y-4">
                  <button className="w-full rounded-xl bg-gradient-to-br from-ember to-ember-deep px-4 py-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] transition-all duration-200 hover:-translate-y-0.5">
                    Primary Button
                  </button>
                  <button className="glass-subtle w-full rounded-xl px-4 py-3 text-sm font-semibold">
                    Secondary Button
                  </button>
                  <div className="flex items-center justify-center rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm font-semibold text-ember">
                    20% OFF
                  </div>
                </div>
              )}

              {item.title === 'Usage guide' && (
                <ul className="space-y-3 text-sm text-app-muted">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                    Glass panels on elevated surfaces only — not every element.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                    One ember accent, used sparingly for actions &amp; highlights.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                    Soft layered shadows instead of hard borders.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                    150–300ms ease-out motion; respects reduced-motion.
                  </li>
                </ul>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

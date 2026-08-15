import { ArrowRight, Bell, CalendarDays, CarFront, Check, Compass, MapPinned, Menu, Search, ShieldCheck, Star, Utensils, Ticket, UserRound, Wallet, Wifi, Users, Clock3, Sparkles } from 'lucide-react'

const palette = [
  { name: 'Deep Navy', hex: '#08182D', className: 'bg-[#08182D]' },
  { name: 'Ivory', hex: '#F8F5F0', className: 'bg-[#F8F5F0]' },
  { name: 'Muted Gold', hex: '#C8A976', className: 'bg-[#C8A976]' },
  { name: 'Charcoal', hex: '#2E2E2E', className: 'bg-[#2E2E2E]' },
  { name: 'Gray', hex: '#8A8A8A', className: 'bg-[#8A8A8A]' },
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
    <main className="min-h-screen bg-[#050e1b] text-[#f6f0e8]">
      <div className="mx-auto max-w-[1500px] px-5 py-8 lg:px-10">
        <header className="rounded-[22px] border border-[#d8b879]/60 bg-[#07162a] shadow-[0_0_0_1px_rgba(216,184,121,0.25)]">
          <div className="flex items-center justify-between gap-5 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8b879]/60 bg-[#d8b879]/10 text-[#d8b879]">
                <CarFront className="h-5 w-5" />
              </div>
              <div>
                <div className="font-serif text-3xl font-bold tracking-tight text-[#f7f0e4]">UrbanExplore</div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-[#d8b879]/80">Discover. Reserve. Go.</div>
              </div>
            </div>

            <div className="hidden items-center gap-8 text-sm text-[#f4efe9] md:flex">
              <span className="hover:text-[#d8b879]">Restaurants</span>
              <span className="hover:text-[#d8b879]">Events</span>
              <span className="hover:text-[#d8b879]">Ride</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8b879]/50 bg-[#d8b879]/10 text-[#d8b879]">
                <Bell className="h-4 w-4" />
              </div>
              <button className="rounded-full border border-[#d8b879]/40 bg-[#d8b879]/10 px-4 py-2 text-sm font-semibold text-[#f5efe8]">
                Get started
              </button>
            </div>
          </div>
        </header>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-4xl font-bold text-[#f3ecdf] md:text-5xl">UrbanExplore — Restaurant features</h2>
            <div className="flex items-center gap-2 rounded-full border border-[#d8b879]/50 bg-[#d8b879]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b879]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </div>
          </div>
          <p className="mb-8 text-center text-base text-[#d7d1c8] md:text-xl">
            Everything a restaurant needs to grow with UrbanExplore
          </p>

          <div className="grid gap-6 xl:grid-cols-5">
            {featureCards.map((title, index) => (
              <div key={title} className="rounded-[22px] border border-[#d8b879]/30 bg-[#081a2d] p-5 shadow-[0_24px_60px_rgba(2,8,20,0.7)]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[#d8b879]">{index + 1}</span>
                  <ArrowRight className="h-4 w-4 text-[#d8b879]" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#f1eadc]">{title}</h3>
                <p className="mt-2 text-sm text-[#c3bdb2]">
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

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr_1.15fr]">
          <div className="rounded-[24px] border border-[#d8b879]/40 bg-[#081a2d] p-5 shadow-[0_30px_80px_rgba(1,5,12,0.8)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#d8b879]">Restaurant</div>
                <div className="mt-2 font-serif text-3xl font-bold text-[#f9f0e4]">Sky Garden</div>
              </div>
              <div className="rounded-full border border-[#d8b879]/60 bg-[#d8b879]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#e4ca92]">
                Premium
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-[#d8b879]/20 bg-[#0c1f33] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d8b879]/10 text-[#f0d08a]">
                      {item === 1 ? <Utensils className="h-5 w-5" /> : item === 2 ? <CalendarDays className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-base font-medium text-[#f3ecdf]">
                        {item === 1 ? 'Reservations' : item === 2 ? 'Live menu' : 'Special offers'}
                      </div>
                      <div className="text-xs text-[#bcb5a9]">{item === 1 ? '12 tables available' : item === 2 ? 'Updated today' : 'Weekend promo'}</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[#d8b879]">{item === 1 ? '24' : item === 2 ? '8' : '5'}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#d8b879]/25 bg-[#0c1f33] p-3 text-center">
                  <div className="font-serif text-2xl font-bold text-[#f2e8d8]">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#bcb5a9]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d8b879]/35 bg-[#081a2d] p-5 shadow-[0_30px_80px_rgba(1,5,12,0.8)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="font-serif text-3xl font-bold text-[#f8f1e8]">Create Event</div>
              <button className="rounded-full border border-[#d8b879]/40 bg-[#d8b879]/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[#e7d19c]">
                Add event
              </button>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-[#d8b879]/25 bg-[#0f1d30]">
              <div className="h-44 bg-[radial-gradient(circle_at_top,_rgba(210,177,98,0.5),transparent_35%),linear-gradient(135deg,#2d123d,#090d16_50%,#0b203c)]" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#d8b879]">Event name</label>
                <input value="Sunset Brunch Party" readOnly className="w-full rounded-2xl border border-[#d8b879]/25 bg-[#0d1d2d] px-4 py-3 text-base text-[#f2ede5] outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#d8b879]">Date</label>
                  <input value="May 25, 2025" readOnly className="w-full rounded-2xl border border-[#d8b879]/25 bg-[#0d1d2d] px-4 py-3 text-base text-[#f2ede5] outline-none" />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#d8b879]">Time</label>
                  <input value="4:00 PM" readOnly className="w-full rounded-2xl border border-[#d8b879]/25 bg-[#0d1d2d] px-4 py-3 text-base text-[#f2ede5] outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d8b879]/40 bg-[#081a2d] p-5 shadow-[0_30px_80px_rgba(1,5,12,0.8)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#d8b879]">Ride</div>
                <div className="mt-2 font-serif text-3xl font-bold text-[#f6f0e7]">Go by Ride</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8b879]/40 bg-[#d8b879]/10 text-[#d8b879]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-[22px] border border-[#d8b879]/20 bg-[#0f1d30] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-3.5 w-3.5 rounded-full bg-[#d8b879]" />
                <div className="text-sm text-[#efe7d9]">Your location</div>
              </div>
              <div className="rounded-2xl border border-[#d8b879]/20 bg-[#d8b879]/5 p-3 text-sm text-[#d7d1c8]">
                Pickup: Bole, Addis Ababa
              </div>
              <div className="mt-3 rounded-2xl border border-[#d8b879]/20 bg-[#d8b879]/5 p-3 text-sm text-[#d7d1c8]">
                Destination: Sky Garden Restaurant
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {['Uber', 'Yango', 'Lynx', 'Feres'].map((name, idx) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-[#d8b879]/20 bg-[#0d1d2e] p-3 text-[#efe8dc]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8b879]/10 text-[#f0d08a] text-xs font-bold">
                      {name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-[#c7bcae]">{idx + 2} min · ETA</div>
                    </div>
                  </div>
                  <div className="text-base font-semibold text-[#f0d08a]">ETB {220 + idx * 20}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-4">
          {[
            { title: 'Color palette', icon: <Sparkles className="h-4 w-4" /> },
            { title: 'Typography', icon: <Star className="h-4 w-4" /> },
            { title: 'UI elements', icon: <Users className="h-4 w-4" /> },
            { title: 'Usage guide', icon: <Check className="h-4 w-4" /> },
          ].map((item) => (
            <div key={item.title} className="rounded-[22px] border border-[#d8b879]/30 bg-[#081a2d] p-5">
              <div className="mb-5 flex items-center gap-2 text-[#d8b879]">
                {item.icon}
                <h3 className="font-serif text-xl font-semibold text-[#f4ecdf]">{item.title}</h3>
              </div>

              {item.title === 'Color palette' && (
                <div className="grid grid-cols-2 gap-4">
                  {palette.map((color) => (
                    <div key={color.name} className="space-y-2">
                      <div className={`h-16 rounded-xl border border-white/10 ${color.className}`} />
                      <div className="text-xs text-[#d1c8bc]">{color.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[#a19e95]">{color.hex}</div>
                    </div>
                  ))}
                </div>
              )}

              {item.title === 'Typography' && (
                <div className="space-y-6">
                  <div>
                    <div className="font-serif text-7xl tracking-[-0.04em] text-[#f6f0e8]">Aa</div>
                    <div className="mt-2 text-sm text-[#b9b1a3]">Playfair Display</div>
                  </div>
                  <div>
                    <div className="font-sans text-7xl tracking-[-0.04em] text-[#f6f0e8]">Aa</div>
                    <div className="mt-2 text-sm text-[#b9b1a3]">Inter Body</div>
                  </div>
                </div>
              )}

              {item.title === 'UI elements' && (
                <div className="space-y-4">
                  <button className="w-full rounded-xl bg-[#0c1a2c] px-4 py-3 text-sm font-semibold text-[#f2eadc] shadow-[inset_0_0_0_1px_rgba(216,184,121,0.35)]">
                    Primary Button
                  </button>
                  <button className="w-full rounded-xl border border-[#d8b879]/35 bg-transparent px-4 py-3 text-sm font-semibold text-[#f2eadc]">
                    Secondary Button
                  </button>
                  <div className="flex items-center justify-center rounded-xl border border-[#d8b879]/30 bg-[#d8b879]/10 px-4 py-3 text-sm font-semibold text-[#f2d9ab]">
                    20% OFF
                  </div>
                </div>
              )}

              {item.title === 'Usage guide' && (
                <ul className="space-y-3 text-sm text-[#d7d1c8]">
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[#d8b879]" /> Ivory is used as the main background.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[#d8b879]" /> Deep navy is used for navigation and cards.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[#d8b879]" /> Gold is used for premium accents.</li>
                </ul>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

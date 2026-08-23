import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, CarFront, Palette, Utensils, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { SectionHeader } from '@/components/patterns'

export const metadata: Metadata = { title: 'Product vision' }

const gallery = [
  {
    group: 'For explorers',
    icon: Users,
    caption: 'Discover restaurants and events in one feed',
    items: [
      { src: '/vision/app-light-screens.jpg', alt: 'Consumer app — home, events and ride tabs', wide: true },
      { src: '/vision/restaurant-detail.jpg', alt: 'Restaurant profile with menus, branches and reservations' },
      { src: '/vision/ride-screen.jpg', alt: 'Go and Book Ride — compare partner prices in real time' },
    ],
  },
  {
    group: 'For restaurant partners',
    icon: Utensils,
    caption: 'Everything a restaurant needs to grow',
    items: [
      { src: '/vision/restaurant-suite.jpg', alt: 'Restaurant features — profiles, reservations, menu management and analytics', wide: true },
    ],
  },
  {
    group: 'For event organizers',
    icon: CalendarDays,
    caption: 'Create, publish and sell out events',
    items: [
      { src: '/vision/organizer-dashboard.jpg', alt: 'Organizer dashboard, calendar, ticket management and analytics', wide: true },
      { src: '/vision/create-event.jpg', alt: 'Five step create event wizard' },
    ],
  },
  {
    group: 'One platform, five screens',
    icon: CarFront,
    caption: 'The full UrbanExplore experience',
    items: [
      { src: '/vision/app-dark-suite.jpg', alt: 'Dark app suite — home, calendar, event detail, organizer and restaurant profiles', wide: true },
    ],
  },
  {
    group: 'Design language',
    icon: Palette,
    caption: 'Navy, ivory and gold — Playfair Display with Inter',
    items: [
      { src: '/vision/design-tokens.jpg', alt: 'Color palette, typography and UI elements', wide: true },
      { src: '/vision/role-picker.jpg', alt: 'Role selection — explorer, food business or event organizer' },
      { src: '/vision/signup-categories.jpg', alt: 'Business and organizer category selection' },
    ],
  },
]

export default function VisionPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-app-bg text-app-fg">
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Where we&apos;re headed
          </p>
          <h1 className="mt-2 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
            The UrbanExplore vision, straight from the design studio.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-app-muted">
            These are the product blueprints guiding every screen we build — a seamless
            experience for explorers, restaurant partners and event organizers on mobile
            and desktop. The live site already follows this language; here is the full
            picture of where it lands.
          </p>
          <Link
            href="/restaurants"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-navy shadow-lg shadow-gold/20 transition-transform active:scale-[0.98]"
          >
            See what&apos;s live today
            <ArrowRight className="size-4" />
          </Link>
        </section>

        {gallery.map(({ group, icon: Icon, caption, items }) => (
          <section key={group} className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-bold">{group}</h2>
                <p className="text-sm text-app-muted">{caption}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {items.map((item) => (
                <figure
                  key={item.src}
                  className={`overflow-hidden rounded-[24px] border border-app-border bg-app-panel shadow-[var(--shadow-md)] ${
                    item.wide ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className={`relative w-full ${item.wide ? 'aspect-[21/9]' : 'aspect-[4/3]'} bg-app-input`}>
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes={item.wide ? '(max-width: 768px) 100vw, 1200px' : '(max-width: 768px) 100vw, 600px'}
                      className="object-cover object-top"
                    />
                  </div>
                  <figcaption className="px-5 py-3 text-sm text-app-muted">{item.alt}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}

        <section className="mx-auto mt-14 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-gold/30 bg-app-panel p-6 text-center sm:p-10">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">
              Want this in your pocket?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-app-muted">
              Join the waitlist as an explorer, list your restaurant, or start selling
              tickets to your events.
            </p>
            <Link
              href="/auth/role"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-lg shadow-gold/20 transition-transform active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

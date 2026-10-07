# Phase 4: Public Pages

## Skills to Use
- `frontend-design` — Visual direction for public pages
- `ui-design` — Build/audit UI, responsive design
- `responsive-layout` — App shell, breakpoints
- `nextjs` — Server Components, data fetching, SSR
- `react` — React 19 patterns, hooks, performance
- `empty-and-loading-states` — Skeletons, empty states
- `web-design-guidelines` — 100+ rules for a11y, performance, UX review
- `seo-expert` — Meta tags, OpenGraph, structured data
- `i18n-handbook` — Locale routing, metadata, RTL support
- `performance-optimization` — Core Web Vitals, bundle optimization

## Objective
Build all public-facing pages: home, restaurant catalogue, event catalogue, hotel catalogue, ride planner, and static pages.

## Files to Create

### `apps/web/app/page.tsx` — Home Page
Sections:
1. **Hero** — Headline, subtext, search bar (`HomeSearch`)
2. **Categories** — Horizontal chip row (`CategoryRow`): Restaurants, Events, Hotels
3. **Trending Restaurants** — Grid of `ListingCard` with top-rated restaurants
4. **Upcoming Events** — Grid of event cards
5. **Ride CTA** — "Get a ride" banner with link to `/ride`
6. **Partner CTA** — "List your business" banner with link to `/auth/role`

Data: Uses `lib/catalogue.ts` cached reads (60s TTL) with fallback sample data.

### `apps/web/app/restaurants/page.tsx` — Restaurant Catalogue
- Search bar (name, cuisine, area)
- Filter sheet: cuisine, price range, rating, distance
- Sort: rating, distance, name
- Grid of `ListingCard`
- Pagination or "load more"
- Uses `ExploreCatalogue` component

### `apps/web/app/restaurants/[id]/page.tsx` — Restaurant Detail
Sections:
1. **Hero** — Cover image, name, cuisine, rating, verified badge
2. **Info** — Address, hours, phone, website
3. **Menu** — Tabbed by category, items with prices
4. **Branches** — List of branches with booking config
5. **Reservation Form** — `reservation-form.tsx` component
6. **Ride Card** — "Get a ride here" with link to `/ride?to=<address>`

Data: `getRestaurantDetail(id)` from `lib/supabase/queries.ts`

### `apps/web/app/events/page.tsx` — Event Catalogue
- Search bar (title, category, venue)
- Date filter: today, this week, this month
- Category filter
- Grid of event cards
- Uses `ExploreCatalogue` component

### `apps/web/app/events/[id]/page.tsx` — Event Detail
Sections:
1. **Hero** — Cover image, title, date badge, venue
2. **Info** — Description, date/time, venue, map link
3. **Ticket Tiers** — `TierRow` for each ticket type with quantity stepper
4. **Purchase Button** — Calls `purchaseTickets` server action with Stripe
5. **Ride Actions** — "Get a ride" + "Navigate" buttons
6. **Organizer** — Link to organizer profile

Data: `getEventDetail(id)` from `lib/supabase/queries.ts`

### `apps/web/app/hotels/page.tsx` — Hotel Catalogue
- Search bar (name, area, star rating)
- Filter: star rating, price range, amenities
- Sort: price, rating, distance
- Grid of hotel cards
- Uses `ExploreCatalogue` component

### `apps/web/app/hotels/[id]/page.tsx` — Hotel Detail
Sections:
1. **Hero** — Photo gallery, name, star rating, address
2. **Info** — Amenities, check-in/out times, contact
3. **Rooms** — Room type cards with photos, amenities, price/night
4. **Booking Form** — Date range picker, guest count, room type
5. **Reviews** — User reviews with photos
6. **Map** — Location with "Get a Ride" button

### `apps/web/app/ride/page.tsx` — Ride Planner (Enhanced)
Sections:
1. **Map** — `RideMap` with Leaflet, pickup/destination markers, route polyline
2. **Search** — Address search with Nominatim autocomplete
3. **Route Info** — Distance, duration, traffic status
4. **Ride Options** — List of providers (Uber, Yango, Lyft, Feres) with ETA + fare
5. **Schedule** — "Ride now" or "Schedule for later" (date/time picker)
6. **Actions** — "Go" (open navigation) + "Book Ride" (dispatch link)
7. **Split Fare** — "Split with friends" (generates share link)

Data: `lib/rides.ts` for fare math, `/api/geo/search` for places, `/api/geo/route` for routing

### `apps/web/app/map/page.tsx` — Map Discovery
- Full-screen map with restaurant/event/hotel markers
- Draw area to search
- Filter by type (restaurant, event, hotel)
- Tap marker → preview card → tap to view detail
- "Near me" button to center on user location

### `apps/web/app/organizers/[id]/page.tsx` — Organizer Profile
- Organizer info (name, bio, verified badge)
- Stats: events count, followers, rating
- Upcoming events grid
- Follow button

### `apps/web/app/about/page.tsx` — About
- Uses `InfoPage` component
- Company mission, team, contact

### `apps/web/app/vision/page.tsx` — Vision Gallery
- Product vision images and descriptions

### `apps/web/app/privacy/page.tsx` — Privacy Policy
- Uses `InfoPage` component

### `apps/web/app/terms/page.tsx` — Terms of Service
- Uses `InfoPage` component

### `apps/web/app/sitemap.ts` — Dynamic Sitemap
- Static pages + all restaurants + events + hotels + organizers

### `apps/web/app/robots.ts` — Robots.txt
- Allow all, disallow `/dashboard`, `/settings`, `/auth`, `/api`, `/plans`

### `apps/web/app/manifest.ts` — PWA Manifest
- App name, icons, theme color, display mode

## Verification Gate

- [ ] Home page renders with all sections
- [ ] Restaurant catalogue loads with search/filter/sort
- [ ] Restaurant detail shows menu, branches, reservation form
- [ ] Event catalogue loads with filters
- [ ] Event detail shows ticket tiers + purchase flow
- [ ] Hotel catalogue loads with filters
- [ ] Hotel detail shows rooms + booking form
- [ ] Ride planner shows map, search, route, fare estimates
- [ ] Map discovery page works
- [ ] All static pages render
- [ ] Sitemap includes all dynamic URLs
- [ ] Responsive at all breakpoints
- [ ] `npx tsc --noEmit` passes

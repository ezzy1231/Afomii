<div align="center">

# UrbanExplore

**Restaurant discovery, table reservations, event ticketing, and a ride fare estimator for
Addis Ababa.**

Next.js 14 · Supabase (Auth · Postgres · Row Level Security · PL/pgSQL) · Leaflet · OSM · Turborepo

[Live app](https://urbanexplore.netlify.app/)

</div>

---

## Screenshots

| Restaurant discovery | Restaurant detail |
|---|---|
| ![Restaurant suite](apps/web/public/vision/restaurant-suite.jpg) | ![Restaurant detail](apps/web/public/vision/restaurant-detail.jpg) |

| Organizer console | Ride planner |
|---|---|
| ![Organizer dashboard](apps/web/public/vision/organizer-dashboard.jpg) | ![Ride screen](apps/web/public/vision/ride-screen.jpg) |

| Light mode | Dark mode |
|---|---|
| ![App light](apps/web/public/vision/app-light-screens.jpg) | ![App dark](apps/web/public/vision/app-dark-suite.jpg) |

---

## What it does

A local marketplace for the city, built around four surfaces.

**Discover restaurants** — a public catalogue with filtering by name, category and location,
restaurant detail pages, and browsable menus.

**Reserve a table** — a real, capacity-checked reservation flow. Guests pick a date and slot
derived from the branch's opening hours, see remaining capacity, and get a QR check-in code.
Partners can confirm, reject, or propose an alternative time, which the guest can accept
against a fresh capacity check.

**Buy event tickets** — a real inventory flow. Ticket holds lock a row, decrement available
quantity, and expire after 15 minutes. A scheduled job sweeps expired holds every 5 minutes.
Completed purchases generate a unique `UE-` prefixed QR code.

**Estimate a ride fare** — pick up and drop-off points, see three meter-taxi fare tiers
computed from distance, then hand off to turn-by-turn navigation.

### Roles

Four role-based surfaces, each with its own dashboard:

| Role | Dashboard |
|---|---|
| Customer | Reservations, tickets, saved places, notifications |
| Restaurant | Branches, menus, bookings, reservations, offers, branch manager tools |
| Organizer | Events, ticket types, sales, attendees |
| Admin | Verification queue, user management, platform settings |

---

## Architecture

```
apps/web          Next.js 14 App Router — the only application in production use
apps/backend      NestJS API — frozen, see below
apps/mobile       Expo / React Native — early, not connected to the live data layer
packages/database Prisma schema (abandoned)
packages/shared   Zod schemas and TypeScript types
packages/supabase 24 SQL migrations, seeds, and verification queries
```

Turborepo with pnpm workspaces. The web app talks to Supabase **directly** — auth, queries
and mutations all go through `@supabase/ssr` and server actions. There is no API server in
the request path.

### The data layer is the interesting part

All 19 tables live in Postgres behind Supabase, and **authorisation is enforced in the
database rather than trusted from the client**.

- **24 SQL migrations**, applied in order, with a `private` schema for internal helpers that
  `anon` cannot read.
- **~59 active Row Level Security policies** across 20 tables, plus storage-bucket policies
  for public banners and private verification documents.
- **13 PL/pgSQL functions** — reservation capacity checks, ticket holds, purchase
  completion, hold release, notification triggers, and two `pg_cron` jobs.

The security work is deliberate and layered:

- Identity is derived from `auth.uid()` **inside** the functions. The `p_user_id` parameter
  was removed entirely so a caller cannot pass someone else's ID.
- `SECURITY DEFINER` functions revoke direct DML — `complete_purchase()` is the only path
  that can write to `ticket_purchases`.
- Visibility helpers live in a `private` schema so public policies can inspect moderation
  state without exposing contact details.
- Guest contact details are retrieved through a scoped function rather than an open read
  against `profiles`.
- Storage buckets have MIME allowlists, size caps, and user-ID path prefixes; verification
  documents use short-lived signed URLs.

`packages/supabase/verify-migrations.sql` is a five-check pass/fail gate asserting the above.
Run it after applying migrations.

### Reservations and ticket holds are correct under concurrency

Both flows take a row lock before checking capacity:

```sql
select ... from booking_configs where branch_id = ... for update;
```

Reservation capacity raises a specific error for a paused branch, an oversized party, an
unconfigured branch, or a full slot. Ticket holds decrement `remaining_quantity` under
lock, and `release_ticket_hold()` restores inventory if the purchase fails.

---

## Maps

**No paid map API, and no API key required.**

| Capability | Implementation |
|---|---|
| Map rendering | Leaflet 1.9 with OpenStreetMap raster tiles, custom markers, route polyline |
| Address autocomplete | Nominatim, proxied server-side with a 60s cache and an Addis-biasing viewbox |
| Routing and distance | OSRM, proxied server-side, with a Haversine fallback surfaced in the UI |
| Turn-by-turn | Deep link out to Google Maps Directions |

Both upstream services are overridable via `OSRM_BASE_URL` and `NOMINATIM_BASE_URL`, so they
can be self-hosted.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS 3.4, custom design-token layer, light/dark themes |
| Data | Supabase Postgres, `@supabase/ssr`, 24 SQL migrations, PL/pgSQL |
| Auth | Supabase Auth — email/password and Google OAuth, three signup flows |
| Maps | Leaflet, OpenStreetMap, Nominatim, OSRM |
| Validation | Zod |
| Jobs | `pg_cron` for hold expiry and daily reminders |
| Menu import | `tesseract.js` OCR |
| Observability | Sentry |
| Monorepo | Turborepo, pnpm workspaces |
| CI | GitHub Actions |

---

## Getting started

**Prerequisites:** Node 22, Docker.

```bash
npm install
```

Start local infrastructure. Note that Postgres is published on **port 5433**, not 5432.

```bash
docker compose up -d postgres redis
```

Create your env files:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

`DATABASE_URL` must match the compose file:

```
DATABASE_URL=postgresql://foodride:foodride_dev@localhost:5433/foodride?schema=public
```

Generate the Prisma client and apply the Supabase schema:

```bash
npm run db:generate
npm run supabase:apply
```

`supabase:apply` regenerates the migration bundle from the individual SQL files (with a
sha256 manifest) and then applies it, so it stays in sync by construction.

Run the web app:

```bash
npm run dev --workspace=@urbanexplore/web
```

Open <http://localhost:3000>.

> **Note:** the seed scripts insert businesses with a `NULL` owner, and the visibility RLS
> policy requires a matching profile — so a fresh clone renders an empty catalogue until
> seeded rows are assigned an owner. This is expected, not a bug.

### `apps/backend`

The NestJS service is **frozen and not used in production.** It contains 28 endpoints across
6 controllers, but its Prisma schema has diverged from Supabase, its Redis service is an
in-memory `Map` shim, and it maintains a parallel user system. The web app does not call it.
See [`apps/backend/README.md`](apps/backend/README.md), which documents this honestly.

---

## Testing and CI

`.github/workflows/ci.yml` runs on every pull request:

| Job | What it does |
|---|---|
| `gitleaks` | Secret scanning across the repo |
| `web` | `tsc --noEmit`, `next lint`, full production build |
| `web-unit` | Vitest |
| `web-e2e` | Playwright against a production build |
| `mobile` | TypeScript check |
| `backend` | Lint and tests with real Postgres and Redis service containers |

Unit tests currently cover pure functions — rate limiting, fare maths, validation, site
metadata. There are no tests that exercise a real database or booking flow; the Playwright
suite covers UI behaviour.

---

## Project status

**Production-shaped**

- The full reservation and ticketing flows work end to end, including concurrent-capacity
  handling and hold expiry.
- The RLS posture is thorough and has been hardened against identity forgery, policy
  recursion, and INSERT-policy edge cases across four separate migration revisions.
- Auth covers three signup paths, OAuth with a client-side PKCE exchange, middleware-level
  role gating, and suspension handling.
- 55 route pages across four role surfaces, 27 server actions, all Zod-validated and
  rate-limited.
- SEO is complete — sitemap, robots, manifest, and canonical/OG metadata on all three
  dynamic detail routes.

**Not built**

- **No payment integration.** There is no Stripe, Telebirr, Chapa, or M-Pesa. Ticket
  purchases are written with `payment_status = 'paid'` as a placeholder, and the reservation
  flow is explicitly "no prepayment required". **No money moves.** This is the single
  largest gap.
- **No hotels.** The product covers restaurants, events, and rides only.
- **The ride feature is a fare estimator**, not a booking system. There is one provider
  ("Meter Taxi") priced by three distance-based tiers, and the result hands off to
  Google Maps for navigation.
- **Not PostGIS.** Plain `double precision` lat/lng columns with B-tree indexes. Geospatial
  work is Haversine in TypeScript and OSRM for routing.
- **Search is client-side**, filtering the fetched catalogue in memory. `pg_trgm` is installed
  but unused.
- **No reviews or ratings.** The rating column is seeded, not computed.
- **The mobile app is not connected** to the live data layer — it targets the frozen NestJS
  backend and the abandoned Prisma schema.
- **Partner payouts are collected but never read.** Bank details are stored in user metadata
  and nothing consumes them.

### Known sharp edges

- Deploy target was mid-migration between Vercel and Netlify; [`DEPLOYMENT.md`](DEPLOYMENT.md)
  still describes the two-instance Vercel setup. The live app is on Netlify.
- `packages/supabase/apply.sql` is stale and labelled as such. Use
  `apply-all-migrations.sql`, or regenerate it with `scripts/build-supabase-apply.mjs`.
- The `supabase:check` drift guard exists as an npm script but is not wired into CI.
- `packages/database/src/geo.ts` queries a `location` column that does not exist. Nothing
  imports it.

---

Built by [Edilu Densemo Tafesse](https://github.com/ezzy1231)
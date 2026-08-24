# UrbanExplore Web App — Memory & Progress Log

## Project Overview

**Monorepo:** `@urbanexplore/*` (Turborepo, 9 packages)
**Web app:** `apps/web` (`@urbanexplore/web`) — Next.js 14 + React 18 + TypeScript
**Backend:** `apps/backend` (`@urbanexplore/backend`) — NestJS 10 + Prisma 5 + PostGIS
**Styling:** Tailwind CSS v3 + CSS custom properties
**Auth:** Supabase (SSR) via `@supabase/ssr`
**Database:** PostgreSQL with PostGIS via Prisma ORM
**Cache:** Redis (ioredis) for ticket holds, reservation locks, ride estimate caching
**Build status:** ✅ Web — 28 pages, 0 errors | ✅ Backend — compiles to dist/

---

## Source & Setup

- **Source (original):** `C:\Users\edilu\Downloads\Telegram Desktop\urbanexplore-website V1\urbanexplore-website V1\urbanexplore-app`
- **Destination:** `C:\Users\edilu\Documents\Afomii\apps\web`
- **Path alias:** `@/*` maps to `apps/web/*`
- **Env:** `apps/web/.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`
- **Root env:** `.env` with `DATABASE_URL`, `REDIS_URL`, `JWT_*`, `SUPABASE_JWT_SECRET`, `PORT`
- **Icon fix:** `House` → `Home` (lucide-react v0.378)
- **React 18 fix:** `useActionState` → `useState` + `useTransition`

---

## Color Theme

### Brand Colors
- **Navy:** `#0B1F3A` (headings, primary buttons, brand)
- **Gold:** `#C2A878` (accents, badges, hover states)
- **Ivory:** `#F8F5F0` (text in dark mode)

### CSS Variables (`globals.css`)
Light/dark mode via `[data-theme]` attribute on `<html>`. Theme stored in localStorage key `urbanexplore-theme`.

---

## Routes & Pages (28 total)

### Public Pages (7)
| Route | File | Features |
|---|---|---|
| `/` | `app/page.tsx` | Hero, How-it-works, 3-pillar grid, Business CTA |
| `/restaurants` | `app/restaurants/page.tsx` | `ExploreCatalogue` — searches NestJS `/partners/restaurants`, fallback sample data |
| `/restaurants/[id]` | `app/restaurants/[id]/page.tsx` | SSR fetch from NestJS backend |
| `/events` | `app/events/page.tsx` | `ExploreCatalogue` — searches NestJS `/events`, fallback sample data |
| `/events/[id]` | `app/events/[id]/page.tsx` | SSR fetch from NestJS backend |
| `/ride` | `app/ride/page.tsx` | `RidePlanner` with provider comparison |
| `/about`, `/privacy`, `/terms` | `app/*/page.tsx` | `InfoPage` component |

### Auth Pages (7)
| Route | Key Details |
|---|---|
| `/auth/role` | 3-role picker (Explorer, Food Business, Event Organizer) |
| `/auth/signin` | Email/password + Google OAuth |
| `/auth/signup/user` | 3-step signup (basics → profile → dietary/allergy) |
| `/auth/signup/business` | 4-step signup (account → business → location → plan) |
| `/auth/signup/organizer` | 4-step signup (account → org → location → plan) |
| `/auth/forgot-password` | Email input + reset link |
| `/auth/callback` | Supabase OAuth — creates business/organizer records in Supabase |

### Dashboard Pages (12)
| Route | Features |
|---|---|
| `/dashboard/restaurant` | Metric cards, listing form, listing grid |
| `/dashboard/restaurant/reservations` | `ReservationCalendarGrid` with Supabase data |
| `/dashboard/restaurant/menu` | Add/toggle menu items |
| `/dashboard/restaurant/analytics` | `MetricCard` stats, revenue, popular items |
| `/dashboard/organizer` | Metric cards, event form, event grid |
| `/dashboard/organizer/tickets` | `TicketTierManager` with CRUD |
| `/dashboard/organizer/events` | List/draft management |
| `/dashboard/organizer/calendar` | Date-grouped events |
| `/dashboard/organizer/analytics` | `MetricCard` stats, ticket sales |
| `/dashboard/admin` | Platform-wide stats + quick actions |

### App Pages (2)
| Route | Features |
|---|---|
| `/settings` | Profile info, account, sign-out |
| `/not-found` | Gold-accented 404 page |

---

## Auth Flow

1. **Sign Up:** Multi-step form → `supabase.auth.signUp()` with role + metadata
2. **Email Confirmation:** Link → `/auth/callback` → creates Supabase rows → redirects to dashboard
3. **Middleware:** Protects `/dashboard/*`, `/settings/*` — checks Supabase session, validates role (`food_business` → restaurant, `event_organizer` → organizer, `system_admin` → admin)
4. **Backend auth guard:** Validates NestJS JWT first, falls back to Supabase JWT validation via `SUPABASE_JWT_SECRET`; auto-creates local `User` row on first Supabase JWT login

---

## Backend Architecture (`apps/backend`)

### Common Layer
- **PrismaService** — wraps PrismaClient (auto-connect/disconnect)
- **RedisService** — ioredis client with set/get/del/lock primitives (acquireLock, releaseLock)
- **AuthGuard** — JWT validation (NestJS first, Supabase fallback), `@Public()` decorator support
- **RolesGuard** — `@Roles()` decorator for role-based access
- **CurrentUser** — param decorator to extract user from request

### Modules (6 total, all fully implemented)
| Module | Key Endpoints | Features |
|---|---|---|
| **Auth** | `POST /auth/signup`, `/login`, `/refresh`, `/logout` | Argon2 hashing, Redis refresh token storage, JWT access/refresh |
| **Users** | `GET /users/profile`, `PATCH /users/profile`, `POST /users/preferences` | Profile CRUD, dietary/allergy preferences |
| **Partners** | `GET /partners/restaurants`, `POST /business/register`, `POST /business/branches`, `POST /organizer/register`, `GET /business/:id/dashboard`, `GET /branches/:branchId/reservations`, `PATCH /reservations/:id/status` | Restaurant/organizer registration, branch management, reservation management |
| **Reservations** | `POST /reservations/check-availability`, `POST /reservations` | Table availability check, Redis-locked reservation creation with `$transaction` |
| **Events** | `GET /events`, `GET /events/:id`, `POST /events`, `POST /:eventId/ticket-types`, `POST /:eventId/tickets/hold`, `POST /:eventId/tickets/checkout`, `POST /webhooks/tickets/hold-expired` | Event CRUD, ticket type management, Redis-based ticket holds + checkout with QR code, expired hold cleanup |
| **Rides** | `POST /rides/estimate`, `POST /rides/dispatch-link` | Multi-provider ride aggregation (MockProviderAdapter), Redis caching, deep-link generation |

### Shared Schemas (`packages/shared`)
- 15 Zod schemas (SignupSchema, LoginSchema, BusinessRegisterSchema, BranchRegisterSchema, etc.)
- All used by both frontend and backend for consistent validation

### Database (`packages/database`)
- Prisma schema: 10 models (User, UserPreferences, BusinessProfile, BusinessBranch, BookingConfig, MenuItem, Event, TicketType, Reservation, TicketPurchase, RideSearchLog)
- PostGIS extension for geospatial queries
- Prisma client generated to `node_modules/@prisma/client`

---

## Frontend API Layer

- **`lib/api.ts`** — Generic `apiRequest<T>()` wrapper around `fetch` with Bearer token from Zustand auth store
- **`lib/catalogue.ts`** — `getRestaurantCatalogue()` and `getEventCatalogue()` fetching from NestJS, falling back to sample data
- **`hooks/use-api.ts`** — React Query hooks: `useDashboard()`, `useReservations()`, `useUpdateReservationStatus()`, `useCheckAvailability()`
- **`stores/auth-store.ts`** — Zustand store: `token`, `refreshToken`, `role`
- **API base URL:** `http://localhost:4000/api/v1`

---

## Components

### Layout
- `Navbar` — Fixed top, glass effect, desktop links + mobile menu + ThemeToggle
- `Footer` — 4-column grid, newsletter, social, copyright
- `MobileNavigation` — Fixed bottom, gold active, 5 tabs
- `Sidebar` — Navy sidebar (`bg-navy text-ivory`), nav items with gold active state, user profile bottom

### Feature
- `ExploreCatalogue` — Search + filter + cards (restaurants/events)
- `RidePlanner` — Pickup/destination swap, provider comparison cards
- `PartnerDashboard` — Dashboard shell with metrics
- `InfoPage` — Generic legal/info layout

### Dashboard
- `MetricCard` — Stat card with trend indicator
- `ReservationCalendarGrid` — Date-grouped reservations with accept/decline
- `TicketTierManager` — Dynamic ticket tier CRUD
- `RestaurantListingForm` / `EventListingForm` — Server-action forms

### UI (Tailwind hardcoded classes)
- `Button` — Variants: primary (`bg-navy text-ivory`), accent, outline, ghost (`text-gray-500 hover:bg-gray-100`), danger
- `Input` — `bg-white dark:bg-navy-800` with gold focus ring
- `Select` — `bg-white dark:bg-navy-800` with gold focus ring
- `Card` — `bg-white` with border-gray-100
- `Badge` — Variants: gold, green, red, outline

---

## Middleware (`apps/web/middleware.ts`)

Protects `/dashboard/*` and `/settings/*`:
- Checks Supabase session → redirects to `/auth/signin` if no user
- Role-based access:
  - `/dashboard/restaurant/*` → must be `food_business`
  - `/dashboard/organizer/*` → must be `event_organizer`
  - `/dashboard/admin/*` → must be `system_admin`
- Falls back to `/` if wrong role

---

## Known Limitations / Next Steps

### Progress log (updated 2026-08-24)

**Committed:**
- Phase 1 (Supabase foundation) + Phase 5 (restaurant ops) — earlier commits
- Phase 6 ticketing: `app/events/actions.ts` purchase flow (hold_ticket RPC), consumer tickets in settings, organizer publish toggle + real metrics
- UI redesign per `stitch_responsive_page_design/` + `UI_PLAN.md`: light-first theme (dark via toggle), navy navbar/footer, rebuilt home/restaurants/events/details/ride, token layer with RGB vars in globals.css
- Auth Slice 3: CategoryPicker radio screens (business 13 / organizer 11 categories), full dietary (16) + allergy (11) checklists, EC/GC birth calendar, country field
- Real Addis Ababa seed: `packages/supabase/seed-places.sql` (12 venues, run in Supabase SQL editor — NOT yet run), photos in `apps/web/public/places/`
- `/vision` mockup gallery page
- Slice 5: organizer public profile `/organizers/[id]` built (`OrganizerProfile.tsx`, date-ribbon signature; `getOrganizerDetail` in queries.ts with fallback samples `sample-organizer` / `addis-nightlife-collective`; live path uses real columns id/name/description/is_verified + subscription-count followers)
- Ticket tier CRUD now persists: server actions `saveTicketTier`/`deleteTicketTier` in `app/dashboard/organizer/tickets/actions.ts` (ownership checks via events.organizer_id, sold-count preserved on resize, tiers with sales can't be deleted); page is a server component loading real events+tiers; client `tiers-manager.tsx`
- Hold-release bug FIXED: purchase failure path calls new `release_ticket_hold(p_hold_id, p_user_id)` RPC (migration 0006) restoring inventory atomically; success marks hold 'completed' instead of deleting
- Migration `0006_hold_release_and_cron.sql`: release_ticket_hold RPC + pg_cron schedule ('*/5 * * * *') for release_expired_holds() — NEEDS RUNNING in Supabase SQL editor

**Known issues / TODO next session:**
1. Run `packages/supabase/seed-places.sql` AND `migrations/0006_hold_release_and_cron.sql` in Supabase SQL editor
2. Google Maps API key in `.env.local` is referrer-restricted; server-side Places fetch needs a separate key (`scripts/fetch-places.mjs` ready)
3. Final QA pass partially done (touch targets ≥44px, reduced-motion respected, build clean incl. `/organizers/[id]` and `/dashboard/organizer/tickets`); remaining: Lighthouse mobile pass, full 320px–1440px visual sweep
4. Redis/NestJS retained for future trusted ops only

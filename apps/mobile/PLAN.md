# FoodRide Mobile — Master Plan (Android & iOS)

> React Native + Expo · Dev preview via **Expo Go** · Release via **EAS Build**
>
> This is the **index**. Detailed, task-level specs live in `docs/plan/`:
>
| Doc | Contents |
|---|---|
| [`docs/plan/01-backend-spec.md`](../../docs/plan/01-backend-spec.md) | Every backend epic/task with API contracts, Redis key design, migrations, tests |
| [`docs/plan/02-mobile-spec.md`](../../docs/plan/02-mobile-spec.md) | App structure, route table, design system, screen-by-screen specs, state layer |
| [`docs/plan/03-delivery-and-release.md`](../../docs/plan/03-delivery-and-release.md) | Workflow conventions, DoD, CI/CD, EAS profiles, store launch checklist |
| [`docs/plan/04-dev-environment-and-loop.md`](../../docs/plan/04-dev-environment-and-loop.md) | Install requirements for autonomous build/test loop + how the agent verifies UI & functionality |

---

## 1. Product summary & v1 scope

**FoodRide** unifies three domains in one customer app:

1. **Table reservations** — discover restaurants, pick a branch/date/slot, book, track status.
2. **Event ticketing** — browse events, hold inventory (10-min TTL), checkout, QR ticket wallet.
3. **Ride aggregation** — compare partner estimates (Uber/Yango/Lyft/feres adapters) and hand off to the provider app.

| In v1 (customer app) | Out of v1 |
|---|---|
| Auth (email or phone + password) | Partner/admin dashboards on mobile (stay web-first) |
| Restaurant discovery + map, menus | Social features / reviews / favorites* |
| Full booking flow incl. REQUEST_BASED pending state | Offline-first sync |
| My reservations + cancellation | Chat / support inbox |
| Events + tiered ticketing + QR wallet | In-app payments UI beyond the checkout hook* |
| Ride estimates + dispatch deep links | Marketing push campaigns* |
| Profile, dietary/allergy preferences | |

\* Payments and push are *infrastructure-planned* (Epics BE-6, BE-5) but their full UX ships right after v1 unless decided otherwise (see §8).

---

## 2. System architecture

```
┌────────────────────────── npm-workspaces monorepo ──────────────────────────┐
│                                                                             │
│   apps/mobile (Expo SDK 53+, expo-router, NativeWind)                        │
│   Expo Go on device ◄── metro dev server ──► EXPO_PUBLIC_API_URL             │
│        │                                        │                           │
│        │ reads @urbanexplore/shared             ▼                           │
│        │  (zod schemas + types)      apps/backend NestJS :4000 /api/v1       │
│        │                             AuthGuard/RolesGuard · Throttler        │
│        │                                        │                           │
│  apps/web (Next.js dashboards)          ┌──────┴───────┐                   │
│                                         ▼              ▼                   │
│                                 Postgres+PostGIS     Redis 7               │
│                                 (docker-compose)     locks · holds ·       │
│                                                      refresh tokens         │
└─────────────────────────────────────────────────────────────────────────────┘
```

Principle: **the shared package is the contract.** Mobile imports the same zod schemas the API validates with — no drift.

---

## 3. Technology decisions

### Mobile frontend

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | Expo SDK 53 (React Native 0.79+) | Latest stable; first-class monorepo autodetect |
| Navigation | expo-router v4 (typed routes) | File-based like web App Router; deep links free; already implied by stub `main` |
| Styling | NativeWind v4 | Reuse web Tailwind vocabulary; brand tokens compile to RN styles |
| Server cache | TanStack Query v5 | Parity with web `hooks/use-api.ts`; retries, invalidation |
| Client state | Zustand | Parity with web `stores/auth-store.ts` |
| HTTP | axios + interceptor pair | Silent `/auth/refresh`, single-flight refresh queue |
| Secure storage | expo-secure-store | Keychain/Keystore; included in Expo Go |
| Maps | react-native-maps | Ships in Expo Go (Apple Maps iOS / Google Android) |
| Images | expo-image | Disk caching + placeholders for cover/menu images |
| QR render | react-native-qrcode-svg | Pure JS + svg (both Expo-Go safe); renders stored `qrCodeHash` |
| Dates | date-fns (+ tz-safe ISO strings from API) | Slot grids, countdowns |
| i18n | expo-localization + simple JSON catalogs | `User.language` exists; scaffold from day one |

### Backend additions (detailed in 01-backend-spec)

| Concern | Choice |
|---|---|
| Validation wiring | Single `ZodValidationPipe` over `@urbanexplore/shared` schemas (replaces ad-hoc `.parse()` calls scattered in controllers) |
| Rate limiting | `@nestjs/throttler` (global 100/min; auth 10/min; holds 30/min) |
| Security headers | helmet |
| Scheduling | `@nestjs/schedule` (hold reconciliation sweep, event reminders) |
| Notifications | expo-server-sdk fan-out service (Epic BE-5) |
| Payments | Stripe PaymentIntents behind existing `requirePrepayment` flag (Epic BE-6, gated on decision) |

---

## 4. Code-audit findings folded into this plan

Found while reading the current services/controllers — each is a tracked task, not folklore:

| # | Finding | Where | Fix task |
|---|---|---|---|
| A1 | `addBranch` silently drops `latitude`, `longitude`, `openingHours`, cuisine/highlights — geo data never persisted | `partners.service.ts` | BE-2.4 |
| A2 | Availability check counts reservations for the whole **day**, but creation counts per **slot** → wrong availability shown | `reservations.service.ts` | BE-1.3 |
| A3 | Ride search logs use hardcoded zero-UUID user (FK violation swallowed by try/catch) and routes are fully anonymous | `rides.service.ts`, `rides.controller.ts` | BE-4.1 |
| A4 | `GET /events/:id` returns DRAFT events to anyone and leaks organizer email | `events.controller.ts` / service | BE-3.5 |
| A5 | Expired-hold sweeper scans keys with `ttl <= 0` — Redis already deleted them, so stock is never restored on expiry path | `events.service.ts` | BE-3.3 |
| A6 | Signup returns tokens only; login returns `{tokens, user}` — inconsistent envelope hurts onboarding UX | `auth.service.ts` | BE-0.5 |
| A7 | No pagination convention (`take: 50` hardcoded), no rate limiting, no security headers, no health endpoint | global | BE-0.x |
| A8 | Zod schemas exist in shared but only some controllers parse bodies through them | controllers | BE-0.2 |

---

## 5. Epic map (progressive order — later epics depend only on earlier ones)

| Epic | Title | Phase | Depends on | Spec |
|---|---|---|---|---|
| INF-1 | Mobile scaffold: Expo SDK 53 + monorepo Metro/tsconfig/eslint + env + CI typecheck | M0 | — | 02 §2 |
| BE-0 | Platform hardening: error envelope, ZodValidationPipe everywhere, throttle, helmet, health, seed script | M0–M1 | — | 01 §Epic BE-0 |
| FE-1 | Design system + navigation shell + theme (light/dark) | M0 | INF-1 | 02 §4–5 |
| FE-2 | Auth: api client w/ refresh queue, welcome/sign-in/sign-up, profile & preferences screens | M1 | FE-1, BE-0.5 | 02 §6 screens 1–3, 14–17 |
| BE-1 | Customer reservation APIs: mine, cancel, per-slot availability | M2 | BE-0 | 01 §Epic BE-1 |
| BE-2 | Discovery APIs: restaurant detail, geo ordering, filters; branch geo fix | M2 | BE-0 | 01 §Epic BE-2 |
| FE-3 | Discovery + booking flow (restaurant list/map/detail, slot grid, confirmation, my reservations) | M2 | FE-2, BE-1, BE-2 | 02 §6 screens 4–8 |
| BE-3 | Ticketing completion: tickets/mine, hold reconciliation, idempotent checkout, public-detail guard | M3 | BE-0 | 01 §Epic BE-3 |
| FE-4 | Events + ticket wallet (tier select, TTL countdown, checkout, QR) | M3 | FE-2, BE-3 | 02 §6 screens 9–12 |
| BE-4 | Rides fixes: auth-aware logging, selection persistence, provider registry | M4 | BE-0 | 01 §Epic BE-4 |
| FE-5 | Rides UX (location pickers, estimates, dispatch handoff) | M4 | FE-2, BE-4 | 02 §6 screen 13 |
| FE-6 | Polish: skeletons, empty/error states, offline banner, i18n catalog, a11y pass | M4 | FE-3..5 | 02 §7 |
| QA-1 | Maestro E2E suite: auth / book-table / buy-ticket happy paths + hold-expiry | M4 | FE-3..5 | 03 §Testing |
| INF-2 | EAS Build dev clients, EAS Update channels, Sentry | M5 | INF-1 | 03 §CI/CD |
| BE-5 | Push infrastructure: DeviceToken model, register endpoints, fan-out service, crons | M5 | BE-0 | 01 §Epic BE-5 |
| FE-7 | Push integration + notification tap routing + permissions copy | M5 | INF-2, BE-5 | 02 §7 |
| BE-6 \| FE-8 | Stripe payments behind `requirePrepayment` (gated on decision Q1) | post-M5 | BE-3.4 | 01 §Epic BE-6 |
| REL-1 | Store submission: assets, privacy labels, TestFlight + Play internal → phased rollout | M5 | all above | 03 §Launch |

---

## 6. Milestones & exit criteria

| Milestone | Weeks (1 senior dev) | Exit criteria (demo-able on a real phone in Expo Go) |
|---|---|---|
| **M0 Foundation** | 1 | Scanning the QR shows themed tabs on Android + iOS; CI green on lint+typecheck; seeded demo data loads |
| **M1 Accounts** | 2–3 | Sign-up → onboard → kill app → reopen still signed in; expired access token self-heals via refresh; preferences persist |
| **M2 Book a table** | 4–5 | Search → branch → slot grid → booked code visible in web partner dashboard; concurrent double-book rejected; cancel works |
| **M3 Buy a ticket** | 6–7 | Two devices race for last VIP seat: exactly one winner; loser sees clean sold-out/expired path; QR wallet renders |
| **M4 Rides + polish** | 8 | Estimate list <1s perceived, dispatch opens provider app; airplane-mode cold start degrades gracefully; Maestro suite green |
| **M5 Store-ready** | 9–10 | CI builds land in TestFlight + Play internal track; crash-free >99% soak; push received on both platforms |

---

## 7. Daily dev loop (Expo Go progress viewing)

```bash
# terminal 1 — infra
docker compose up -d                # postgres+postgis :5432, redis :6379
# terminal 2 — API
cd apps/backend && npm run start:dev   # :4000 /api/v1
# terminal 3 — mobile
cd apps/mobile && npx expo start    # scan QR with Expo Go
```

- `apps/mobile/.env.local`: `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:4000/api/v1` — never localhost (phone fetches over Wi-Fi). Allow Node through Windows firewall on first run; if Wi-Fi isolates clients, `npx expo start --tunnel`.
- Seed once for realistic demos: `npm run db:seed` (delivered by BE-0.6).
- Honest limit: Expo Go is the development viewer only. Release builds, OTA updates and remote push require EAS dev-client builds (INF-2) — standard practice, zero rework of app code.

---

## 8. Open decisions (blockers only where noted)

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| Q1 | Payment provider + markets/currencies | BE-6 / FE-8 (post-M5) | Stripe; defer entirely |
| Q2 | Map style: default Apple/Google vs Mapbox | FE-3 styling only | react-native-maps defaults |
| Q3 | Languages beyond English at launch? | FE-6 catalog depth | English-only, i18n scaffold ready |
| Q4 | Push: transactional-only or +marketing? | BE-5 scope | transactional-only |

## 9. Top risks

| Risk | Mitigation |
|---|---|
| Phone↔API connectivity (firewall/Wi-Fi isolation) | LAN-IP config documented; tunnel fallback; smoke screen in M0 proves it early |
| Monorepo Metro resolution breaks on SDK upgrades | Versions pinned by create-expo-app merge; upgrade smoke test scripted |
| Hold-TTL confusion (paying after expiry) | Countdown ring + server-authoritative state machine before any payment step; HOLD_EXPIRED recovery modal (02 §7) |
| Store rejection: sensitive data handling | Privacy labels drafted in REL-1 (dietary prefs = sensitive); location permission rationale copy |
| Scope creep into partner mobile | Explicit non-goal; revisit with post-launch usage data |
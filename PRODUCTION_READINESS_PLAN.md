# FoodRide / UrbanExplore — Production Readiness Plan

> Audit date: based on full repository review (web, backend, Supabase SQL, Prisma, shared packages, env & CI state).
> Companion documents: `IMPLEMENTATION_PLAN.md` (product phases), `UI_PLAN.md` (design system).

---

## 1. Where the project actually is today

**Stack reality (verified in code):**

| Area | State |
| --- | --- |
| Web (`apps/web`) | Next.js 14 App Router + Tailwind + `@supabase/ssr`. Reads/writes **Supabase directly** (queries in `lib/supabase/queries.ts`, mutations via Server Actions). Deploys to Netlify per `IMPLEMENTATION_PLAN.md`. |
| Backend (`apps/backend`) | NestJS + Prisma pointed at a **separate local Postgres** (`docker-compose.yml`) with a **divergent schema** (`packages/database/prisma/schema.prisma`: `User`, `BusinessProfile`, …) that does not match the Supabase schema (`profiles`, `businesses` with `owner_id`, …). |
| "Redis" (`apps/backend/src/common/redis/redis.service.ts`) | **Not Redis.** It's an in-memory `Map` shim. `ioredis` is in `package.json` but never used. All backend locks/caches/refresh-tokens/ticket-holds are per-process and lost on restart — and meaningless on serverless. |
| Database of record | Supabase SQL migrations (`packages/supabase/migrations/0001–0006` + `apply.sql`) with RLS, RPCs (`reserve_table`, `hold_ticket`, `release_expired_holds`) and pg_cron for hold expiry. This matches the architecture decision in `IMPLEMENTATION_PLAN.md`: *Supabase is the single source of truth; NestJS only for trusted server-side work; Prisma is a migration reference.* |
| Tests | **Zero** project tests (no test files outside `node_modules`). |
| CI/CD | **No `.github/` workflows at all.** |
| Secrets | `.env` and `apps/web/.env.local` are git-ignored (good) but contain live-looking secrets: Supabase JWT secret, Google Maps key (also broken inline in `.env.local` line 6 — a missing newline merges a comment into the key value). |

**Bottom line:** the consumer site is close to shippable *if* a short list of security holes and broken write paths are fixed first, the sample-data fallbacks are removed from production paths, and CI/observability are added. The NestJS backend should be deliberately frozen/re-scoped rather than "made production-ready" as a second source of truth.

---

## 2. P0 findings — must fix before any production traffic

These are verified, specific defects:

1. **Anonymous users can forge identity through RPCs.**
   `reserve_table(p_branch_id, p_reservation_date, p_time_slot, p_guest_count, p_user_id)` and `hold_ticket(..., p_user_id)` are `SECURITY DEFINER` (bypass RLS) and are granted to **`anon`** (`0005_rpcs.sql` lines 116–118). Anyone unauthenticated can call them with an arbitrary `p_user_id`.
   → Revoke from `anon`; derive the user inside the function from `auth.uid()` instead of taking it as a parameter.

2. **Ticket purchase flow leaks inventory and mints forgeable tickets.**
   - `apps/web/app/events/actions.ts` inserts into `ticket_purchases` directly with a client-chosen `payment_status` (`'paid'`) → any authenticated user can self-insert paid purchases without going through inventory.
   - The failure path calls RPC **`release_ticket_hold`** (it *does* exist in `0006_hold_release_and_cron.sql`) but that RPC accepts a caller-supplied `p_user_id` and is granted to **`anon`** — same identity-forgery class as the other RPCs.
   - `qr_code` is generated from `user.id.slice(0,8) + Date.now()` in the action → guessable/fakeable at the door.
   → Create one `complete_purchase(p_hold_id)` SECURITY DEFINER RPC (validates hold ownership/status, prices from DB, generates server-side random QR code, closes hold) and **revoke direct insert/update** on `ticket_purchases`; re-issue all three ticket RPCs with `auth.uid()`-derived identity. *(Done in migration 0007.)*

3. **Partner onboarding writes to columns that don't exist.**
   `app/auth/callback/route.ts` inserts into `businesses` (`slug`, `category`, `address`, `city`, `country`, `phone`, `website`, `plan`) and `organizers` (`org_name`, plus similar) — none of these columns exist in `0002_core_tables.sql` → every food-business/organizer OAuth/email-callback signup fails or silently misbehaves. Same class of bug in `dashboard/actions.ts` `audit_logs` insert (`entity_type`, `metadata` vs actual `entity`; and there is **no insert policy** on `audit_logs` at all).
   → Add migration `0007` adding the missing columns (or fix the code), add an `audit_logs_insert` policy (actor-only) or move audit writes into RPCs.

4. **Sample data served as fallback in production.**
   `lib/supabase/queries.ts` returns hardcoded fake restaurants/events/menus (`buildSampleRestaurantDetail`, `buildSampleEventDetail`, `fallbackOrganizers`) whenever Supabase errors or a row is missing. `IMPLEMENTATION_PLAN.md` Phase 3 explicitly forbids this ("No production page silently falls back"). Fake menus/prices on real listings = trust and legal risk.
   → Remove fallbacks behind `NODE_ENV === 'development'`; render explicit empty/error states.

5. **Secret hygiene.**
   Rotate the Supabase JWT secret and Google Maps key found in `.env` / `.env.local`; fix the merged-line Maps key; adopt `apps/web/.env.example` as canonical. Move backend JWT verification off the shared HS256 secret (see §4).

6. **Backend authorization is role-only, not ownership-based.**
   With `AuthGuard`+`RolesGuard` registered globally (`auth.module.ts`), any `RESTAURANT_ADMIN` can call `PATCH /partners/reservations/:id/status`, read any branch's reservations, or update any reservation (`partners.service.ts` has no owner checks); `createEvent`/`createTicketType` accept raw `any` bodies (no zod/class-validator). CORS is `origin: true, credentials: true` (reflects every origin).
   → Apply the fixes in §4 or don't deploy the backend at all (recommended initially — nothing in the web app depends on it).

---

## 3. Frontend Production Plan (`apps/web`)

### F1 — Data correctness & honesty (P0) ✅ **done**
- [x] Remove/gate all sample-data fallbacks (`lib/supabase/queries.ts`, `lib/catalogue.ts`) to dev-only; add real empty states (`components/patterns/EmptyState.tsx` already exists).
- [x] Fix auth callback column mismatches (P0 #3) and make business/organizer provisioning idempotent (existing-row check keyed on `owner_id`).
- [x] Replace ticket purchase flow with the server-side RPC (`complete_purchase`); deleted client-side QR generation.
- [x] Stop swallowing errors in Server Actions: every failure path logs via `logActionError()` (`lib/validation.ts`) with an `[action:*]` prefix; audit-log insert failures logged too.
- [x] Zod-validate every Server Action input (`apps/web/lib/validation.ts`: listings, branches, booking config, opening hours, reservations, purchases, ticket tiers, uuid/status enums).

### F2 — Rendering, SEO & metadata (P1)
- [ ] Add `generateMetadata` (+ OpenGraph/Twitter cards, canonical URLs) to `/restaurants/[id]`, `/events/[id]`, `/organizers/[id]`, and static pages. Only root `layout.tsx` has metadata today.
- [ ] Add `app/sitemap.ts`, `app/robots.ts`, `manifest.ts` (none exist).
- [ ] Keep public catalogue pages server-rendered (home page already is); convert `/events`, `/restaurants` listing wrappers to stream server data into `ExploreCatalogue` instead of client-side fetching where feasible.
- [ ] Set `metadataBase`, favicons/app icons, and OG default image.

### F3 — Performance (P1)
- [ ] Code-split `RidePlanner.tsx` (~26 KB) and load Google Maps **only after user intent** (dynamic `import()` on first interaction); handle missing/invalid key gracefully (it's currently broken anyway).
- [ ] Audit `ExploreCatalogue.tsx` (~26 KB) — memoize filters, virtualize if lists grow.
- [ ] Use `next/image` consistently for cover images; add `images.remotePatterns` in `next.config.js` for Supabase Storage domains.
- [ ] Define caching: `revalidate` / ISR for public catalogue and detail pages; keep dashboards dynamic.
- [ ] Add security headers in `next.config.js` (CSP scoped to Supabase + Maps, HSTS, X-Frame-Options DENY, Referrer-Policy) and `poweredByHeader: false`.

### F4 — Auth UX & sessions (P1)
- [ ] Middleware (`middleware.ts`) correctly guards `/dashboard` + `/settings` and role-routes by `profiles.role` — keep, but add: session error handling, `next` param sanitization (open-redirect check), and email-confirmation pending state.
- [ ] Handle `?error=auth_failed` on signin visibly; add password reset completion page (forgot-password form exists; verify reset→callback path end-to-end).
- [ ] Sign out must clear server session cookies everywhere (`SignOutButton` → verify scope='global').

### F5 — Observability, analytics, quality (P1–P2)
- [ ] Sentry (or equivalent) for SSR + client, with Server Action exception capture.
- [ ] Web Vitals reporting; basic privacy-friendly analytics (page views, search, booking funnel events).
- [ ] A11y pass on core flows (focus management in modals/filter sheets, labels on inputs, contrast on gold/navy tokens).
- [ ] Error boundaries already exist (`error.tsx`, `loading.tsx`, `not-found.tsx`) — add per-route `error.tsx` for dashboard sections.

### F6 — Config & deploy (P0/P1)
- [x] Security headers + `poweredByHeader: false` in `next.config.js` (nosniff, DENY framing, referrer policy, permissions policy, HSTS); `images.remotePatterns` opened for `*.supabase.co`. *(Full CSP deferred to M2 — needs testing with inline theme script + Maps.)*
- [x] Open-redirect guard on `/auth/callback?next=` (same-site relative paths only).
- [x] `apps/web/.env.example` documents deprecated `NEXT_PUBLIC_API_URL`; `lib/api.ts` throws instead of defaulting to localhost.
- [ ] `netlify.toml` or Vercel config — **blocked on hosting decision** (docs say Netlify, `output: standalone` suggests Vercel/Node host).
- [ ] Configure Supabase Auth redirect allowlist for the prod domain (Dashboard → Auth → URL Configuration).

---

## 4. Backend Production Plan (`apps/backend`)

**Strategic decision first (aligns with `IMPLEMENTATION_PLAN.md`):** the web app does not call the NestJS API on any critical path. Do **not** put the current backend into production. Choose one track:

### Track A (recommended): freeze & re-scope
- Mark `apps/backend` as internal/experimental; exclude from deploy pipelines; keep compiling via CI.
- Move its few unique responsibilities into Supabase (already mostly done): concurrency-safe writes → SQL RPCs (§2 P0 fixes), scheduled work → pg_cron (already scheduled in `0006_hold_release_and_cron.sql`), future payments/webhooks → Supabase Edge Functions or a slimmed service.
- Prune the dead weight: delete the fake `RedisService` or replace with ioredis + real instance; retire duplicate auth (`auth.service.ts` password login duplicates Supabase Auth).

### Track B: harden for limited internal use
If it must run (e.g., for admin tooling or provider integrations soon):
- [ ] **Database:** point Prisma at the same Supabase Postgres via the pooled connection string (Supavisor, port 6543) and align `schema.prisma` with the Supabase tables — today they model different worlds; alternatively drop Prisma and use `pg`/`supabase-js` server-side.
- [ ] **Auth:** replace shared-secret HS256 verification with JWKS asymmetric verification (`jose`, `https://<proj>.supabase.co/auth/v1/.well-known/jwks.json`); stop trusting `user_metadata.role` for privilege mapping (client-editable at signup) — read role from `profiles` table or `app_metadata` only.
- [ ] **Ownership authorization:** add service-level checks so partners can only touch their own businesses/branches/reservations/events (role ≠ ownership).
- [ ] **Validation:** route `createEvent`/`createTicketType` (and all `any` bodies) through zod schemas; keep ValidationPipe.
- [ ] **HTTP hardening:** `helmet`; CORS allowlist (exact origins, no reflection); body size limits; request timeouts.
- [ ] **Redis:** either remove entirely (locks are pointless single-instance) or wire real ioredis with lazy connect, retry strategy, and graceful degradation; never store refresh tokens only in memory.
- [ ] **Serverless fit:** `api/index.ts` cold-starts Nest per lambda — enable connection reuse, set `maxDuration`, avoid module-level timers (`@nestjs/schedule` won't work on Vercel; use cron/queues instead).
- [ ] **Ops:** structured logging (pino), `/health` + `/ready` endpoints, Sentry, graceful shutdown hooks (`enableShutdownHooks()`), fix `rides.service.ts` logging with a hardcoded zero UUID (FK violation/noise).
- [ ] **Tests:** jest unit tests for services with mocked Prisma; e2e smoke on the deployed URL.

---

## 5. Data layer & platform plan

### D1 — Migration `0007_security_hardening.sql` (P0) ✅ **written, needs apply to Supabase**
- [x] Revoke `anon` execute; rewrite `reserve_table` / `hold_ticket` to use `auth.uid()` internally (old `p_user_id` signatures dropped)
- [x] Add `complete_purchase(p_hold_id)` (server-generated random QR, prices from DB, closes hold) and revoke direct insert/update/delete on `ticket_purchases` from `authenticated`
- [x] Harden `release_ticket_hold` to single-arg + `auth.uid()` (was anon-callable with client-supplied user)
- [x] Restrict `profiles_select` to own row (+ admin via definer helper `actor_is_admin()`, avoiding policy recursion); add `partner_customer_contacts()` RPC for the partner inbox
- [x] Add missing columns used by the callback (`businesses`/`organizers`: slug/category/address/city/country/phone/website/plan) with unique partial indexes on `slug`
- [x] `audit_logs`: rename `entity → entity_type`, add `metadata jsonb`, actor-scoped insert policy
- [ ] **Apply 0007 to staging + prod Supabase** (`supabase db push` or SQL editor), then verify all five personas
- Note: `apply.sql` banner added — regenerate it from numbered migrations before its next use

### D2 — Environments & ops
- [ ] Two Supabase projects (staging/prod); migrations applied via `supabase db push` in CI from `packages/supabase/migrations` (single source of truth).
- [ ] Enable PITR/backups on prod; document restore drill.
- [ ] Seed policy: `seed.sql` / `seed-places.sql` only for dev/staging, never prod (check `scripts/fetch-places.mjs` key handling too).
- [ ] Rate limiting for public Server Actions (Upstash or Netlify edge middleware) since Supabase direct calls bypass the Nest throttler.
- [ ] Uptime monitoring on `/` and an API health endpoint; alerting (email/Slack).

### D3 — CI/CD (missing entirely)
GitHub Actions pipeline:
1. `npm ci` + Turborepo `lint`, `typecheck`, `build` (web + backend).
2. Unit tests (vitest): shared zod schemas, catalogue mappers, fare calculation, action-level validation.
3. Supabase job: spin local supabase CLI, apply migrations, run RLS/RPC tests (pgTAP or supabase-js integration tests) including **concurrent oversell regression** for `hold_ticket`/`reserve_table`.
4. Playwright E2E against preview deploy: signup→profile, reservation flow, ticket purchase, partner listing creation, ride estimate.
5. Secret scanning (gitleaks); require green checks before merge; auto-deploy web preview per PR, promote to prod manually.

### D4 — Cleanup (P2)
- Remove committed build artifacts (`apps/web/tsconfig.tsbuildinfo` is tracked despite `*.tsbuildinfo` ignore — untrack it), compiled `.js` twins in `packages/shared/src` and `packages/database/src`.
- Decide mobile app fate (`apps/mobile` is an empty Expo shell) — out of production scope.

---

## 6. Execution order (proposal)

| Milestone | Scope | Exit criteria |
| --- | --- | --- |
| **M0 — Security hotfix** ✅ **done** — migration applied to Supabase; secret rotation deferred by owner | §2 P0 items 1–5: migration `0007`, callback fix, purchase RPC, prod fallbacks gated to dev, `.env.local` repaired, localhost API fallback removed | No anonymous RPC abuse possible; partner signup persists; purchases can't bypass inventory; no fake data in prod paths |
| **M1 — Frontend correctness** ✅ **code complete** | F1, F6 | All server actions validated (zod) + logged; security headers on; open-redirect fixed. **Remaining: pick web host → deploy config + Supabase redirect allowlist** |
| **M2 — SEO/perf/UX polish** (week 2) | F2, F3, F4 | Metadata/sitemap/robots live; Lighthouse ≥ 90 perf on home/listing; maps optional |
| **M3 — Platform** (week 2–3, parallel) | D2, D3, backend Track A decision | CI green on PRs; staging deploy automatic; monitoring live |
| **M4 — Backend disposition** (week 3–4) | Track A retirement docs **or** Track B hardening checklist | Either removed from prod path or hardened + tested |
| **M5 — Launch rehearsal** | Full E2E on staging, backup restore drill, rate-limit soak, RLS audit with 5 personas (anon/customer/partner/organizer/admin) | Go/no-go checklist signed |

---

## 7. Launch go/no-go checklist

- [ ] Migrations apply cleanly to an empty Supabase project; RLS verified for all five personas
- [ ] Concurrent reservation + ticket-hold tests prove no oversell
- [ ] Partner & organizer onboarding completes end-to-end (callback bug fixed)
- [ ] No localhost/sample-data fallbacks anywhere in prod bundle
- [ ] Secrets rotated; none in git history; secret scanning enabled
- [ ] Sentry + uptime alerts firing to a real channel
- [ ] Backups (PITR) enabled and restore rehearsed
- [ ] Legal pages (`/privacy`, `/terms`) reviewed for real company/contact data
- [ ] Staging rehearsal passed; rollback plan documented

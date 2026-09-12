# UrbanExplore — Web Launch Plan (v2)

> Status date: 2026-09-08 (fresh audit of code, git history, and CI).
> Supersedes the milestone table in `PRODUCTION_READINESS_PLAN.md` §6 for launch sequencing.
> Companion docs: `IMPLEMENTATION_PLAN.md` (product phases), `PRODUCTION_READINESS_PLAN.md` (original audit), `UI_PLAN.md` / `UI_REDESIGN_V2.md` (design).
>
> **Progress (Round 4):** M2 ✅ M2b ✅ (Lighthouse evidence) M3 ✅ **Deployed & verified** — frontend live at
> `https://urbanexplore.netlify.app/` (auto-deploys from GitHub push), backends on Vercel
> (`afomii-backend`, `afomii-backend-wepb` — rebuilt READY after push `e3de944`). **Full 15-test
> Playwright suite passed against the live Netlify deployment** (public pages, auth redirects,
> SEO robots/sitemap/manifest/OG, `/api/health` with Supabase check, security headers,
> open-redirect guard, rate limiting). Round 4 additions: admin-portal middleware no longer
> bounces `/api/health` (each instance independently monitorable), `@supabase/ssr` 0.12.7.
> **Remaining owner actions: set SENTRY_DSN (optional), point uptime monitor at
> `https://urbanexplore.netlify.app/api/health`, configure Supabase Auth redirect allowlist,
> run authenticated-flow rehearsal (§ manual items in LAUNCH_REHEARSAL.md).**

---

## 0. Locked decisions

| Decision | Choice | Consequence |
| --- | --- | --- |
| Plan focus | **Production launch of the web app** | All milestones below serve shipping `apps/web`. |
| Backend | **Track A — freeze & re-scope** | `apps/backend` stays internal-only; no production deploy; Supabase RPCs remain the single data path. |
| Mobile | **Out of scope** | Keep CI typecheck only; no feature work; excluded from launch criteria. |

---

## 1. Where the project actually is (verified in code, not docs)

Done since the original audit (git history + file checks):

- **M0 security hotfix — done.** Migration `0007_security_hardening.sql` written and applied: RPCs derive identity from `auth.uid()`, `complete_purchase` closes the ticket inventory path, `anon` grants revoked, callback column mismatches fixed (`businesses`/`organizers` columns exist, slug unique partial indexes).
- **M1 frontend correctness — code complete.** Zod validation on all server actions (`lib/validation.ts`), security headers in `next.config.js`, open-redirect guard on callback, `poweredByHeader: false`, images `remotePatterns` for `*.supabase.co`, `lib/api.ts` throws instead of defaulting to localhost.
- **Beyond the old plan:** admin portal split to its own instance (`ADMIN_PORTAL=1`, `.next-admin`, `scripts/dev-admin.ps1`), self-healing partner provisioning, live DB-notification triggers + bell, My Plans saved tab, real bookings panel with duplicate-slot guard, navy/gold retheme, mobile Expo app compiles.
- **CI exists now** (`.github/workflows/ci.yml`) — but only mobile typecheck + backend lint/test. **No web job at all.**
- Static `metadata` titles exist on every page (34 pages), but no dynamic `generateMetadata` with OG/canonical on detail routes.
- `RideMap` is already lazy (`dynamic(..., { ssr: false })`); maps use Leaflet, not Google Maps JS.

Remaining gaps (each verified as absent today):

1. No `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts` — none exist.
2. No favicon / app icons in `apps/web` (public has only `fonts/`, `places/`, `vision/`).
3. No `generateMetadata` (OG/Twitter cards, canonical URLs) on `/restaurants/[id]`, `/events/[id]`, `/organizers/[id]`.
4. No `metadataBase` / default OG image.
5. **CI has no web job**: no `tsc --noEmit`, no `next lint`, no `next build` for `apps/web`.
6. **Zero tests in the repo** (backend runs jest with `--passWithNoTests`).
7. No deploy config (`vercel.json` / `netlify.toml`) — hosting provider still unchosen, despite `output: "standalone"` and an admin-portal two-instance model.
8. No monitoring: no Sentry, no uptime checks, no Web Vitals.
9. No rate limiting for public Server Actions.
10. Legal pages (`/privacy`, `/terms`) still carry placeholder company/contact data.
11. Cleanup: compiled `.js` twins next to `.ts` sources in `packages/shared/src` and `packages/database/src`; `apps/web/tsconfig.tsbuildinfo` is on disk (untracked — gitignore already fixed).

---

## 2. Milestones

### M2 — SEO & Content Foundation (P1)

Goal: make public pages discoverable, shareable, and correctly rendered by crawlers.

Work:
1. `app/robots.ts` — allow public routes, disallow `/dashboard`, `/settings`, `/auth`, `/api`; reference sitemap.
2. `app/sitemap.ts` — static routes + all published restaurants, events, organizers from Supabase queries; `revalidate`-friendly, fallback-safe (empty DB must not 500 the sitemap).
3. `app/manifest.ts` — name, icons, theme colors matching the navy/gold tokens.
4. Favicons + app icons (`app/icon.png`, `apple-icon.png`) from the brand mark.
5. `generateMetadata` on `/restaurants/[id]`, `/events/[id]`, `/organizers/[id]`: dynamic title/description from the listing row, OG + Twitter cards with cover image, canonical URL, `metadataBase` in root layout; graceful fallback when a cover image is missing.
6. Fill metadata gaps on static pages (`/about`, `/vision`, `/privacy`, `/terms`, `/ride`).
7. Default OG share image (brand card) in `public/`.

Acceptance:
- `/sitemap.xml` and `/robots.txt` render correctly with seeded data and with an empty database.
- Sharing a restaurant/event/organizer link produces a proper card (title, description, image).
- Lighthouse SEO ≥ 95 on home and detail pages.

### M2b — Performance (P1)

Goal: meet Lighthouse ≥ 90 performance on home + listing pages without sacrificing SSR.

Work:
1. Audit `ExploreCatalogue.tsx` (~28 KB) and `RidePlanner.tsx` (~29 KB) client bundles — memoize filters, split heavy sections, keep maps intent-gated.
2. `next/image` for all cover/banner renders (listing cards, detail heroes, dashboard banners).
3. Caching policy: `revalidate`/ISR for public catalogue + detail pages; dashboards stay dynamic; `app/api/geo/*` already revalidates (60s/120s) — keep.
4. Verify bundle budget after changes (`next build` output comparison).

Acceptance:
- Lighthouse performance ≥ 90 on `/`, `/restaurants`, `/events`, one detail page (mobile profile).
- No new client-side data fetching on public catalogue paths.

### M3 — CI/CD & Deploy (P0 for launch)

Goal: every PR is verified, and main deploys automatically to a real host.

Work:
1. Extend `ci.yml` with a **web job**: `npm ci` → `tsc --noEmit` (or `next build --no-lint` typecheck) → `next lint` → `next build` with dummy env vars.
2. First tests in the repo (vitest, workspace `@urbanexplore/web` or a `tests/` dir): shared zod schemas, catalogue mappers in `lib/catalogue.ts`, ETB fare estimation, `lib/rideWindow.ts`.
3. **Hosting decision → config**: `output: standalone` + two-instance admin split fits Vercel (two projects, `ADMIN_PORTAL=1`) or any Node host. Produce `vercel.json` (or chosen host config) covering both instances.
4. Supabase Auth URL configuration: add prod domain(s) to redirect allowlist; verify OAuth callback end-to-end on the deployed URL.
5. Rate limiting for public Server Actions (Upstash REST or platform middleware) — signup, signin, reservation, ticket purchase.
6. Sentry (SSR + client, Server Action capture) and uptime monitoring on `/` + an API route; alerts to a real channel.
7. Preview deploys per PR; promote to prod manually.

Acceptance:
- CI green on PRs including web build + tests.
- Merged `main` auto-deploys; staging URL serves the live catalogue.
- Signup→profile→reservation→ticket purchase works on the deployed domain (not localhost).

### M4 — Backend Track A freeze (small, mostly docs)

Work:
1. README/`apps/backend` banner: internal/experimental, not a production dependency; excluded from deploy.
2. Delete or clearly deprecate the in-memory `RedisService` shim (its state is per-process and meaningless in serverless).
3. Document the future-integrations path: Supabase Edge Functions or a slimmed service when payments/webhooks arrive.
4. Keep CI compile-only job as is.

Acceptance: no path in `apps/web` references the backend API; docs state the freeze explicitly.

### M5 — Launch rehearsal

Work:
1. Full E2E on the deployed staging: consumer signup → profile → reservation; ticket purchase; partner listing creation → public catalogue visibility; organizer event publish; ride estimate.
2. RLS persona audit with the five personas (anon / customer / restaurant partner / organizer / admin) against production Supabase.
3. Backup/PITR enabled on prod Supabase + a restore drill; secrets rotation confirmed out of git history.
4. Legal pages reviewed with real company/contact data.
5. Go/no-go checklist walked and signed.

Acceptance: every checklist item in §7 of `PRODUCTION_READINESS_PLAN.md` checked, or consciously waived with a reason.

---

## 3. Sequencing

```
M2 (SEO)  ──┐
            ├──► M3 (CI/CD + deploy) ──► M4 (freeze docs) ──► M5 (rehearsal) ──► LAUNCH
M2b (perf) ─┘        (parallel with M2 tail)
```

- M2 and M2b are independent and can interleave.
- M3's hosting step blocks M5 (need a real deployed staging).
- M4 is small enough to slot anywhere after M3 config lands.

## 4. Explicit non-goals

- NestJS backend hardening (Track B) — frozen instead.
- Mobile feature work — CI typecheck only.
- Payments settlement provider — states are modeled; integration deferred.
- Full CSP — deferred as before (needs testing with inline theme script + maps).

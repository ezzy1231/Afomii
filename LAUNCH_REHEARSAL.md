# Launch Rehearsal Checklist (M5)

> Work through every item on the **deployed staging environment** before promoting to
> production. Each item needs a named result (pass / fail / waived-with-reason).
> Companion: `LAUNCH_PLAN.md` §M5, `PRODUCTION_READINESS_PLAN.md` §7.
>
> **Automated coverage:** the anonymous/public subset of §1, §4 and §5 runs in CI as
> Playwright E2E (`apps/web/e2e/public-smoke.spec.ts` — 15 tests, incl. SEO routes,
> security headers, open-redirect guard, health endpoint). The items marked **[E2E]** below
> are proven by CI on every push; on staging, re-run them against the real domain
> (`BASE_URL=https://staging.example.com npx playwright test`). Authenticated flows
> (signup, reservations, purchases, partner/admin actions) require real accounts and stay
> manual on staging.

---

## 0. Preconditions

- [ ] CI green on `main` (web typecheck + lint + tests + build; backend lint; mobile typecheck).
- [ ] Staging deployment live on the final (or alias) domain with production env vars.
- [ ] Supabase Auth URL configuration points at the staging domain (Site URL + redirect allowlist).

## 1. End-to-end flows (staging, real data)

| # | Flow | Check | Pass |
| --- | --- | --- | --- |
| 1.1 | Consumer email signup | Profile row created with role `customer`; lands on `/` (or role picker); session survives refresh | ☐ |
| 1.2 | Google OAuth signup | PKCE exchange succeeds; profile + role provisioned; no verifier-cookie race | ☐ |
| 1.3 | Restaurant discovery | Home + `/restaurants` show live published listings; no sample data (verify `source` indicator in dev) | ☐ |
| 1.4 | Restaurant detail → reservation | Menu renders; slot picker reflects `booking_configs`; `reserve_table` RPC returns a reservation id | ☐ |
| 1.5 | Duplicate-slot guard | Second reservation for same branch/date/slot is rejected with the friendly message | ☐ |
| 1.6 | Ticket purchase | Hold → `complete_purchase` returns QR; inventory decrements; second purchase reflects remaining quantity | ☐ |
| 1.7 | Oversell regression | Two concurrent purchases on the last ticket → exactly one succeeds | ☐ |
| 1.8 | Partner onboarding | Food-business signup creates `businesses` row (slug, category, columns all present) | ☐ |
| 1.9 | Partner listing → catalogue | New listing appears on `/restaurants` within the catalogue TTL (60s) after publish | ☐ |
| 1.10 | Organizer flow | Organizer signup → create event + tiers → publish → visible on `/events` | ☐ |
| 1.11 | Admin portal | `/dashboard/admin` loads on the admin instance; non-admin sessions bounce with explanation | ☐ |
| 1.12 | Rate limiting | 6th rapid reservation attempt returns "Too many attempts" message | ☐ |
| 1.13 | Ride planner | Manual distance estimate works with no Maps key; ETB fares match the published formula | ☐ |

## 2. RLS persona audit (Supabase SQL editor + API checks)

Run each check as: anon key request, and authenticated sessions for each persona.

| Persona | Must be able to | Must NOT be able to |
| --- | --- | --- |
| anon | Read published restaurants/events; nothing else | Call `reserve_table`/`hold_ticket`/`complete_purchase`/`release_ticket_hold`; insert anywhere; read `/dashboard` data |
| customer | Own profile, reservations, tickets, saved/plans; reserve; purchase | Other users' reservations; partner dashboards; update `ticket_purchases` directly |
| food_business | Own businesses/branches/menus/listings/reservations-inbox | Other businesses' rows; admin actions |
| event_organizer | Own organizers/events/tiers/sales | Other organizers' rows; admin actions |
| system_admin | Admin views + moderation actions | — (verify audit_log rows are written for admin actions) |

- [ ] All five personas pass every cell of the table above.
- [ ] `select * from pg_catalog.pg_proc where proname in ('reserve_table','hold_ticket','complete_purchase','release_ticket_hold')` — verify `SECURITY DEFINER` and grants exclude `anon`.
- [ ] Verify direct `insert/update/delete` on `ticket_purchases` as `authenticated` is revoked (migration 0007 still effective after any newer migrations).

## 3. Database & backups

- [ ] All migrations `0001`–`0014` applied cleanly to the staging project (no manual SQL drift).
- [ ] Prod project: PITR / daily backups enabled.
- [ ] Restore drill executed once on a scratch project; row counts match post-restore.
- [ ] Seed files (`seed.sql`, `seed-places.sql`) applied only to dev/staging — confirm prod has no sample rows.

## 4. Security & secrets

- [ ] Secrets rotated since they entered git history (Supabase JWT secret, Google Maps key) — or formally waived by owner.
- [ ] `git log -p` scan for accidentally committed `.env*` beyond examples — clean.
- [ ] Security headers present on staging responses (`X-Frame-Options: DENY`, nosniff, HSTS, Referrer-Policy, Permissions-Policy).
- [ ] Open-redirect guard: `/auth/callback?next=https://evil.com` stays on-site.
- [ ] Banner upload URL validation: action rejects non-banners-bucket URLs (covered by unit tests — spot-check on staging).

## 5. SEO & metadata (staging URLs)

- [ ] `/robots.txt` renders; sitemap reference uses the production domain (`NEXT_PUBLIC_SITE_URL` set).
- [ ] `/sitemap.xml` includes all published restaurants/events/organizers; `<loc>` uses the prod domain; empty-DB does not 500.
- [ ] Restaurant/event/organizer detail pages emit title, description, canonical, og:image (real cover where present), twitter:card.
- [ ] Link previews unfurl correctly in a link checker (e.g. opengraph.xyz) for one URL of each type.
- [ ] `/manifest.webmanifest` valid; icon renders in browser tab.

## 6. Observability & ops

- [ ] Sentry (or chosen monitor) receives a test error from staging (hook point: `logActionError()` in `apps/web/lib/validation.ts`).
- [ ] Uptime monitor on `/` (and one API route) with alerts wired to a real channel.
- [ ] Rate-limit log lines appear with the `[action:rateLimit]` prefix when tripped.
- [ ] `docker compose down && up` on local Postgres/Redis does not affect web (web has no backend dependency — Track A freeze intact).

## 7. Legal & content

- [ ] `/privacy` and `/terms` reviewed with real company/contact data (currently generic).
- [ ] No placeholder/sample content on any production-rendered page.
- [ ] Footer/nav links resolve (no 404s in crawl of the sitemap).

## 8. Go / no-go

- [ ] Every item above is pass or explicitly waived with a written reason.
- [ ] Rollback plan documented: redeploy previous Vercel deployment + revert Supabase migration if a migration shipped.
- [ ] Owner sign-off: ______________ (date: ______)

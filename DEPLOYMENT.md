# Hosting & Deployment — Vercel (two-instance split)

> Decision date: 2026-09-08 (LAUNCH_PLAN.md M3). `output: "standalone"` + the
> `ADMIN_PORTAL=1` split map naturally onto two Vercel projects sharing one repo.

## Architecture

| Instance | Directory | Root dir | Port (local) | Env | Purpose |
| --- | --- | --- | --- | --- | --- |
| **main** | `apps/web` | `apps/web` | 3000 | default | Consumer site + partner dashboards |
| **admin portal** | `apps/web` | `apps/web` | 3001 | `ADMIN_PORTAL=1` | `/dashboard/admin` only |

Both instances deploy from the same codebase; `next.config.js` switches `distDir`
(`.next` vs `.next-admin`) and the middleware bounces admin traffic to the portal
origin (see `apps/web/.env.example` — `NEXT_PUBLIC_MAIN_ORIGIN` /
`NEXT_PUBLIC_ADMIN_ORIGIN`).

## One-time setup (per instance)

### Main site

1. **Vercel → Add New Project → Import** the repository.
2. **Root Directory:** `apps/web`
3. **Framework Preset:** Next.js (auto-detected)
4. **Environment Variables** (Production + Preview):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   NEXT_PUBLIC_SITE_URL=https://<your-domain>          # canonical URLs, sitemap, OG
   SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>   # optional, error reporting
   # Optional split config:
   NEXT_PUBLIC_ADMIN_ORIGIN=https://admin.<your-domain>
   ```

   Leave `ADMIN_PORTAL` unset on this instance.

5. Deploy. Note the production URL (e.g. `https://urbanexplore.vercel.app`).

### Admin portal (second project, same repo)

1. **Vercel → Add New Project → Import** the *same* repository again.
2. **Root Directory:** `apps/web`
3. **Environment Variables**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=<same>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<same>
   ADMIN_PORTAL=1
   NEXT_PUBLIC_MAIN_ORIGIN=https://<main-domain>       # bounce non-admin traffic back
   # NEXT_PUBLIC_ADMIN_ORIGIN unset — middleware default is this origin
   ```

4. Deploy. Verify `https://<admin>.vercel.app/dashboard/admin` renders the sign-in
   page and non-admin paths bounce to `NEXT_PUBLIC_MAIN_ORIGIN`.

### Custom domains

- Main: add the apex + `www` domain in the main project settings.
- Admin: add `admin.<domain>` (or keep the Vercel URL — admin is low-traffic).
- Set `NEXT_PUBLIC_SITE_URL` on the main project to the final domain **before**
  going live so the sitemap and OG tags use real URLs.

### Supabase Auth URL configuration (required)

Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://<main-domain>`
- **Redirect allowlist:** `https://<main-domain>/auth/callback`,
  `https://<main-domain>/**`, `https://<admin-domain>/auth/callback`,
  `https://<preview>.vercel.app/**` (or use the wildcard `https://*.vercel.app/auth/callback`)

Google OAuth provider: add both callback URLs to the authorized redirect list in
Google Cloud Console (`https://<main-domain>/auth/callback`).

## CI relationship

`.github/workflows/ci.yml` runs typecheck + tests + `next build` on every PR.
Vercel builds happen on merge (all PRs get preview deployments automatically).
CI is the source of truth for merge gates; Vercel previews are convenience.

## Notes / trade-offs

- Two projects double the (free-tier) deployment slots but keep the admin
  surface on a separate origin from consumers — also lets you lock it down
  later (IP allowlist, SSO, noindex headers) without touching the main site.
- `unstable_cache` catalogue reads and the static `sitemap.xml` revalidate
  hourly/daily without a cron.
- Sentry + uptime monitoring: see LAUNCH_PLAN.md M3 items (wire `SENTRY_DSN` into
  both projects' env when created — the code hook point is
  `logActionError()` in `apps/web/lib/validation.ts`).

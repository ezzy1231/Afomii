# NestJS Backend (internal — not a production dependency)

> **Status: FROZEN (Track A).** See `LAUNCH_PLAN.md` §M4 and `PRODUCTION_READINESS_PLAN.md` §4.
>
> This service is **not called by the web app on any critical path** and is **excluded from
> production deployment**. The production data path is:
>
> - Supabase Auth — identity and sessions
> - Supabase Database + RLS — single source of truth
> - Security-definer RPCs (`reserve_table`, `hold_ticket`, `complete_purchase`) — concurrency-safe writes
> - pg_cron — scheduled work (hold expiry)
> - Next.js Server Actions — validated mutations via `apps/web/lib/validation.ts`
>
> ## What this app remains for
>
> - Local experiments and schema reference (Prisma mirrors the *pre-Supabase* local database).
> - Future trusted server-side work **when a real integration requires it**: payment webhooks,
>   provider APIs that cannot run in the browser or as Edge Functions.
>
> ## If you must run it locally
>
> ```powershell
> docker compose up -d postgres redis
> npm run dev --workspace=@urbanexplore/backend
> ```
>
> ## Known limitations (do not "fix" without re-reading the plans)
>
> - `RedisService` is an **in-memory Map shim**, not Redis — all state is per-process and
>   meaningless across restarts or in serverless. Do not build on it.
> - Prisma schema diverges from the Supabase schema; they are different worlds.
> - Auth (`auth.service.ts`) duplicates Supabase Auth with a shared HS256 secret.
> - Authorization is role-only, without ownership checks.
>
> When payments/webhooks arrive, prefer **Supabase Edge Functions** or a slim service aligned
> with the Supabase contract before resurrecting this one.

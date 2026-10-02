# Supabase Project Cutover Checklist

> For standing up a **fresh Supabase project** (e.g. replacing one whose
> `auth.flow_state` writes fail with `invalid flow state, no valid flow state
> found` — see supabase/supabase#48786).
>
> Schema work is automated by `scripts/`; everything below is **manual**
> dashboard/console work. Do the steps in order — the app will 500 until the
> env vars point at a project that has both the schema and a Google provider.

---

## Status for project `hgwdnhpvmzyxpvlasldk`

| Step | Status |
| --- | --- |
| Project created (region `eu-west-2`) | ✅ done |
| 14 migrations applied (`0001`–`0014`, exit 0) | ✅ done |
| 18 tables · 54 RLS policies · 0 tables without RLS | ✅ verified |
| `pg_cron` available (migration `0006` scheduled) | ✅ verified |
| Security verifier (5/5 PASS) | ✅ verified |
| PostgREST schema cache reloaded; tables serve over REST | ✅ verified |
| Google provider enabled | ☐ **TODO** |
| Google Cloud redirect URI added | ☐ **TODO** |
| Supabase URL Configuration (Site URL + Redirect URLs) | ☐ **TODO** |
| Netlify env vars swapped | ☐ **TODO** |
| Admin role bootstrapped | ☐ **TODO** |
| End-to-end Google login verified | ☐ **TODO** |

---

## 1. Google provider (new Supabase project)

Dashboard → **Authentication → Providers → Google**

- Paste the **existing** OAuth **Client ID** and **Client Secret** (they live in
  Google Cloud Console, not Supabase — reuse them, don't mint new ones).
- Enable the provider → **Save**.

## 2. Google Cloud Console redirect URI

APIs & Services → Credentials → your OAuth client → **Authorized redirect URIs** →
add:

```
https://hgwdnhpvmzyxpvlasldk.supabase.co/auth/v1/callback
```

Keep the old project's URI too, so you can roll back. Google only ever talks to
Supabase's callback — your Netlify URL does **not** belong here.

## 3. Supabase URL Configuration

Dashboard → **Authentication → URL Configuration**

- **Site URL:** `https://urbanexplore.netlify.app`
- **Redirect URLs:**
  ```
  https://urbanexplore.netlify.app/auth/callback
  https://urbanexplore.netlify.app/**
  ```

## 4. Swap the Netlify env vars

Site → Environment variables (set for **Production** and **Preview**):

```
NEXT_PUBLIC_SUPABASE_URL=https://hgwdnhpvmzyxpvlasldk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key from this project>
```

⚠️ **Keep the variable name `NEXT_PUBLIC_SUPABASE_ANON_KEY`.** Newer Supabase
dashboards label the value a "publishable key" (`sb_publishable_...`), but the
app reads the env var named `..._ANON_KEY`. Renaming the value is fine; renaming
the variable will break the app unless the code changes too.

Mirror both into `apps/web/.env.local` for local dev. Saving triggers a rebuild.

## 5. Bootstrap the admin account

1. Sign in once on the site with the admin account (any method that works).
   The `on_auth_user_created` trigger creates the `profiles` row as `customer`.
2. Promote it in the new project's **SQL Editor** (runs as `postgres`, so it
   bypasses RLS):
   ```sql
   update public.profiles set role = 'system_admin' where email = 'you@example.com';
   update public.profiles set role = 'food_business'  where email = 'partner@example.com';
   update public.profiles set role = 'event_organizer' where email = 'organizer@example.com';
   ```
   You cannot use the `admin_set_user_role` RPC here — it requires an existing
   admin, and a fresh project has none.
3. For partner/organizer accounts, **sign in again via Google** afterwards: the
   callback provisions the matching `businesses` / `organizers` row on next login
   (it only creates it when missing).

## 6. Verify end-to-end

- [ ] `https://urbanexplore.netlify.app/` loads (public catalogue).
- [ ] `/api/health` returns 200 and the Supabase check passes.
- [ ] **Incognito window** → `/auth/signin` → **Continue with Google** as admin →
      lands on `/dashboard/admin` (no rollback to the login page).
- [ ] Same for a `food_business` account → `/dashboard/restaurant`.
- [ ] Same for an `event_organizer` account → `/dashboard/organizer`.
- [ ] A brand-new Google user lands on `/auth/role` (role picker) and choosing a
      role provisions the account.

## 7. Data (optional)

A new project starts empty. If the old project holds real rows you want to keep,
export per table (Dashboard → **Table Editor** → Download CSV) or `pg_dump` the
old project, then import. Dev/staging sample data lives in
`packages/supabase/seed.sql` and `seed-places.sql` (never seed production).

---

## Rollback

Point the Netlify env vars back at the old project ref and redeploy. Keep the old
project alive until the new one is verified. The app-side PKCE slot retry is
independent of which project you point at.

---

## Re-running the schema (reproducible)

```powershell
npm run supabase:build     # regenerate apply-all-migrations.sql from migrations/
npm run supabase:check     # CI guard: fail if the snapshot drifted
npm run supabase:apply     # build + apply each migration via psql
```

Verify afterwards:

```powershell
psql "$CONNECTION_STRING" -v ON_ERROR_STOP=1 -f packages/supabase/verify-migrations.sql
```

⚠️ The migrations are **not idempotent** (RLS policies are created with plain
`create policy`, and `0007` renames a column). Run once on a fresh project; to
re-apply, recreate the project or resume from the failing file.

⚠️ **Never use `packages/supabase/apply.sql`** — it is a legacy snapshot that
omits `0007_security_hardening.sql` and would leave a project insecure.
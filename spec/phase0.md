# Phase 0: Foundation

## Skills to Use
- `design-tokens-theming` — Define color/typography/spacing scales, CSS variables
- `tailwind` — Configure Tailwind v4, utility patterns
- `nextjs` — Set up Next.js 14 App Router, TypeScript config
- `security-headers` — Configure CSP, HSTS, Permissions-Policy

## Objective
Set up the monorepo, tooling, design tokens, and environment for development.

## Project Name
**UrbanExplore** — Discovery and booking platform for Ethiopia.

## Files to Create

### Root Configuration
- `package.json` — Workspace root with scripts
- `turbo.json` — Task pipeline
- `.env.example` — All env vars (no secrets)
- `.gitignore` — Standard ignores + `.env.local`
- `docker-compose.yml` — PostgreSQL 16 + PostGIS + Redis (local dev)

### Web App Configuration
- `apps/web/package.json` — Dependencies
- `apps/web/tsconfig.json` — Extends shared, path alias `@/*`
- `apps/web/next.config.mjs` — Next.js config
- `apps/web/tailwind.config.ts` — Design tokens
- `apps/web/postcss.config.mjs` — PostCSS
- `apps/web/vitest.config.ts` — Test config
- `apps/web/playwright.config.ts` — E2E config

### Shared Packages
- `packages/config-tsconfig/` — Base, Next.js configs
- `packages/config-tailwind/` — Shared Tailwind with brand colors
- `packages/config-eslint/` — Shared ESLint configs
- `packages/shared/` — Types + Zod schemas

## Design Tokens

### Colors
```css
/* Brand */
--navy: #0F172A      /* Primary dark */
--ember: #E11D48     /* Accent */
--amber: #F59E0B     /* Secondary accent */
--gold: #D4A853      /* Premium */
--moss: #059669      /* Success */

/* Light mode */
--bg: #F8FAFC
--surface: #FFFFFF
--border: #E2E8F0
--fg: #0F172A
--muted: #64748B

/* Dark mode */
--bg: #0F172A
--surface: #1E293B
--border: #475569
--fg: #F8FAFC
--muted: #94A3B8
```

### Typography
- Display: Space Grotesk (self-hosted variable font, weights 300-700)
- Body: System font stack
- Scale: text-xs(12), text-sm(14), text-base(16), text-lg(18), text-xl(20), text-2xl(24), text-3xl(30), text-4xl(36)

### Spacing
- Base unit: 4px
- Page padding: 16px (mobile), 24px (desktop)
- Card padding: 24px
- Section gap: 64px

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Stripe (demo mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Monitoring
SENTRY_DSN=

# Email
RESEND_API_KEY=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Verification Gate

- [ ] `npm install` succeeds
- [ ] `npm run dev` starts on :3000
- [ ] `npm run build` completes without errors
- [ ] `npx tsc --noEmit` passes
- [ ] Tailwind compiles with all custom tokens
- [ ] Docker Compose starts PostgreSQL + Redis

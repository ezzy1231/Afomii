# UrbanExplore — Complete Build Specification

## Project Overview

**UrbanExplore** is a discovery and booking platform for Ethiopia, targeting both the Ethiopian diaspora (who find tour guides expensive) and the local market. It unifies restaurant discovery, event ticketing, hotel booking, and ride planning into one platform.

### The Problem
- Diaspora visitors hire expensive tour guides because they don't know where to go
- Locals use WhatsApp groups to find restaurants and events
- No unified platform for discovery + booking + navigation
- Cash-only economy makes planning difficult

### The Solution
One app to discover, book, and navigate — with integrated payments, real-time availability, and ride planning.

### Target Users
| Segment | Needs | Willingness to Pay |
|---|---|---|
| Diaspora visitors | Trusted discovery, English UI, card payments | High |
| Local professionals | Quick booking, Amharic UI, mobile payments | Medium |
| Tourists | Reviews, photos, maps | High |
| Businesses | Online presence, booking management | Medium |

### Tech Stack
| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 14 + TypeScript | Vercel |
| Backend | Next.js API routes (no separate backend) | Vercel |
| Database | Supabase (PostgreSQL + PostGIS) | Supabase |
| Auth | Clerk | Clerk |
| Payments | Stripe (demo mode) | Stripe |
| Maps | Google Maps + Leaflet | Google |
| Storage | Supabase Storage | Supabase |
| Real-time | Supabase Realtime | Supabase |
| Monitoring | Sentry | Sentry |
| Email | Resend | Resend |

---

## Spec Structure

| File | Description |
|---|---|
| `00-product-vision.md` | Product strategy, user journeys, success metrics |
| `01-user-journeys.md` | Detailed user flows for all personas |
| `02-gap-analysis.md` | Feature gaps and improvements |
| `phase0.md` | Foundation: monorepo, tooling, design tokens |
| `phase1.md` | Database: schema, RLS, RPCs, triggers |
| `phase2.md` | Auth: Clerk, webhooks, middleware |
| `phase3.md` | Design system: components, patterns, motion |
| `phase4.md` | Public pages: home, restaurants, events, hotels, ride |
| `phase5.md` | Auth pages: sign-in, sign-up, role selection |
| `phase6.md` | User features: reservations, reviews, plans, settings |
| `phase7.md` | Restaurant dashboard |
| `phase8.md` | Organizer dashboard |
| `phase9.md` | Admin dashboard |
| `phase10.md` | API routes, webhooks, payments |
| `phase11.md` | Testing: unit, integration, E2E |
| `phase12.md` | Deployment: Vercel, Stripe, monitoring |

---

## Skill-to-Phase Mapping

Agents MUST use the appropriate skills for each task. Here's the mapping:

### Phase 0: Foundation
| Skill | When to Use |
|---|---|
| `design-tokens-theming` | Define color/typography/spacing scales, CSS variables |
| `tailwind` | Configure Tailwind v4, utility patterns |
| `nextjs` | Set up Next.js 14 App Router, TypeScript config |

### Phase 1: Database
| Skill | When to Use |
|---|---|
| `supabase` | Schema design, RLS policies, RPCs, triggers |
| `nextjs` | Server components, data fetching patterns |

### Phase 2: Authentication
| Skill | When to Use |
|---|---|
| `clerk` | Clerk setup, webhooks, middleware, auth patterns |
| `auth-screens` | Sign-in/sign-up/forgot/reset flows, OAuth buttons |
| `onboarding-flows` | Multi-step signup wizards, role selection |
| `nextjs` | Server components, middleware, route protection |

### Phase 3: Design System
| Skill | When to Use |
|---|---|
| `frontend-design` | Define visual direction, avoid AI-slop aesthetics |
| `ui-design` | Build/audit UI, dark mode, responsive design |
| `design-tokens-theming` | Color/typography/spacing scales, CSS variables |
| `component-architecture` | Compose shadcn/ui, cva variants, compound components |
| `accessible-components` | WCAG AA, focus management, ARIA, keyboard nav |
| `shadcn` | shadcn/ui with Radix/Base UI primitives |
| `tailwind` | Tailwind v4 optimization, utility patterns |
| `responsive-layout` | App shell, sidebar, breakpoints, container queries |
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `empty-and-loading-states` | Skeletons, empty states, error+retry |
| `modals-and-dialogs` | Dialog/sheet/drawer, focus trap, destructive confirm |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |

### Phase 4: Public Pages
| Skill | When to Use |
|---|---|
| `frontend-design` | Visual direction for public pages |
| `ui-design` | Build/audit UI, responsive design |
| `responsive-layout` | App shell, breakpoints |
| `nextjs` | Server Components, data fetching, SSR |
| `react` | React 19 patterns, hooks, performance |
| `empty-and-loading-states` | Skeletons, empty states |
| `web-design-guidelines` | 100+ rules for a11y, performance, UX review |

### Phase 5: Auth Pages
| Skill | When to Use |
|---|---|
| `auth-screens` | Login/signup/forgot/reset, OAuth buttons |
| `onboarding-flows` | Multi-step wizards, setup checklists |
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `clerk` | Clerk components, hooks, redirects |
| `accessible-components` | WCAG AA, focus management, ARIA |

### Phase 6: User Features
| Skill | When to Use |
|---|---|
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `data-tables` | Sortable/filterable/paginated tables |
| `settings-pages` | Account settings, danger zone |
| `notifications-and-toasts` | Toasts (sonner), inline alerts |
| `empty-and-loading-states` | Skeletons, empty states, error+retry |
| `modals-and-dialogs` | Dialog/sheet/drawer, focus trap |
| `responsive-layout` | App shell, breakpoints |

### Phase 7: Restaurant Dashboard
| Skill | When to Use |
|---|---|
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `data-tables` | Sortable/filterable/paginated tables |
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |
| `empty-and-loading-states` | Skeletons, empty states |
| `modals-and-dialogs` | Dialog/sheet/drawer, destructive confirm |

### Phase 8: Organizer Dashboard
| Skill | When to Use |
|---|---|
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `data-tables` | Sortable/filterable/paginated tables |
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |
| `billing-and-pricing` | Pricing tables, plan cards, paywalls |

### Phase 9: Admin Dashboard
| Skill | When to Use |
|---|---|
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `data-tables` | Sortable/filterable/paginated tables |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |
| `modals-and-dialogs` | Dialog/sheet/drawer, destructive confirm |
| `settings-pages` | Admin settings, danger zone |

### Phase 10: API & Webhooks
| Skill | When to Use |
|---|---|
| `supabase` | Database operations, RLS, RPCs |
| `clerk` | Webhook handlers, auth verification |
| `stripe` | Payment intents, webhooks, refunds |
| `nextjs` | API routes, route handlers |

### Phase 11: Testing
| Skill | When to Use |
|---|---|
| `nextjs` | Build verification, route testing |
| `web-design-guidelines` | 100+ rules for a11y, performance, UX review |
| `accessible-components` | WCAG AA audit, keyboard nav testing |

### Phase 12: Deployment
| Skill | When to Use |
|---|---|
| `nextjs` | Production build, optimization |
| `web-design-guidelines` | Performance, a11y, SEO audit |
| `stripe` | Production payment configuration |

---

## Complete Skill-to-Phase Mapping

### Phase 0: Foundation
| Skill | When to Use |
|---|---|
| `design-tokens-theming` | Define color/typography/spacing scales, CSS variables |
| `tailwind` | Configure Tailwind v4, utility patterns |
| `nextjs` | Set up Next.js 14 App Router, TypeScript config |
| `security-headers` | Configure CSP, HSTS, Permissions-Policy |

### Phase 1: Database
| Skill | When to Use |
|---|---|
| `supabase` | Schema design, RLS policies, RPCs, triggers |
| `supabase-postgres-best-practices` | Query optimization, indexes, RLS, connection pooling |
| `nextjs` | Server components, data fetching patterns |

### Phase 2: Authentication
| Skill | When to Use |
|---|---|
| `clerk` | Clerk setup, webhooks, middleware, auth patterns |
| `auth-screens` | Sign-in/sign-up/forgot/reset flows, OAuth buttons |
| `onboarding-flows` | Multi-step signup wizards, role selection |
| `nextjs` | Server components, middleware, route protection |
| `security-and-hardening` | Auth security, session management |

### Phase 3: Design System
| Skill | When to Use |
|---|---|
| `frontend-design` | Define visual direction, avoid AI-slop aesthetics |
| `ui-design` | Build/audit UI, dark mode, responsive design |
| `design-tokens-theming` | Color/typography/spacing scales, CSS variables |
| `component-architecture` | Compose shadcn/ui, cva variants, compound components |
| `accessible-components` | WCAG AA, focus management, ARIA, keyboard nav |
| `shadcn` | shadcn/ui with Radix/Base UI primitives |
| `tailwind` | Tailwind v4 optimization, utility patterns |
| `responsive-layout` | App shell, sidebar, breakpoints, container queries |
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `empty-and-loading-states` | Skeletons, empty states, error+retry |
| `modals-and-dialogs` | Dialog/sheet/drawer, focus trap, destructive confirm |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |

### Phase 4: Public Pages
| Skill | When to Use |
|---|---|
| `frontend-design` | Visual direction for public pages |
| `ui-design` | Build/audit UI, responsive design |
| `responsive-layout` | App shell, breakpoints |
| `nextjs` | Server Components, data fetching, SSR |
| `react` | React 19 patterns, hooks, performance |
| `empty-and-loading-states` | Skeletons, empty states |
| `web-design-guidelines` | 100+ rules for a11y, performance, UX review |
| `seo-expert` | Meta tags, OpenGraph, structured data |
| `i18n-handbook` | Locale routing, metadata, RTL support |
| `performance-optimization` | Core Web Vitals, bundle optimization |

### Phase 5: Auth Pages
| Skill | When to Use |
|---|---|
| `auth-screens` | Login/signup/forgot/reset, OAuth buttons |
| `onboarding-flows` | Multi-step wizards, setup checklists |
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `clerk` | Clerk components, hooks, redirects |
| `accessible-components` | WCAG AA, focus management, ARIA |
| `error-loading-not-found` | Error states, loading states |

### Phase 6: User Features
| Skill | When to Use |
|---|---|
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `data-tables` | Sortable/filterable/paginated tables |
| `settings-pages` | Account settings, danger zone |
| `notifications-and-toasts` | Toasts (sonner), inline alerts |
| `empty-and-loading-states` | Skeletons, empty states, error+retry |
| `modals-and-dialogs` | Dialog/sheet/drawer, focus trap |
| `responsive-layout` | App shell, breakpoints |
| `stripe-best-practices` | Payment flows, Stripe integration |
| `supabase-realtime` | Real-time notifications, live updates |
| `server-caching-handbook` | Cache tags, Redis, unstable_cache |

### Phase 7: Restaurant Dashboard
| Skill | When to Use |
|---|---|
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `data-tables` | Sortable/filterable/paginated tables |
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |
| `empty-and-loading-states` | Skeletons, empty states |
| `modals-and-dialogs` | Dialog/sheet/drawer, destructive confirm |
| `supabase-realtime` | Real-time reservation updates |
| `observability-and-instrumentation` | Analytics instrumentation |

### Phase 8: Organizer Dashboard
| Skill | When to Use |
|---|---|
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `data-tables` | Sortable/filterable/paginated tables |
| `forms-and-validation` | react-hook-form + zod + shadcn Form |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |
| `billing-and-pricing` | Pricing tables, plan cards, paywalls |
| `stripe-best-practices` | Ticket sales, payment processing |
| `supabase-realtime` | Real-time ticket inventory |

### Phase 9: Admin Dashboard
| Skill | When to Use |
|---|---|
| `dashboard-layout` | KPI cards, chart placement, overview grids |
| `data-tables` | Sortable/filterable/paginated tables |
| `navigation-patterns` | Sidebar nav, tabs, breadcrumbs |
| `modals-and-dialogs` | Dialog/sheet/drawer, destructive confirm |
| `settings-pages` | Admin settings, danger zone |
| `security-auditor` | Security audits, vulnerability assessment |
| `secure-code-review` | Security-focused code review |

### Phase 10: API & Webhooks
| Skill | When to Use |
|---|---|
| `supabase` | Database operations, RLS, RPCs |
| `clerk` | Webhook handlers, auth verification |
| `stripe-best-practices` | Payment intents, webhooks, refunds |
| `nextjs` | API routes, route handlers |
| `server-caching-handbook` | API response caching |
| `debugging-and-error-recovery` | Error handling, recovery patterns |

### Phase 11: Testing
| Skill | When to Use |
|---|---|
| `nextjs` | Build verification, route testing |
| `web-design-guidelines` | 100+ rules for a11y, performance, UX review |
| `accessible-components` | WCAG AA audit, keyboard nav testing |
| `performance-audit` | Bundle + CWV findings, Lighthouse audits |
| `performance-profiler` | Deep performance profiling |
| `ci-cd-and-automation` | Pipeline setup, quality gates |
| `github-actions-builder` | GitHub Actions workflows |

### Phase 12: Deployment
| Skill | When to Use |
|---|---|
| `nextjs` | Production build, optimization |
| `web-design-guidelines` | Performance, a11y, SEO audit |
| `stripe-best-practices` | Production payment configuration |
| `security-headers` | CSP, HSTS, Permissions-Policy |
| `security-and-hardening` | Security best practices, hardening |
| `ci-cd-and-automation` | Deployment pipeline |
| `github-actions-builder` | Deployment workflows |
| `observability-setup` | Health checks, alerting, dashboards |
| `observability-handbook` | Log correlation, error hygiene |
| `documentation-and-adrs` | Architecture decision records |
| `technical-writer` | Technical documentation, API docs |

---

## Build Loop

```
spec → build → test → verify → fix → repeat
```

Each phase MUST pass its verification gate before the next phase starts.
If any test fails, dump the failing code, analyze the root cause, and regenerate.

---

## Key Conventions

- All server components use `auth()` from Clerk + profile lookup from Supabase
- All client components use `useUser()` from Clerk
- Database queries use `profile.id` (UUID) for foreign keys
- Rate limiting via in-process token bucket
- Zod validation on ALL server actions
- RLS policies on ALL tables
- No direct table inserts from client — use RPCs for atomic operations
- Stripe in demo mode for all payments
- Amharic + English language support

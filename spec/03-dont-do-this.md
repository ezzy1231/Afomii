# UrbanExplore — Don't Do This: Known Mistakes & Anti-Patterns

## Purpose
This document lists common mistakes made when building with Next.js + Supabase + Clerk + Stripe. Agents MUST read this before starting any phase. Each item references the skill that covers the correct approach.

---

## Next.js Mistakes

### 1. Not Using Server Components by Default
**Mistake:** Making everything a client component.
**Why it's bad:** Loses SSR benefits, hurts performance, increases bundle size.
**Fix:** Start with Server Components. Only add `'use client'` when you need interactivity.
**Skill:** `nextjs`

### 2. Not Handling Loading States
**Mistake:** Pages flash or show blank content while loading.
**Why it's bad:** Poor UX, users think the app is broken.
**Fix:** Create `loading.tsx` for every route segment. Use Suspense boundaries.
**Skill:** `empty-and-loading-states`, `error-loading-not-found`

### 3. Not Handling Error States
**Mistake:** No error boundaries, unhandled promise rejections.
**Why it's bad:** White screen of death, lost users.
**Fix:** Create `error.tsx` for every route segment. Add global error boundary.
**Skill:** `error-loading-not-found`, `debugging-and-error-recovery`

### 4. Not Using Next/Image
**Mistake:** Using raw `<img>` tags.
**Why it's bad:** No optimization, no lazy loading, poor LCP.
**Fix:** Use `next/image` with proper sizing, priority for above-fold images.
**Skill:** `performance-optimization`

### 5. Not Optimizing Bundle Size
**Mistake:** Importing entire libraries instead of tree-shakeable imports.
**Why it's bad:** Slow page loads, poor Core Web Vitals.
**Fix:** Use dynamic imports, code splitting, analyze bundle with `@next/bundle-analyzer`.
**Skill:** `performance-optimization`, `performance-audit`

### 6. Not Using Route Groups
**Mistake:** All pages in flat structure.
**Why it's bad:** Hard to organize, can't share layouts.
**Fix:** Use route groups `(public)`, `(dashboard)`, `(auth)` for shared layouts.
**Skill:** `nextjs`, `responsive-layout`

### 7. Not Generating Metadata
**Mistake:** Hardcoded title/description on every page.
**Why it's bad:** Poor SEO, no social sharing cards.
**Fix:** Use `generateMetadata()` for dynamic meta tags, OpenGraph, Twitter cards.
**Skill:** `seo-expert`

### 8. Not Using Parallel Routes
**Mistake:** Blocking data fetches.
**Why it's bad:** Slow page loads, poor UX.
**Fix:** Use `Promise.all()` for parallel data fetching in Server Components.
**Skill:** `nextjs`, `performance-optimization`

---

## Supabase Mistakes

### 9. Not Enabling RLS
**Mistake:** Tables without Row Level Security.
**Why it's bad:** Any user can read/write any data. Critical security vulnerability.
**Fix:** Enable RLS on ALL tables. Create policies for each role.
**Skill:** `supabase`, `security-and-hardening`

### 10. Not Using RPCs for Atomic Operations
**Mistake:** Multiple client-side queries for one operation.
**Why it's bad:** Race conditions, data inconsistency, no atomicity.
**Fix:** Use PostgreSQL functions (RPCs) for multi-step operations.
**Skill:** `supabase`, `supabase-postgres-best-practices`

### 11. Not Indexing Foreign Keys
**Mistake:** Missing indexes on frequently queried columns.
**Why it's bad:** Slow queries, poor performance at scale.
**Fix:** Index all foreign keys, search fields, and filter columns.
**Skill:** `supabase-postgres-best-practices`

### 12. Not Handling Realtime Correctly
**Mistake:** Subscribing to all changes, not filtering.
**Why it's bad:** Unnecessary bandwidth, performance issues.
**Fix:** Use channel filters, unsubscribe on component unmount.
**Skill:** `supabase-realtime`, `realtime-handbook`

### 13. Not Using Connection Pooling
**Mistake:** Direct connections in serverless environment.
**Why it's bad:** Connection exhaustion, failed requests.
**Fix:** Use Supabase connection pooler (pgBouncer) in transaction mode.
**Skill:** `supabase-postgres-best-practices`

### 14. Not Validating Input
**Mistake:** Trusting client-side data.
**Why it's bad:** SQL injection, data corruption, security vulnerabilities.
**Fix:** Use Zod schemas for ALL server actions and API routes.
**Skill:** `forms-and-validation`, `security-and-hardening`

### 15. Not Using Database Triggers
**Mistake:** Application-side logic for data consistency.
**Why it's bad:** Race conditions, missed updates, inconsistent state.
**Fix:** Use triggers for notifications, aggregations, audit logs.
**Skill:** `supabase`

---

## Clerk Mistakes

### 16. Exposing Secret Keys
**Mistake:** Using `CLERK_SECRET_KEY` in client code.
**Why it's bad:** Complete auth bypass, security breach.
**Fix:** Only use `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in client. Secret key only in server.
**Skill:** `clerk`, `security-and-hardening`

### 17. Not Verifying Webhooks
**Mistake:** Accepting webhook payloads without signature verification.
**Why it's bad:** Spoofed events, fake user creation.
**Fix:** Always verify webhook signatures using `svix`.
**Skill:** `clerk`, `security-and-hardening`

### 18. Not Protecting Routes
**Mistake:** Relying only on client-side auth checks.
**Why it's bad:** Users can bypass with dev tools, access protected data.
**Fix:** Use middleware for route protection. Always verify auth server-side.
**Skill:** `clerk`, `nextjs`

### 19. Not Handling Session Expiry
**Mistake:** Assuming session is always valid.
**Why it's bad:** Crashes, poor UX when session expires.
**Fix:** Handle session expiry gracefully. Redirect to sign-in with return URL.
**Skill:** `clerk`, `error-loading-not-found`

### 20. Not Using the Right Hooks
**Mistake:** Using `useUser()` in Server Components.
**Why it's bad:** Hooks only work in client components.
**Fix:** Use `auth()` and `currentUser()` in Server Components. `useUser()` in client.
**Skill:** `clerk`, `nextjs`

---

## Stripe Mistakes

### 21. Not Verifying Webhook Signatures
**Mistake:** Processing payments without verifying webhook source.
**Why it's bad:** Fake payment confirmations, fraud.
**Fix:** Always verify Stripe webhook signatures.
**Skill:** `stripe-best-practices`, `security-and-hardening`

### 22. Storing Card Details
**Mistake:** Saving card numbers in your database.
**Why it's bad:** PCI compliance violation, security breach.
**Fix:** Never store card details. Use Stripe tokens/payment methods.
**Skill:** `stripe-best-practices`, `security-and-hardening`

### 23. Not Handling Payment Failures
**Mistake:** Assuming payment always succeeds.
**Why it's bad:** Unfulfilled orders, angry customers.
**Fix:** Handle all payment failure scenarios. Retry logic. Clear error messages.
**Skill:** `stripe-best-practices`, `debugging-and-error-recovery`

### 24. Not Using Test Mode
**Mistake:** Testing with live API keys.
**Why it's bad:** Real charges, refunds needed, financial loss.
**Fix:** Use Stripe test mode with test cards (4242 4242 4242 4242).
**Skill:** `stripe-best-practices`

### 25. Not Handling Refunds
**Mistake:** No refund flow for cancelled bookings.
**Why it's bad:** Customer disputes, chargebacks, legal issues.
**Fix:** Implement automatic refunds on cancellation. Track refund status.
**Skill:** `stripe-best-practices`

### 26. Not Idempotent Webhook Handling
**Mistake:** Processing the same webhook event twice.
**Why it's bad:** Double charges, duplicate records.
**Fix:** Use event IDs for idempotency. Check if event already processed.
**Skill:** `stripe-best-practices`, `debugging-and-error-recovery`

---

## Design & UI Mistakes

### 27. AI-Slop Aesthetics
**Mistake:** Generic AI-generated look — purple gradients, glassmorphism everywhere, no personality.
**Why it's bad:** Looks cheap, untrustworthy, indistinguishable from other AI apps.
**Fix:** Define a unique visual direction. Use brand colors consistently. Add personality.
**Skill:** `frontend-design`, `ui-design`

### 28. Not Responsive
**Mistake:** Desktop-only design, broken mobile layout.
**Why it's bad:** 60%+ of users are on mobile. Lost revenue.
**Fix:** Mobile-first design. Test at 320px, 768px, 1024px, 1440px.
**Skill:** `responsive-layout`, `ui-design`

### 29. Not Accessible
**Mistake:** No keyboard navigation, poor contrast, missing ARIA labels.
**Why it's bad:** Excludes users with disabilities. Legal liability (WCAG).
**Fix:** WCAG 2.1 AA compliance. Focus management. ARIA labels. Color contrast 4.5:1.
**Skill:** `accessible-components`, `web-design-guidelines`

### 30. No Dark Mode
**Mistake:** Light mode only.
**Why it's bad:** Poor UX in low light, battery drain on OLED screens.
**Fix:** Implement dark mode with CSS variables. Persist preference in localStorage.
**Skill:** `design-tokens-theming`, `ui-design`

### 31. Poor Empty States
**Mistake:** Blank page or "No data" text.
**Why it's bad:** Confusing, no guidance on what to do next.
**Fix:** Empty state with icon, message, and action button.
**Skill:** `empty-and-loading-states`

### 32. No Loading Skeletons
**Mistake:** Spinner or blank content while loading.
**Why it's bad:** Feels slow, users think app is broken.
**Fix:** Skeleton screens that match content layout.
**Skill:** `empty-and-loading-states`

### 33. Inconsistent Spacing
**Mistake:** Random padding/margins, no spacing system.
**Why it's bad:** Looks unprofessional, hard to maintain.
**Fix:** Use a spacing scale (4px base). Consistent spacing tokens.
**Skill:** `design-tokens-theming`, `tailwind`

### 34. Too Many Fonts
**Mistake:** Using 5+ different fonts.
**Why it's bad:** Looks chaotic, slow loading.
**Fix:** Max 2 fonts. One display, one body. Use variable fonts.
**Skill:** `design-tokens-theming`, `frontend-design`

---

## Security Mistakes

### 35. No Rate Limiting
**Mistake:** Unlimited requests to server actions/API routes.
**Why it's bad:** DoS attacks, brute force, resource exhaustion.
**Fix:** Implement rate limiting on all mutations. Token bucket algorithm.
**Skill:** `security-and-hardening`, `security-auditor`

### 36. Trusting Client-Side Data
**Mistake:** Using client-provided user IDs in queries.
**Why it's bad:** Users can access/modify other users' data.
**Fix:** Always derive user ID from server-side auth. Never trust client input.
**Skill:** `security-and-hardening`, `supabase`

### 37. No CSRF Protection
**Mistake:** State-changing actions without CSRF tokens.
**Why it's bad:** Cross-site request forgery attacks.
**Fix:** Use SameSite cookies, CSRF tokens for mutations.
**Skill:** `security-and-hardening`

### 38. Exposed Environment Variables
**Mistake:** Committing `.env` files to git.
**Why it's bad:** Secret leakage, account takeover.
**Fix:** Use `.env.example` for template. Add `.env.local` to `.gitignore`.
**Skill:** `security-and-hardening`

### 39. No Input Sanitization
**Mistake:** Rendering user input as HTML.
**Why it's bad:** XSS attacks, session hijacking.
**Fix:** Sanitize all user input. Use React's built-in XSS protection.
**Skill:** `security-and-hardening`, `secure-code-review`

### 40. Missing Security Headers
**Mistake:** No CSP, HSTS, X-Frame-Options.
**Why it's bad:** Vulnerable to XSS, clickjacking, MITM attacks.
**Fix:** Configure all security headers in `next.config.js` or middleware.
**Skill:** `security-headers`, `security-and-hardening`

---

## Performance Mistakes

### 41. No Caching Strategy
**Mistake:** Fetching data on every request.
**Why it's bad:** Slow responses, high database load, poor UX.
**Fix:** Use SWR/React Query for client caching. Use `unstable_cache` for server.
**Skill:** `server-caching-handbook`, `performance-optimization`

### 42. Not Lazy Loading
**Mistake:** Loading all components immediately.
**Why it's bad:** Slow initial page load, poor LCP.
**Fix:** Use `next/dynamic` for below-fold components. Route-based code splitting.
**Skill:** `performance-optimization`

### 43. Large Images
**Mistake:** Uploading full-size images without optimization.
**Why it's bad:** Slow page loads, high bandwidth costs.
**Fix:** Use `next/image` with responsive sizes. Compress on upload. WebP format.
**Skill:** `performance-optimization`

### 44. No CDN
**Mistake:** Serving static assets from origin server.
**Why it's bad:** Slow for users far from server.
**Fix:** Use Vercel CDN (built-in) or Cloudflare.
**Skill:** `performance-optimization`

### 45. N+1 Queries
**Mistake:** Querying database in a loop.
**Why it's bad:** Exponential query count, slow responses.
**Fix:** Use joins, batch queries, or data loaders.
**Skill:** `supabase-postgres-best-practices`

---

## Testing Mistakes

### 46. No Unit Tests
**Mistake:** Only manual testing.
**Why it's bad:** Regressions, bugs in production, fear of refactoring.
**Fix:** Write unit tests for all utility functions, validations, business logic.
**Skill:** `ci-cd-and-automation`

### 47. No E2E Tests
**Mistake:** Only unit tests, no integration tests.
**Why it's bad:** Integration bugs, broken user flows.
**Fix:** Write E2E tests for critical user flows (signup, booking, payment).
**Skill:** `ci-cd-and-automation`

### 48. Not Testing Error States
**Mistake:** Only testing happy path.
**Why it's bad:** Unhandled errors in production, poor UX.
**Fix:** Test all error scenarios: network failure, invalid input, unauthorized.
**Skill:** `debugging-and-error-recovery`

### 49. Not Testing Accessibility
**Mistake:** Only testing visual appearance.
**Why it's bad:** Excludes users with disabilities, legal liability.
**Fix:** Test keyboard navigation, screen readers, color contrast.
**Skill:** `accessible-components`, `web-design-guidelines`

### 50. Not Testing Performance
**Mistake:** Only testing functionality.
**Why it's bad:** Slow app, poor Core Web Vitals, high bounce rate.
**Fix:** Run Lighthouse audits. Monitor CWV. Set performance budgets.
**Skill:** `performance-audit`, `performance-profiler`

---

## Deployment Mistakes

### 51. No CI/CD Pipeline
**Mistake:** Manual deployment.
**Why it's bad:** Human error, inconsistent deployments, no rollback.
**Fix:** Set up GitHub Actions for automated testing + deployment.
**Skill:** `ci-cd-and-automation`, `github-actions-builder`

### 52. No Environment Separation
**Mistake:** Same database for dev/staging/production.
**Why it's bad:** Data corruption, testing with real user data.
**Fix:** Separate Supabase projects for each environment.
**Skill:** `ci-cd-and-automation`

### 53. No Monitoring
**Mistake:** No error tracking or alerting.
**Why it's bad:** Don't know when things break. Slow incident response.
**Fix:** Set up Sentry for errors. Configure uptime monitoring.
**Skill:** `observability-setup`, `observability-handbook`

### 54. No Logging
**Mistake:** No application logs.
**Why it's bad:** Can't debug production issues. Can't audit actions.
**Fix:** Structured logging with correlation IDs. Centralized log aggregation.
**Skill:** `observability-handbook`, `observability-and-instrumentation`

### 55. No Backup Strategy
**Mistake:** No database backups.
**Why it's bad:** Data loss, irreversible damage.
**Fix:** Supabase automated backups. Test restore process regularly.
**Skill:** `supabase`, `ci-cd-and-automation`

---

## Payment Mistakes

### 56. Not Handling Currency Conversion
**Mistake:** Hardcoded USD prices.
**Why it's bad:** Ethiopian users can't pay. Wrong amounts.
**Fix:** Use ETB currency. Handle conversion if needed.
**Skill:** `stripe-best-practices`

### 57. Not Storing Payment History
**Mistake:** No record of transactions.
**Why it's bad:** Can't reconcile, can't refund, can't audit.
**Fix:** Store all payment attempts in `payments` table.
**Skill:** `stripe-best-practices`

### 58. Not Handling Disputes
**Mistake:** No process for chargebacks/disputes.
**Why it's bad:** Lost revenue, poor customer experience.
**Fix:** Track dispute status. Have response process.
**Skill:** `stripe-best-practices`, `debugging-and-error-recovery`

---

## Database Mistakes

### 59. Not Using Migrations
**Mistake:** Manual schema changes.
**Why it's bad:** Inconsistent environments, no rollback, lost history.
**Fix:** Use versioned migrations. Apply in order. Test on staging first.
**Skill:** `supabase`, `ci-cd-and-automation`

### 60. Not Handling Soft Deletes
**Mistake:** Hard deleting data.
**Why it's bad:** Lost history, broken references, audit trail gone.
**Fix:** Use `deleted_at` timestamp. Filter in queries.
**Skill:** `supabase-postgres-best-practices`

### 61. Not Using Enums
**Mistake:** Free-text status fields.
**Why it's bad:** Typos, inconsistent values, no validation.
**Fix:** Use PostgreSQL enums for status fields.
**Skill:** `supabase-postgres-best-practices`

### 62. Not Handling Timezones
**Mistake:** Storing local time without timezone.
**Why it's bad:** Incorrect times for users in different timezones.
**Fix:** Store all timestamps as `TIMESTAMPTZ` (UTC). Convert on display.
**Skill:** `supabase-postgres-best-practices`

---

## Authentication Mistakes

### 63. Not Handling OAuth Callbacks
**Mistake:** No callback route for OAuth providers.
**Why it's bad:** OAuth login doesn't work.
**Fix:** Create callback route. Handle errors. Redirect appropriately.
**Skill:** `auth-screens`, `clerk`

### 64. Not Storing User Preferences
**Mistake:** No way to save user settings.
**Why it's bad:** Poor UX, users have to re-enter info every time.
**Fix:** Store preferences in profile. Allow editing in settings.
**Skill:** `settings-pages`

### 65. Not Handling Account Linking
**Mistake:** Same email creates multiple accounts.
**Why it's bad:** Confusing, data fragmentation.
**Fix:** Link accounts by email. Merge profiles on sign-in.
**Skill:** `clerk`, `auth-screens`

---

## UI Component Mistakes

### 66. Not Using Compound Components
**Mistake:** Props drilling, monolithic components.
**Why it's bad:** Hard to maintain, poor reusability.
**Fix:** Use compound component pattern (e.g., `Card.Header`, `Card.Body`).
**Skill:** `component-architecture`

### 67. Not Using CVA Variants
**Mistake:** Conditional class strings.
**Why it's bad:** Inconsistent, hard to maintain, no type safety.
**Fix:** Use `cva` for variant-based styling.
**Skill:** `component-architecture`, `tailwind`

### 68. Not Using Focus Traps in Modals
**Mistake:** Tab escapes modal, focuses background.
**Why it's bad:** Accessibility violation, confusing UX.
**Fix:** Implement focus trap. Return focus on close.
**Skill:** `modals-and-dialogs`, `accessible-components`

### 69. Not Handling Destructive Confirmations
**Mistake:** Delete/cancel without confirmation.
**Why it's bad:** Accidental data loss, poor UX.
**Fix:** Confirmation dialog for all destructive actions.
**Skill:** `modals-and-dialogs`

### 70. Not Using Toast Notifications
**Mistake:** No feedback after actions.
**Why it's bad:** Users don't know if action succeeded.
**Fix:** Toast notifications for all mutations. Auto-dismiss.
**Skill:** `notifications-and-toasts`

---

## Summary: Top 10 Critical Mistakes

| # | Mistake | Severity | Skill |
|---|---|---|---|
| 1 | Not enabling RLS | Critical | `supabase` |
| 2 | Exposing secret keys | Critical | `clerk` |
| 3 | Not verifying webhooks | Critical | `stripe-best-practices` |
| 4 | No rate limiting | High | `security-and-hardening` |
| 5 | Not handling error states | High | `error-loading-not-found` |
| 6 | Not responsive | High | `responsive-layout` |
| 7 | Not accessible | High | `accessible-components` |
| 8 | No input validation | High | `forms-and-validation` |
| 9 | No caching | Medium | `server-caching-handbook` |
| 10 | No tests | Medium | `ci-cd-and-automation` |

---

## How to Use This Document

1. **Before starting a phase:** Read the relevant section.
2. **When reviewing code:** Check against this list.
3. **When debugging:** Check if the issue matches a known mistake.
4. **When adding features:** Verify you're not introducing these mistakes.

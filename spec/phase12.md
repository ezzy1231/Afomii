# Phase 12: Deployment

## Skills to Use
- `nextjs` — Production build, optimization
- `web-design-guidelines` — Performance, a11y, SEO audit
- `stripe-best-practices` — Production payment configuration
- `security-headers` — CSP, HSTS, Permissions-Policy
- `security-and-hardening` — Security best practices, hardening
- `ci-cd-and-automation` — Deployment pipeline
- `github-actions-builder` — Deployment workflows
- `observability-setup` — Health checks, alerting, dashboards
- `observability-handbook` — Log correlation, error hygiene
- `documentation-and-adrs` — Architecture decision records
- `technical-writer` — Technical documentation, API docs

## Objective
Deploy to production on Vercel with proper environment, monitoring, and security.

## Pre-deployment Checklist

### Database
- [ ] All migrations applied to production Supabase
- [ ] RLS enabled on all tables
- [ ] RPCs tested in production
- [ ] Triggers firing correctly
- [ ] Indexes created
- [ ] Seed data loaded (if needed)

### Clerk
- [ ] Production instance configured
- [ ] Webhook endpoint configured
- [ ] Sign-in/sign-up URLs set
- [ ] OAuth providers enabled (Google)
- [ ] Email templates configured
- [ ] Session duration set

### Stripe
- [ ] Production account configured
- [ ] Webhook endpoint configured
- [ ] Test mode disabled
- [ ] Payment methods enabled (card)
- [ ] Currency set to ETB

### Environment Variables
```env
# Production
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<prod_key>
CLERK_SECRET_KEY=<prod_secret>
CLERK_WEBHOOK_SECRET=<prod_webhook_secret>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<maps_key>
SENTRY_DSN=<sentry_dsn>
NEXT_PUBLIC_SITE_URL=https://urbanexplore.et

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<prod_stripe_key>
STRIPE_SECRET_KEY=<prod_stripe_secret>
STRIPE_WEBHOOK_SECRET=<prod_stripe_webhook>

# Email
RESEND_API_KEY=<resend_key>
```

### Vercel Configuration
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000" }
      ]
    }
  ]
}
```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production deployment"
   git push origin main
   ```

2. **Vercel Auto-deploy**
   - Vercel detects push to main
   - Runs `npm run build`
   - Deploys to production

3. **Verify Deployment**
   - [ ] Home page loads
   - [ ] Sign-in works
   - [ ] Sign-up works
   - [ ] Webhook creates profiles
   - [ ] Protected routes redirect correctly
   - [ ] API routes return data
   - [ ] No console errors

4. **Post-deploy**
   - [ ] Configure custom domain
   - [ ] Set up Sentry alerts
   - [ ] Monitor error rates
   - [ ] Check performance metrics

## Monitoring

### Sentry
- Error tracking for server + client
- Performance monitoring
- Session replay (optional)

### Uptime
- `/api/health` endpoint for uptime monitors
- Configure UptimeRobot or similar

### Logs
- Vercel function logs
- Supabase dashboard logs
- Clerk dashboard logs
- Stripe dashboard logs

## Security

- [ ] RLS enabled on all tables
- [ ] No secrets in client code
- [ ] Webhook signature verification
- [ ] Rate limiting on all mutations
- [ ] Zod validation on all inputs
- [ ] HTTPS only
- [ ] Security headers configured
- [ ] CORS configured
- [ ] CSP configured

## Rollback Plan

1. **Vercel Rollback**
   - Go to Vercel dashboard
   - Find previous deployment
   - Click "Rollback"

2. **Database Rollback**
   - Keep migration history
   - Can reverse migrations if needed
   - Backup before major changes

3. **Clerk Rollback**
   - Can disable OAuth providers
   - Can reset webhook endpoint
   - Can revoke sessions

4. **Stripe Rollback**
   - Can disable payment methods
   - Can refund all payments
   - Can delete products

## Verification Gate

- [ ] Production build succeeds
- [ ] All pages load correctly
- [ ] Auth flow works end-to-end
- [ ] Webhook creates profiles
- [ ] API routes return data
- [ ] No console errors
- [ ] Security headers present
- [ ] Sentry receiving errors
- [ ] Uptime monitor configured
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Stripe payments process correctly

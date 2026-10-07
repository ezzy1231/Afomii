# Phase 10: API Routes & Webhooks

## Skills to Use
- `supabase` — Database operations, RLS, RPCs
- `clerk` — Webhook handlers, auth verification
- `stripe-best-practices` — Payment intents, webhooks, refunds
- `nextjs` — API routes, route handlers
- `server-caching-handbook` — API response caching
- `debugging-and-error-recovery` — Error handling, recovery patterns

## Objective
Build all API routes, Clerk webhooks, Stripe payment webhooks, and geo proxy endpoints.

## Files to Create

### `apps/web/app/api/health/route.ts` — Health Check
```typescript
export async function GET() {
  // Check Supabase reachability
  // Return { status: 'ok', timestamp: new Date().toISOString() }
}
```

### `apps/web/app/api/notifications/user/route.ts` — User Notifications
```typescript
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ notifications: [], unread: 0 }, { status: 401 })
  
  // Look up profile by clerk_user_id
  // Fetch notifications + unread count
  // Return { notifications: [...], unread: number }
}
```

### `apps/web/app/api/plans/user/route.ts` — User Plans
```typescript
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ plans: [] }, { status: 401 })
  
  // Look up profile by clerk_user_id
  // Call getConsumerPlans(profile.id)
  // Return { plans: [...] }
}
```

### `apps/web/app/api/webhooks/clerk/route.ts` — Clerk Webhook
```typescript
export async function POST(req: Request) {
  // Verify webhook signature using svix
  // Handle user.created → insert profile
  // Handle user.updated → update profile
  // Handle user.deleted → delete profile
}
```

### `apps/web/app/api/payments/webhook/route.ts` — Stripe Webhook
```typescript
export async function POST(req: Request) {
  // Verify Stripe webhook signature
  // Handle payment_intent.succeeded → update payment status
  // Handle payment_intent.payment_failed → notify user
  // Handle charge.refunded → update booking status
}
```

### `apps/web/app/api/payments/create-intent/route.ts` — Create Payment Intent
```typescript
export async function POST(req: Request) {
  const { entityType, entityId, amount, currency } = await req.json()
  // Create Stripe PaymentIntent
  // Return { clientSecret, paymentIntentId }
}
```

### `apps/web/app/api/geo/search/route.ts` — Place Search Proxy
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return NextResponse.json({ results: [] })
  
  // Check cache (in-memory Map with TTL)
  // Fetch from Nominatim: https://nominatim.openstreetmap.org/search?q=...&format=json
  // Cache results for 5 minutes
  // Return { results: [{ name, lat, lng, type }] }
}
```

### `apps/web/app/api/geo/route/route.ts` — Route Proxy
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')  // "lat,lng"
  const to = searchParams.get('to')      // "lat,lng"
  
  // Check cache
  // Fetch from OSRM: https://router.project-osrm.org/route/v1/driving/...
  // Fallback to Haversine straight-line if OSRM fails
  // Return { distance, duration, geometry }
}
```

### `apps/web/app/api/places/saved/route.ts` — Saved Places Hydration
```typescript
export async function POST(req: Request) {
  const { ids } = await req.json()
  // Fetch full place data for given IDs from Supabase
  // Return { places: [...] }
}
```

### `apps/web/app/api/rides/dispatch-link/route.ts` — Ride Dispatch
```typescript
export async function POST(req: Request) {
  const { provider, pickupLat, pickupLng, destLat, destLng, destName } = await req.json()
  
  // Generate deep link URL for provider:
  // Uber: uber://?action=setPickup&dropoff[latitude]=...
  // Yango: yango://...
  // Lyft: lyft://...
  // Feres: feres://...
  
  // Return { url, provider }
}
```

### `apps/web/app/api/follow/route.ts` — Follow/Unfollow
```typescript
export async function POST(req: Request) {
  const { targetType, targetId, action } = await req.json()
  // Add or remove follow record
  // Return new follower count
}
```

### `apps/web/app/api/loyalty/route.ts` — Loyalty Points
```typescript
export async function GET() {
  // Get current user's points, tier, history
}

export async function POST(req: Request) {
  // Award points for booking/review
  // Update tier if threshold reached
}
```

### `apps/web/app/api/search/route.ts` — Advanced Search
```typescript
export async function GET(request: Request) {
  // Full-text search across restaurants, events, hotels
  // Filter by: location, category, price, rating, date
  // Sort by: relevance, distance, rating, price
  // Return paginated results
}
```

### `apps/web/app/api/analytics/user/route.ts` — User Analytics
```typescript
export async function GET() {
  // Get user's booking history, spending, activity
  // Return charts data
}
```

## Webhook Configuration

### Clerk Webhook
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://<domain>/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET` env var

### Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://<domain>/api/payments/webhook`
3. Subscribe to: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET` env var

## Verification Gate

- [ ] Health check returns 200
- [ ] Notifications API returns data for authenticated user
- [ ] Plans API returns data for authenticated user
- [ ] Clerk webhook creates profile on user.created
- [ ] Clerk webhook updates profile on user.updated
- [ ] Clerk webhook deletes profile on user.deleted
- [ ] Stripe webhook processes payments correctly
- [ ] Stripe payment intent creation works
- [ ] Geo search returns results from Nominatim
- [ ] Geo route returns distance/duration from OSRM
- [ ] Saved places hydration works
- [ ] Ride dispatch generates correct deep links
- [ ] Follow/unfollow works
- [ ] Loyalty points award correctly
- [ ] Advanced search returns results
- [ ] User analytics returns data
- [ ] All endpoints return 401 for unauthenticated requests
- [ ] `npx tsc --noEmit` passes

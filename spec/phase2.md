# Phase 2: Authentication

## Skills to Use
- `clerk` — Clerk setup, webhooks, middleware, auth patterns
- `auth-screens` — Sign-in/sign-up/forgot/reset flows, OAuth buttons
- `onboarding-flows` — Multi-step signup wizards, role selection
- `nextjs` — Server components, middleware, route protection
- `security-and-hardening` — Auth security, session management

## Objective
Integrate Clerk authentication with Supabase profile sync, middleware protection, and role-based access control.

## Architecture

```
User → Clerk (auth) → Webhook → Supabase profiles table
                  ↓
           Middleware (protects routes)
                  ↓
           Server Components (auth() + profile lookup)
```

## Files to Create

### `apps/web/lib/clerk/helpers.ts`
Server-side auth utilities:
- `getCurrentUserProfile()` — Returns `{ user: ClerkUser, profile: Profile } | { user: null, profile: null }`
- `getCurrentProfile()` — Returns `Profile | null`
- `hasRole(role)` — Returns `boolean`
- `requireAuth()` — Throws if not authenticated, returns `userId`
- `requireRole(role)` — Throws if wrong role, returns `{ userId, profile }`

### `apps/web/app/api/webhooks/clerk/route.ts`
Clerk webhook handler:
- Verify webhook signature using `svix`
- `user.created` → Insert profile with `clerk_user_id`, `email`, `full_name`, `role` from `unsafe_metadata`
- `user.updated` → Update profile `email`, `full_name`
- `user.deleted` → Delete profile

### `apps/web/middleware.ts`
Route protection:
- Use `clerkMiddleware()` wrapper
- Protected routes: `/dashboard`, `/settings`, `/plans`
- Role-based redirects:
  - `/dashboard/restaurant/*` → requires `food_business`
  - `/dashboard/organizer/*` → requires `event_organizer`
  - `/dashboard/admin/*` → requires `system_admin`
- Suspended users → redirect to `/auth/suspended`
- Unauthenticated → redirect to `/sign-in?redirect_url=<path>`
- Exclude `/api/webhooks` from auth

### `apps/web/app/sign-in/[[...sign-in]]/page.tsx`
Clerk sign-in catch-all:
```tsx
import { SignIn } from '@clerk/nextjs'
export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

### `apps/web/app/sign-up/[[...sign-up]]/page.tsx`
Clerk sign-up catch-all:
```tsx
import { SignUp } from '@clerk/nextjs'
export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
```

### `apps/web/app/auth/signin/page.tsx`
Custom sign-in page:
- Email/password form using `useSignIn()`
- Google OAuth button using `signIn.authenticateWithRedirect()`
- On success: look up profile role, redirect to role-appropriate dashboard
- Error handling with user-friendly messages
- Link to sign-up

### `apps/web/app/auth/signup/user/page.tsx`
Customer signup (3 steps):
- Step 1: Full name, email, password, confirm password
- Step 2: Language, birth date, gender, country, city, phone
- Step 3: Dietary preferences, allergies
- Uses `useSignUp()` with `unsafeMetadata: { role: 'customer', ... }`
- On success: redirect to `/`

### `apps/web/app/auth/signup/business/page.tsx`
Business signup (4 steps):
- Step 1: Contact name, email, password
- Step 2: Business name, category, description
- Step 3: Address, city, country, phone, website
- Step 4: Plan selection (free/premium)
- Uses `useSignUp()` with `unsafeMetadata: { role: 'food_business', ... }`
- On success: redirect to `/dashboard/restaurant`

### `apps/web/app/auth/signup/organizer/page.tsx`
Organizer signup (4 steps):
- Step 1: Contact name, email, password
- Step 2: Org name, category, description
- Step 3: Address, city, country, phone, website
- Step 4: Plan + payout details + consent
- Uses `useSignUp()` with `unsafeMetadata: { role: 'event_organizer', ... }`
- On success: redirect to `/dashboard/organizer`

### `apps/web/app/auth/role/page.tsx`
Role selection page:
- Shows 3 cards: Explorer, Food Business, Event Organizer
- If already authenticated: calls `assignRole` server action
- If not authenticated: links to signup pages

### `apps/web/app/auth/role/actions.ts`
`assignRole` server action:
- Validates role (no self-service admin)
- Upserts profile with selected role
- Provisions business/organizer record if needed
- Redirects to role-appropriate dashboard

### `apps/web/app/auth/callback/route.ts`
Legacy redirect:
- Redirects to `/sign-in` with `redirect_url` param

### `apps/web/app/auth/suspended/page.tsx`
Suspended notice:
- Shows suspension message
- Sign out button (Clerk)
- Link to home

### `apps/web/app/auth/no-access/page.tsx`
No admin access notice:
- Shows "no admin access" message
- Sign in with another account link
- Back to main site link

### `apps/web/app/settings/SignOutButton.tsx`
Sign out button:
- Uses `useClerk().signOut()`
- Redirects to home

### `apps/web/stores/clerk-auth-store.ts`
Client-side auth store:
- `profile` — Current user's Supabase profile
- `setProfile(profile)` — Set profile
- `clearProfile()` — Clear profile

### `apps/web/hooks/use-api.ts`
React Query hooks using Clerk tokens:
- `useDashboard(businessId)` — Business dashboard data
- `useReservations(branchId)` — Branch reservations
- `useUpdateReservationStatus()` — Mutation for status updates
- `useCheckAvailability()` — Mutation for slot availability
- `useEventAnalytics(organizerId)` — Organizer analytics

## Verification Gate

- [ ] Sign up as customer → profile created in Supabase with `clerk_user_id`
- [ ] Sign up as business → profile + business record created
- [ ] Sign up as organizer → profile + organizer record created
- [ ] Sign in with email/password → redirected to correct dashboard
- [ ] Sign in with Google OAuth → profile synced
- [ ] Sign out → session cleared
- [ ] Protected routes redirect to sign-in when logged out
- [ ] Role-based redirects work (customer can't access /dashboard/restaurant)
- [ ] Suspended user redirected to /auth/suspended
- [ ] Webhook creates/updates/deletes profiles correctly
- [ ] `npx tsc --noEmit` passes

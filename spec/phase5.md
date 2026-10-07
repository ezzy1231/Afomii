# Phase 5: Auth Pages

## Skills to Use
- `auth-screens` — Login/signup/forgot/reset, OAuth buttons
- `onboarding-flows` — Multi-step wizards, setup checklists
- `forms-and-validation` — react-hook-form + zod + shadcn Form
- `clerk` — Clerk components, hooks, redirects
- `accessible-components` — WCAG AA, focus management, ARIA
- `error-loading-not-found` — Error states, loading states

## Objective
Build the complete authentication flow: sign-in, sign-up (3 roles), role selection, and auth utility pages.

## Files to Create

### `apps/web/app/auth/layout.tsx`
Auth layout:
- Centered card container
- Logo + branding
- No navbar/footer

### `apps/web/app/auth/signin/page.tsx` — Sign In
Features:
- Email + password form
- "Continue with Google" OAuth button
- Email verification flow (resend code)
- Role-based redirect after sign-in:
  - `customer` → `/` or `next` param
  - `food_business` → `/dashboard/restaurant`
  - `event_organizer` → `/dashboard/organizer`
  - `system_admin` → `/dashboard/admin`
- Error messages (invalid credentials, rate limit, etc.)
- Link to sign-up
- Link to forgot password

### `apps/web/app/auth/signup/user/page.tsx` — Customer Signup
3-step wizard with `SignupStepper`:

**Step 1 — Account:**
- Full name, email, password, confirm password
- Validation: name required, email format, password ≥ 8 chars, passwords match

**Step 2 — About You:**
- Language (en/am/fr/ar), birth date (GC/EC calendar), gender, country, city, phone
- Calendar sync toggle

**Step 3 — Preferences:**
- Dietary preferences (multi-select chips): Vegetarian, Vegan, Halal, etc.
- Allergies (multi-select chips): Peanuts, Dairy, Gluten, etc.

On submit:
```typescript
await signUp.create({
  emailAddress: form.email,
  password: form.password,
  firstName, lastName,
  unsafeMetadata: {
    role: 'customer',
    full_name, language, birth_date, birth_calendar,
    gender, phone, city, country, calendar_sync,
    dietary_prefs, allergies,
  },
})
```

### `apps/web/app/auth/signup/business/page.tsx` — Business Signup
4-step wizard:

**Step 1 — Account:** Contact name, email, password
**Step 2 — Business:** Business name, category picker, description
**Step 3 — Location:** Address, city, country, phone, website
**Step 4 — Plan:** Free / Premium Monthly / Premium Yearly

On submit:
```typescript
unsafeMetadata: {
  role: 'food_business',
  full_name, business_name, business_category,
  business_description, business_address, business_city,
  business_country, business_phone, business_website, business_plan,
}
```

### `apps/web/app/auth/signup/organizer/page.tsx` — Organizer Signup
4-step wizard:

**Step 1 — Account:** Contact name, email, password
**Step 2 — Organization:** Org name, category picker, description
**Step 3 — Location:** Address, city, country, phone, website
**Step 4 — Payout + Plan:** Payout details (bank, account holder, account number), plan selection, consent checkbox

On submit:
```typescript
unsafeMetadata: {
  role: 'event_organizer',
  full_name, org_name, org_category, org_description,
  org_address, org_city, org_country, org_phone, org_website,
  org_plan, org_payout_bank, org_payout_account_holder, org_payout_account_number,
}
```

### `apps/web/app/auth/role/page.tsx` — Role Selection
- 3 cards: Explorer, Food Business, Event Organizer
- If authenticated: clicking a card calls `assignRole` action
- If not authenticated: links to respective signup page
- Prevents self-service admin selection

### `apps/web/app/auth/role/RoleClient.tsx`
Client component for role cards:
- Card grid with icons, descriptions, "Get started" buttons
- Loading state during role assignment

### `apps/web/app/auth/role/actions.ts`
`assignRole` server action:
- Validate role (no `system_admin`)
- Rate limit (5 per minute)
- Upsert profile with `clerk_user_id` + role
- Provision business/organizer record if needed
- Redirect to role dashboard

### `apps/web/app/auth/callback/route.ts`
Legacy OAuth redirect:
- Redirects to `/sign-in?redirect_url=<next>`

### `apps/web/app/auth/suspended/page.tsx`
- Suspension notice
- Sign out button
- Link to home

### `apps/web/app/auth/no-access/page.tsx`
- "No admin access" message
- Shows signed-in user's email
- Sign in with another account link
- Back to main site link

### `apps/web/app/auth/forgot-password/page.tsx`
- Email input
- Uses Clerk's `signIn.create({ strategy: 'reset_password_email_code' })`
- Success/error states

## Verification Gate

- [ ] Sign in with email/password works
- [ ] Sign in with Google OAuth works
- [ ] Customer signup creates profile with role='customer'
- [ ] Business signup creates profile + business record
- [ ] Organizer signup creates profile + organizer record
- [ ] Role selection assigns role and redirects correctly
- [ ] Suspended user sees suspension page
- [ ] Non-admin sees no-access page on /dashboard/admin
- [ ] Forgot password sends reset email
- [ ] All forms validate input
- [ ] `npx tsc --noEmit` passes

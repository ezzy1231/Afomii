# Phase 3: Design System

## Skills to Use
- `frontend-design` — Define visual direction, avoid AI-slop aesthetics
- `ui-design` — Build/audit UI, dark mode, responsive design
- `design-tokens-theming` — Color/typography/spacing scales, CSS variables
- `component-architecture` — Compose shadcn/ui, cva variants, compound components
- `accessible-components` — WCAG AA, focus management, ARIA, keyboard nav
- `shadcn` — shadcn/ui with Radix/Base UI primitives
- `tailwind` — Tailwind v4 optimization, utility patterns
- `responsive-layout` — App shell, sidebar, breakpoints, container queries
- `dashboard-layout` — KPI cards, chart placement, overview grids
- `empty-and-loading-states` — Skeletons, empty states, error+retry
- `modals-and-dialogs` — Dialog/sheet/drawer, focus trap, destructive confirm
- `navigation-patterns` — Sidebar nav, tabs, breadcrumbs

## Objective
Build the complete UI component library, design tokens, and layout system.

## Design Language

**"Glass" design** — Dark navy background with glass-morphism cards, ember accent color, gold premium highlights, smooth Framer Motion animations.

### Color System
```css
/* Light mode */
--bg: #F8FAFC
--surface: #FFFFFF
--surface-elevated: #FFFFFF
--border: #E2E8F0
--fg: #0F172A
--muted: #64748B
--accent: #E11D48
--accent-hover: #BE123C
--gold: #D4A853
--success: #059669
--danger: #DC2626
--warning: #F59E0B

/* Dark mode */
--bg: #0F172A
--surface: #1E293B
--surface-elevated: #334155
--border: #475569
--fg: #F8FAFC
--muted: #94A3B8
```

### Typography
- Display: Space Grotesk (self-hosted variable font, weights 300-700)
- Body: System font stack
- Scale: text-xs(12), text-sm(14), text-base(16), text-lg(18), text-xl(20), text-2xl(24), text-3xl(30), text-4xl(36)

## Files to Create

### `apps/web/app/globals.css`
- Tailwind directives
- CSS custom properties for both themes
- `[data-theme="dark"]` overrides
- Custom utility classes: `.card-elevated`, `.input-premium`, `.btn-primary`, `.btn-secondary`, `.eyebrow`
- Font-face for Space Grotesk variable font

### `apps/web/tailwind.config.ts`
- Extend with brand colors
- Dark mode: `[data-theme="dark"]` selector
- Custom shadows: `shadow-soft`, `shadow-elevated`
- Custom animations: `fade-in-up`, `fade-in`, `slide-in`

### `apps/web/app/layout.tsx`
Root layout:
- `<ClerkProvider>` wrapping body
- Theme init script (beforeInteractive)
- `<Providers>` (React Query)
- `<OAuthCodeCatcher>`
- Metadata + viewport config
- Self-hosted Space Grotesk font

### `apps/web/app/providers.tsx`
React Query provider:
- QueryClient with default options
- 60s stale time, 3 retries

### `apps/web/app/template.tsx`
Framer Motion route transitions:
- Wrap children in motion.div
- Fade + slide on route change

### UI Primitives (`apps/web/components/ui/`)

#### `button.tsx`
- CVA variants: `primary`, `accent`, `outline`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- Loading state with spinner
- As-child support

#### `card.tsx`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- Elevated variant with shadow
- Hover lift animation

#### `badge.tsx`
- `Badge` with variants: `default`, `success`, `warning`, `danger`, `premium`
- `StatusBadge` — maps status strings to color variants

#### `input.tsx`
- Styled input with label, error, icon support
- Variants: `default`, `premium`

#### `select.tsx`
- Styled select with label, error

### Pattern Components (`apps/web/components/patterns/`)

#### `SectionHeader.tsx`
- Eyebrow text, title, optional link

#### `SkeletonCard.tsx`
- Loading skeleton for cards

#### `EmptyState.tsx`
- Icon, title, message, optional action button

#### `StickyActionBar.tsx`
- Mobile sticky bottom bar with primary/secondary actions

#### `CategoryChips.tsx`
- Horizontal scrollable chip selector

#### `TierRow.tsx`
- Ticket tier display with quantity stepper

#### `Badges.tsx`
- `VerifiedBadge`, `PremiumBadge`

#### `ListingCard.tsx`
- Catalogue card with image, title, rating, distance
- Regular + large variants

#### `FilterSheet.tsx`
- Mobile filter sheet with groups

#### `DateBadge.tsx`
- Month/day display badge

### Motion Components (`apps/web/components/motion/`)

#### `index.tsx`
- `Reveal` — Fade in on scroll
- `StaggerGroup` — Container for staggered children
- `StaggerItem` — Individual staggered item
- `Sticker` — Sticker-style animation
- `HoverLift` — Hover lift effect

### Layout Components (`apps/web/components/`)

#### `Navbar.tsx`
- Logo, nav links, auth state
- Notification bell with unread count
- Theme toggle
- Mobile hamburger menu
- Uses `useUser()` from Clerk + profile lookup

#### `NavLinks.tsx`
- Desktop nav links: Home, Restaurants, Events, Hotels, Ride, My Plans

#### `MobileNavigation.tsx`
- Bottom tab bar for mobile

#### `Footer.tsx`
- Site footer with link groups

#### `PageFooter.tsx`
- Gated footer (hidden for signed-in users except on home)

#### `ThemeToggle.tsx`
- Dark/light toggle with localStorage persistence

## Verification Gate

- [ ] All components render without errors
- [ ] Dark/light theme toggle works
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] Framer Motion animations play correctly
- [ ] All CVA variants render correctly
- [ ] `npx tsc --noEmit` passes
- [ ] No console warnings

---
name: UrbanExplore
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d8'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1b'
  on-surface-variant: '#44474d'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#75777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4d5f7d'
  primary: '#000615'
  on-primary: '#ffffff'
  primary-container: '#0b1f3a'
  on-primary-container: '#7587a7'
  inverse-primary: '#b5c7ea'
  secondary: '#705b32'
  on-secondary: '#ffffff'
  secondary-container: '#f9dca8'
  on-secondary-container: '#756036'
  tertiary: '#0b0500'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d1b00'
  on-tertiary-container: '#a3814e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b5c7ea'
  on-primary-fixed: '#071c36'
  on-primary-fixed-variant: '#364764'
  secondary-fixed: '#fcdfab'
  secondary-fixed-dim: '#dfc391'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#57441d'
  tertiary-fixed: '#ffddb1'
  tertiary-fixed-dim: '#e8c088'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#5d4215'
  background: '#fcf9f8'
  on-background: '#1b1c1b'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-eyebrow:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.15em
  price-tag:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '700'
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

This design system establishes a **Warm Editorial Premium** aesthetic, specifically tailored for the cosmopolitan landscape of Addis Ababa. It bridges the gap between high-end editorial magazines and functional utility, positioning the product as a curator of the city's finest experiences.

The visual narrative is built on high-contrast pairings: the intellectual authority of classic serifs against the modern efficiency of clean sans-serifs. The atmosphere is sophisticated yet welcoming, evoking the feeling of a concierge service. Every interaction is designed to feel deliberate and polished, favoring whitespace and structured hierarchy over visual noise.

Key tenets include:
- **Trust through Clarity:** Utilizing a "Safe" visual identity that emphasizes reliability and established presence.
- **Warmth through Color:** Avoiding sterile grays in favor of ivory and gold tones to reflect local hospitality.
- **Editorial Pace:** Using large typography and generous margins to allow content to breathe.

## Colors

The palette is anchored by **Deep Navy**, providing a sense of stability and institutional trust. This is softened by an **Ivory** background, which provides a more organic, paper-like feel than pure white, reducing eye strain and enhancing the "premium" editorial vibe.

**Antique Gold** serves as the primary accent, used for high-level labels and key calls to action. To ensure accessibility, a darker variant (#927140) is mandated for any gold-colored text appearing on light backgrounds.

The Admin/Partner interface shifts to a dark-mode environment to distinguish management tasks from the consumer experience. This mode utilizes a deep obsidian navy to maintain brand consistency while providing a focused, low-distraction workspace.

## Typography

Typography is the cornerstone of this design system. We utilize a dual-font strategy to balance character with legibility:

- **Playfair Display:** Used for headlines, titles, and prices. Its high-contrast strokes and elegant terminals evoke luxury and editorial authority. Prices must always use `tabular-nums` to ensure vertical alignment in lists and receipts.
- **Inter:** The functional workhorse. Used for all body copy, UI labels, and input text. Its neutral, utilitarian nature ensures that even complex information (like taxi fare breakdowns or menu descriptions) remains highly readable.

**Eyebrow Labels:** All secondary categorization or "kickers" above headlines must be 11px, uppercase, with 0.15em letter-spacing, set in the Antique Gold accent color.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with strict horizontal margins to maintain the editorial "frame." 

On mobile devices, a 4-column grid is used with 20px outer margins. For tablet and desktop, the system scales to a 12-column grid. Large-scale content carousels (Restaurants, Events) must utilize **horizontal scroll-snap** on mobile to allow for rapid scanning without vertical bloat.

The rhythm is based on an 8px scale, though 4px and 12px units are permitted for tight UI clusters. Generous vertical spacing (xl, xxl) should be used between major sections to prevent a cluttered "discount marketplace" appearance.

## Elevation & Depth

Depth in this design system is communicated through **Soft Ambient Shadows** and **Tonal Layering** rather than heavy borders.

- **Level 1 (Cards):** Uses a very soft shadow (`0 4px 20px rgba(0,0,0,.06)`) against the Ivory background. This creates a subtle lift that makes the content feel physically present but not detached.
- **Level 2 (Overlays/Modals):** A slightly more aggressive shadow with a higher blur radius to indicate temporary focus.
- **Interactive Depth:** On hover or active states, elements should "lift" by -2px with a 150ms ease-out transition.

We avoid heavy inner shadows or skeuomorphic gradients, maintaining a modern flat-plus aesthetic that prioritizes content over container.

## Shapes

The shape language combines structured reliability with approachable softness:

- **Cards & Containers:** Use a generous `rounded-lg` (16px) or `rounded-xl` (24px) radius. This prevents the high-contrast Deep Navy from feeling too aggressive or "sharp."
- **Interactive Elements:** Buttons and Chips/Pills are **fully rounded (pill-shaped)**. This provides a clear visual distinction between static content containers and tappable interface triggers.
- **Touch Targets:** All interactive shapes must maintain a minimum 44px height/width to ensure ease of use during travel or on-the-go taxi booking.

## Components

### Buttons
- **Primary:** Deep Navy background, Ivory text, pill-shaped.
- **Secondary:** Antique Gold (Text-on-light variant) outline, pill-shaped.
- **Ghost:** No background, Deep Navy text, bold weight.

### Cards
- Always White (#FFFFFF) background. 
- 16px padding for standard cards; 24px for featured editorial cards.
- Images within cards should have a subtle 4px internal corner radius or bleed to the top edges.

### Navigation (Mobile)
- **Floating Pill Bottom Nav:** A semi-transparent or solid Deep Navy pill containing 5 icons (Home, Eat, Events, Ride, Account). It should float 16px from the bottom edge.
- **Sticky Action Bar:** For detail pages (e.g., booking a taxi or table), a sticky Ivory bar at the bottom provides the primary "Book Now" action.

### Inputs
- Clean, underlined or soft-bordered fields with Inter 16px.
- Labels use the "Eyebrow" style (11px Uppercase Gold) when focused or filled.

### List Items
- Used for taxi ride history or menu items.
- High-contrast typography with Playfair Display for the item title and tabular-nums for the price on the right-hand side.
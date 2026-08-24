---
name: Premium Hospitality & Mobility System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#44474d'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
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
  tertiary: '#060605'
  on-tertiary: '#ffffff'
  tertiary-container: '#1f1f1c'
  on-tertiary-container: '#888682'
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
  tertiary-fixed: '#e5e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1c1c19'
  on-tertiary-fixed-variant: '#474743'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system embodies a **Traditional Luxury** aesthetic, specifically tailored for a high-end hospitality and logistics platform. The visual narrative balances the dependability of classic institutional design with the sleekness of modern digital interfaces. It targets an audience that values efficiency but demands a premium, "white-glove" experience.

The design style is **Corporate / Modern** with a **Tactile** edge. It utilizes an ivory-based light mode to create an open, editorial feel, contrasted sharply by deep navy navigation elements and rich gold accents. This high-contrast approach ensures that critical actions feel significant and "rewarding," mimicking the golden-hour ambiance of fine dining and exclusive events.

Key brand pillars:
- **Sophistication:** High-contrast serif headings paired with utilitarian body text.
- **Reliability:** A structured grid and clear tonal layering provide a sense of security.
- **Warmth:** The use of ivory and soft-gold instead of pure white/yellow creates a more inviting, premium atmosphere.

## Colors

The color palette is anchored by the interplay between **Deep Navy (#0B1F3A)** and **Muted Gold (#C2A878)**. 

- **Primary (Deep Navy):** Reserved for headers, primary navigation, and high-importance interaction states. It provides a heavy, grounded foundation.
- **Secondary (Muted Gold):** Used sparingly for "Premium" tags, highlights, and specific call-to-action buttons. It acts as a signature of quality.
- **Tertiary (Ivory):** The primary background color. Unlike sterile white, Ivory (#F8F5F0) reduces eye strain and reinforces the luxury hospitality theme.
- **Neutral (Charcoal):** Used for primary body text to maintain high legibility against the ivory background without the harshness of pure black.

**Functional Color Usage:**
- Use the Navy for "Book Now" or "Confirm" actions.
- Use the Gold for rewards, premium features, or "Featured" event badges.
- Use a soft charcoal (#8A8A8A) for secondary metadata and captions.

## Typography

The typography strategy employs a "High-Low" pairing. **Playfair Display** provides an editorial, sophisticated voice for headlines, capturing the elegance of a premium menu or event invitation. **Inter** handles the functional requirements of the app, ensuring that complex data like ride prices and event times remain legible at a glance.

**Hierarchy Rules:**
- **Headlines:** Always use Playfair Display. Reserve Display sizes for hero sections and event titles.
- **Body & Data:** Always use Inter. Use `body-md` for general descriptions and `label-md` (uppercase) for category tags or small metadata titles.
- **Contrast:** Maintain a minimum 4.5:1 contrast ratio. On Navy backgrounds, text should primarily be Ivory or Gold.

## Layout & Spacing

The design system utilizes a **Fixed Grid** for desktop and a **Fluid Grid** for mobile. This ensures that on large screens, the content maintains an elegant, centered column feel reminiscent of a printed magazine, while mobile users get a dense, edge-to-edge experience optimized for thumb reach.

- **Desktop:** 12-column grid, 1200px max-width, 24px gutters.
- **Mobile:** 4-column grid, 16px side margins, 16px gutters.
- **Spacing Rhythm:** Based on an 8px scale. Use `md` (24px) for most container padding to ensure the UI feels "breathable" and premium.
- **Reflow:** For the "Events" and "Restaurants" listings, transition from a 1-column list on mobile to a 3 or 4-column grid on desktop.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**. Instead of heavy drop shadows, the system uses subtle, large-radius blurs to lift elements off the Ivory background.

- **Level 0 (Base):** Ivory background (#F8F5F0).
- **Level 1 (Cards):** Pure white surface (#FFFFFF) with a soft 10% opacity navy shadow. Use for restaurant cards, event listings, and input groups.
- **Level 2 (Overlays/Modals):** Pure white surface with a 20% opacity shadow and a 4px blur backdrop on the content behind it.
- **Inverted Elevation:** Navigation bars and "Book" footers use the Deep Navy color. These elements do not use shadows; they rely on color contrast to signify their presence as the top layer.

## Shapes

The shape language is **Soft**. All primary containers, buttons, and input fields use a consistent 0.25rem (4px) corner radius. This provides a professional, "tailored" appearance that avoids the playfulness of highly rounded "pill" shapes while feeling more modern than sharp 0px corners.

- **Standard Radius:** 0.25rem (4px) for buttons and inputs.
- **Large Radius (rounded-lg):** 0.5rem (8px) for cards and modular sections.
- **Extra Large Radius (rounded-xl):** 0.75rem (12px) for main dashboard containers or bottom sheets.
- **Images:** All thumbnails should carry the `rounded-lg` token to soften the photography.

## Components

### Buttons
- **Primary:** Deep Navy background, Ivory text. 0.25rem radius. Heavyweight Inter text.
- **Secondary:** Muted Gold background, Navy text. Reserved for "Premium" actions or "Featured" conversion points.
- **Ghost:** Transparent background, Navy or Gold border (1px), Navy or Gold text.

### Cards
- White background, `rounded-lg` corners, subtle ambient shadow. 
- Use a 1px soft gray (#E0E0E0) border for low-elevation cards on mobile.
- Headers within cards should use Playfair Display `headline-md`.

### Input Fields
- White background with a 1px Navy or Gray border.
- Floating labels using `label-md` tokens when focused.
- Error states should use a deep crimson, avoiding bright "neon" reds to maintain the luxury feel.

### Chips & Tags
- For "Cuisine Type" or "Ride Category," use a Navy background with Ivory text or a light Ivory background with Navy text.
- Icons within chips should be thin-line, minimalist stroke icons.

### List Items
- Clean separators using 1px borders of Ivory-Dark (#EBE8E2).
- Use `body-md` for primary list text and `label-md` for secondary metadata (e.g., "2 min away").
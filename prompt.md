 Act as a Senior Database Architect. 

Design the production PostgreSQL schema using Prisma ORM (with PostGIS extension enabled) for "FoodRide", a multi-tenant platform unifying Table Reservations, Event Ticketing, and Ride Aggregation.

### Brand Guidelines & Context
- Colors: Deep Navy (#0B1F3A), Ivory (#F8F5F0), Muted Gold (#C2A878).
- Multi-role support: Customer, RestaurantAdmin, EventOrganizer, AppAdmin.

---

### Data Models & Requirements to Build:

1. Enums:
   - UserRole (CUSTOMER, RESTAURANT_ADMIN, EVENT_ORGANIZER, SYSTEM_ADMIN)
   - ReservationStatus (PENDING, CONFIRMED, CANCELLED, COMPLETED, REJECTED)
   - BookingMode (WALK_IN_ONLY, TIME_SLOT, REQUEST_BASED)
   - TicketTier (GENERAL, VIP, EARLY_BIRD, GROUP)

2. User & Profile Models:
   - User: id, email, phone, passwordHash, role, language, country, createdAt, updatedAt.
   - UserPreferences: dietaryRestrictions (JSON / array for Vegan, Halal, Kosher, Keto, etc.), allergies (JSON / array for Peanuts, Dairy, Gluten, etc.), defaultLocation.

3. Restaurant & Dining Models:
   - BusinessProfile: id, name, category, licenseUrl, logoUrl, coverUrl, isVerified, openingHours (JSON time blocks per day).
   - BusinessBranch: id, businessId, branchName, address, location (PostGIS Point for lat/lng), phone.
   - BookingConfig: branchId, bookingMode, timeSlotDurationMinutes, totalTables, maxGuestPerTable, requirePrepayment (boolean), cancellationPolicyText.
   - MenuItem: branchId, name, price, category, imageUrl, isAvailable.

4. Event & Ticket Models:
   - Event: id, organizerId, title, description, category, venueName, location (PostGIS Point), startDateTime, endDateTime, coverImageUrl, status (DRAFT, PUBLISHED, COMPLETED).
   - TicketType: eventId, name, tier, price, totalQuantity, remainingQuantity, salesStart, salesEnd.

5. Reservation & Order Models:
   - Reservation: id, userId, branchId, reservationDate, timeSlot, guestCount, status, specialRequests, reservationCode.
   - TicketPurchase: id, userId, eventId, ticketTypeId, quantity, totalPaid, status, qrCodeHash.

6. Ride Aggregation Log:
   - RideSearchLog: id, userId, pickupLat, pickupLng, dropoffLat, dropoffLng, estimates (JSON array holding partner name, price, ETA, badge), selectedPartner, createdAt.

---

### Deliverables Required:
1. Complete schema.prisma file including proper relations (@relation), indexes (on geo-coordinates, dates, foreign keys), and unique constraints.
2. SQL Migration script for PostGIS setup (`CREATE EXTENSION IF NOT EXISTS postgis;`).
3. TypeScript interface/type definitions exported for the frontend. Act as a Senior Backend Security & Software Engineer.

Build the Authentication, Role-Based Access Control (RBAC), and Onboarding module for "FoodRide" using Node.js (TypeScript with NestJS/Express) or Python (FastAPI). Ensure full integration with the Prisma/PostgreSQL schema designed in Phase 1.

---

### Core Security & Auth Architecture Requirements

1. Token Infrastructure:
   - Implement JWT-based authentication using dual tokens: Access Tokens (short-lived, 15m) and Refresh Tokens (long-lived, 7d stored in Redis with revocation capability).
   - Password hashing using Argon2id or bcrypt (cost factor 12).
   - Middleware Guards: `AuthGuard` (verifies JWT) and `RolesGuard` (`@Roles('CUSTOMER', 'RESTAURANT_ADMIN', 'EVENT_ORGANIZER', 'SYSTEM_ADMIN')`).

2. Input Validation (Zod / Pydantic):
   - Strict request body validation schemas for all registration, login, and profile update endpoints.

---

### API Endpoints & Business Logic to Implement

#### A. Authentication Endpoints
- `POST /api/v1/auth/signup`: Base account creation (email/phone, password, role selection).
- `POST /api/v1/auth/login`: Authenticate user, issue access/refresh token pair, return user role profile.
- `POST /api/v1/auth/refresh`: Exchange valid refresh token for a new access token.
- `POST /api/v1/auth/logout`: Invalidate refresh token in Redis.

#### B. Customer Onboarding & Profile Setup
- `PATCH /api/v1/users/profile`: Update basic details (full name, phone, language, country).
- `POST /api/v1/users/preferences`: Save dietary restrictions (e.g., Vegan, Halal, Kosher, Diabetic-friendly) and allergies (e.g., Peanuts, Dairy, Gluten, Seafood).

#### C. Business & Partner Onboarding Flow
- `POST /api/v1/partners/business/register`: 
  - Register Business Name, Category (Restaurant, Café, Bar, Hotel Restaurant, etc.), Owner Name, Business Email/Phone.
  - Upload document URLs (Business License, Logo, Cover Photo).
- `POST /api/v1/partners/business/branches`: 
  - Add branch details: Address, Geo-coordinates (Latitude/Longitude formatted for PostGIS), Opening Hours (day/time windows), Cuisine Types, and Highlights (Outdoor seating, Live music, Free WiFi, Parking).
- `POST /api/v1/partners/organizer/register`:
  - Register Event Organizer profile, verification details, and payout settings.

---

### Deliverables Required:
1. Complete Auth Controller, Service layer, and Middleware implementation.
2. Zod/Pydantic validation schemas for all payload structures.
3. Unit tests/integration tests boilerplate for signup/login flows.
4. Redis refresh-token management utility script. Act as a Principal Backend & Distributed Systems Engineer.

Build the core Concurrency-Safe Reservation and Event Ticketing Engine for "FoodRide" using Node.js (TypeScript with NestJS/Express) or Python (FastAPI), Redis, and PostgreSQL/Prisma.

---

### Key Engineering Challenges & Architecture Requirements

1. Distributed Locking & Race Condition Prevention:
   - Use Redis-based distributed locks (e.g., Redlock algorithm, Mutex, or atomic Lua scripts) to handle concurrent requests for table seats and limited ticket inventory.
   - Prevent overselling when hundreds of users simultaneously request the last available table slot or event ticket tier (VIP, Early Bird).

2. Ticket Inventory Hold System (TTL Expiration):
   - Implement a temporary reservation hold (e.g., 10-minute timeout) on ticket stock during user checkout.
   - Automatically release held tickets back to the available pool if payment is not completed before the Redis TTL key expires.

3. Restaurant Table Booking Logic:
   - Support three distinct booking modes based on restaurant configuration:
     a) TIME_SLOT Mode: Automatically validate remaining table capacity per slot duration (e.g., 60m / 90m slots) against opening hours.
     b) REQUEST_BASED Mode: Create a `PENDING` reservation and notify the restaurant dashboard to Accept, Decline, or Suggest New Time.
     c) WALK_IN_ONLY Mode: Disable online advance table bookings and present status info.
   - Enforce minimum/maximum guest count rules, prepayment rules (No deposit, Fixed deposit, % of bill), and cancellation policies.

---

### API Endpoints & Business Logic to Implement

#### A. Table Reservation System
- `POST /api/v1/reservations/check-availability`: Query real-time available time slots for a branch given date and guest count.
- `POST /api/v1/reservations`: Lock table availability in Redis, create DB record in `PENDING` or `CONFIRMED` state inside a SQL transaction (`Prisma.$transaction`).
- `PATCH /api/v1/partners/reservations/:id/status`: Business owner endpoint to `ACCEPT`, `DECLINE`, or `SUGGEST_TIME` (with proposed datetime payload).

#### B. Event Ticketing System
- `POST /api/v1/events/:eventId/tickets/hold`: Acquire Redis lock on ticket tier quantity, decrement available stock key, and return a temporary hold token valid for 10 minutes.
- `POST /api/v1/events/:eventId/tickets/checkout`: Verify hold token, process payment confirmation, generate a unique reservation/QR code hash, and mark purchase as `COMPLETED`.
- `POST /api/v1/webhooks/tickets/hold-expired`: Expiration handler/cron job to clean up unconfirmed ticket holds and restore stock counts.

---

### Deliverables Required:
1. Redis Lock Utility (TypeScript/Python module with auto-release, retry interval, and TTL parameters).
2. Reservation Service & Controller with full slot conflict calculation algorithm.
3. Ticket Holding Service using Redis Keyspace Notifications or TTL expiration strategy.
4. Complete SQL/Prisma transaction logic preventing partial database states. Act as a Senior Backend Architect specializing in Third-Party API Integrations and Adapter Systems.

Build the Ride Aggregator Integration Engine for "FoodRide" using Node.js (TypeScript with NestJS/Express) or Python (FastAPI). This module takes pickup and dropoff coordinates, queries multiple ride-hailing providers in parallel, normalizes their pricing and ETA responses, and generates dispatch/deep-linking actions.

---

### Key Architectural & Design Requirements

1. Adapter Pattern Architecture:
   - Design an abstract `RideProviderAdapter` interface with standard methods:
     `getEstimates(pickup: GeoPoint, dropoff: GeoPoint): Promise<RideOption[]>`
   - Implement concrete adapter implementations for:
     a) Uber API Adapter
     b) Yango API Adapter
     c) Lyft API Adapter
     d) Feres / Local Partner Adapter
     e) MockProviderAdapter (for fallback, sandbox testing, and localized simulations)

2. Resilience & Performance Strategy:
   - Parallel Execution: Execute queries across all active adapters concurrently using `Promise.allSettled` (or asyncio.gather) to avoid one failing/slow API blocking the response.
   - Circuit Breaker & Timeout: Enforce a strict timeout (e.g., 2000ms max) per provider call. If a provider fails or times out, gracefully return results from remaining functional providers.
   - Redis Caching: Cache route estimates for identical pickup/dropoff coordinate pairs (rounded to 3 decimal places) for short intervals (e.g., 45–60 seconds) to prevent API rate-limiting.

3. Normalization & Sorting Logic:
   - Standardize responses into a unified structure containing: `providerName`, `providerLogo`, `tier` (Economy, Comfort, VIP, Bike/Moto), `estimatedPrice` (amount, currency), `currencySymbol`, `etaMinutes`, `badge` ("Fastest", "Best Value", "Local Favorite").
   - Calculate direct distance using PostGIS / Haversine formula as a fallback benchmark.

---

### API Endpoints & Business Logic to Implement

#### A. Estimates & Comparison
- `POST /api/v1/rides/estimate`:
  - Request Body: `pickupLat`, `pickupLng`, `pickupAddress`, `dropoffLat`, `dropoffLng`, `dropoffAddress`.
  - Action: Fetch quotes via adapters, apply normalization, sort by price (low-to-high) or ETA (fastest), save query metadata to `RideSearchLog` table, and return response payload.

#### B. Deep-Link & Dispatch Trigger
- `POST /api/v1/rides/dispatch-link`:
  - Request Body: `providerName`, `pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng`.
  - Action: Construct and return localized mobile app universal deep-links (e.g., `uber://`, `yango://`, `feres://`) or web redirect URLs with pre-filled route parameters.

---

### Deliverables Required:
1. `RideProviderAdapter` interface definition and data models.
2. Concrete Mock and Live Adapter class implementations for Uber, Yango, and Feres.
3. RideAggregatorService with parallel processing, timeout handling, and Redis caching logic.
4. Express/NestJS/FastAPI route controller with input validation schemas. Act as a Senior React Native Lead & UI/UX Architect.

Build the mobile application frontend for "FoodRide" using Expo (React Native), TypeScript, NativeWind (Tailwind CSS), React Navigation / Expo Router, TanStack Query (React Query v5), and Zustand.

---

### Design System & Theme Configuration

Enforce exact brand design tokens matching the design system specifications:
- Color Palette:
  - Deep Navy: `#0B1F3A` (Headers, Navigation, Primary Buttons)
  - Ivory / Soft Ivory: `#F8F5F0` / `#FFFDF8` (Main Light Backgrounds)
  - Muted Gold: `#C2A878` (Badges, Highlights, Call to Action accents)
  - Charcoal: `#2E2E2E` (Primary Text)
  - Gray: `#8A8A8A` (Secondary Subtext)
- Typography:
  - Headings: Playfair Display / Serif variant
  - Body Text: Inter / Sans-serif variant

---

### Navigation Tree & Screen Hierarchy

Design a clean Expo Router / React Navigation structure:

1. Auth & Onboarding Stack:
   - `OnboardingRoleScreen`: Account type choice (Customer, Business, Organizer).
   - `UserSignUpScreen`: Step-by-step onboarding capturing language, full name, email/phone, birthday, gender, dietary restrictions checklist (Vegan, Halal, Kosher, Diabetic-friendly, etc.), and allergies multi-select (Peanuts, Dairy, Gluten, Seafood, etc.).

2. Main Bottom Tabs (`(tabs)`):
   - `Home / Discover Tab`: Hero location header, search bar, restaurant horizontal carousel, popular event cards, "Food + Ride" combo banners.
   - `Restaurants / Food Tab`: Filterable grid by cuisine (Ethiopian, Italian, Mediterranean, etc.), map/list view toggle, real-time table availability status.
   - `Events Tab`: Monthly calendar strip, featured concert banners (e.g. Arjit Singh, Jazz Nights), category chips (Music, Food & Drink, Sports).
   - `Ride / Go Tab`: Standalone or modal ride aggregator UI.
   - `Profile / My Plans Tab`: Active reservations, event tickets (with QR code renderer), saved dietary preferences.

3. Key Detail Screens & Modals:
   - `RestaurantDetailScreen`: Hero header image, rating/reviews, branch selector, real-time table availability indicator, tab navigation (Menu, Reserve, About, Highlights, Parking, Live Music), and bottom sticky buttons ["Go by Ride", "Book a Table"].
   - `EventDetailScreen`: Event banner, date/location details, ticket tier selector (General Admission, VIP, Early Bird), seat hold countdown timer, and checkout modal.
   - `RideAggregatorModal` ("Go & Book Ride"): Origin/destination inputs, route map thumbnail, live vehicle comparison list with badges ("Fastest", "Best Price", "Local Choice"), ETAs, pricing estimates in local currency (ETB / USD), and payment selector.

---

### State Management & API Integration Logic

1. Zustand Stores:
   - `useAuthStore`: Active user token, user role, selected preferences (dietary & allergies).
   - `useBookingStore`: Active table reservation or ticket selection draft before checkout.

2. TanStack Query Custom Hooks:
   - `useNearbyRestaurants(params)`: Fetch filtered restaurants using PostGIS location.
   - `useReserveTable()`: Mutation hook that submits booking data and handles Redis lock conflicts.
   - `useRideEstimates(pickup, dropoff)`: Query hook fetching parallel estimates from Uber, Yango, Lyft, and Feres.

---

### Deliverables Required:
1. `tailwind.config.js` / `theme.ts` setup defining colors, typography, and button variants.
2. Complete Expo Router / Navigation file layout.
3. Code implementation for `Zustand` state stores and custom React Query hooks.
4. Component implementation for the `RideAggregatorModal` screen featuring partner route comparisons and badge renders.
5. Component implementation for the `RestaurantDetailScreen` with sticky bottom action buttons. Act as a Senior Web Architect & Lead Frontend Engineer.

Build the web partner dashboards for "FoodRide" using Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Lucide Icons, TanStack Query (v5), and Zustand.

---

### UI Design & Theme System

Match the high-fidelity admin dashboard layout and color hierarchy:
- Primary Background: Dark Slate / Deep Navy (`#0B1F3A`) or Light Ivory (`#F8F5F0`) toggleable theme.
- Structural Card Containers: Rounded, subtle border dividers, high contrast data tables.
- Primary Buttons & Badges: Muted Gold (`#C2A878`) accents and Deep Navy action controls.
- Typography: Clean sans-serif for numbers/analytics, elegant serif accent typography for branding headers.

---

### Dashboard Modules & Functional Screens

#### 1. Restaurant Partner Dashboard (`/dashboard/restaurant`):
- Sidebar Navigation: Overview, Reservations, Menu Management, Events, Reviews, Analytics, Promotions, Settings.
- Dashboard Overview:
  - Metric Cards: Total Reservations (with % trend vs last week), Total Views, Revenue from Bookings (ETB/USD), Conversion Rate.
  - Quick Recent Reservations list with action badges (`CONFIRMED`, `PENDING`, `CANCELLED`).
- Reservations Calendar View:
  - Day, Week, and Month toggle views showing time-slot cards with table guest counts.
  - Interactive status drawer to accept, reject, or propose alternative booking times.
- Booking Feature Configuration Panel:
  - Toggle switches for Booking Modes (`WALK_IN_ONLY`, `TIME_SLOT`, `REQUEST_BASED`).
  - Table capacity configuration inputs (Tables per slot, slot duration minutes).
  - Prepayment rule controls (No deposit, Fixed deposit, % of bill) and cancellation policy editor.
- Menu & Branch Manager:
  - Multi-branch dropdown selector.
  - Categorized menu item manager (Appetizers, Main Course, Pasta, Pizza, Desserts, Drinks) with price and availability toggles.

#### 2. Event Organizer Dashboard (`/dashboard/organizer`):
- Sidebar Navigation: Dashboard, Events, Calendar, Tickets & Attendees, Analytics, Promotions, Followers, Payouts, Settings.
- Dashboard Overview:
  - Metric Cards: Total Events, Total Followers, Profile Views, Tickets Issued, Attendance Rate %.
  - Quick Action Buttons: `+ Create Event`, `Manage Tickets`, `View Calendar`.
- Interactive Event Calendar:
  - Interactive grid showing scheduled events across the month with status pills (`Published`, `Draft`, `Completed`).
- 5-Step Create Event Wizard:
  - Step 1 (Basic Details): Title, Category, Description, Cover Image Upload.
  - Step 2 (Venue & Location): Venue Name, Map Picker / Address (PostGIS coordinates).
  - Step 3 (Date & Time): Date ranges, recurring settings, start/end time.
  - Step 4 (Ticket Tier Management): Multi-tier creation modal (General Admission, Early Bird, VIP, Group Pax) with pricing, quantity limits, and sale period dates.
  - Step 5 (Publishing & Distribution): Preview screen, draft save, and live publication toggle.
- Published Events & Analytics View:
  - Card list of live, upcoming, past, and draft events with ticket progress bars (e.g. "120/500 Sold") and instant edit/publish actions.

---

### Real-Time Updates & State Integration

1. WebSockets / SSE (Server-Sent Events):
   - Hook setup (`useRealtimeReservations`) to play audio chime and update state whenever a new table reservation or ticket purchase arrives.
2. Form Validation & Data Fetching:
   - React Hook Form + Zod schema validation for event creation and menu editing.
   - TanStack Query hooks for optimistic updates on reservation approvals and ticket tier edits.

---

### Deliverables Required:
1. Modular Next.js App Router folder structure (`/app/(dashboard)/restaurant`, `/app/(dashboard)/organizer`).
2. Reusable UI components for Metric Summary Cards, Reservation Calendar Grid, and Status Badges.
3. Multi-tier Ticket Creator form component with dynamic field arrays.
4. Complete Zod schemas for event creation and restaurant configuration forms. 
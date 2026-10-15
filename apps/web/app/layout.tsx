import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import OAuthCodeCatcher from "@/components/OAuthCodeCatcher";
import { getSiteUrl } from "@/lib/site";

/* Self-hosted variable fonts — no external requests, works offline.
   "Evening Ledger" pairs Bricolage Grotesque (display) with Instrument Sans
   (body). Space Grotesk is still loaded as --font-dashboard: the partner and
   admin console pins its own type back to it in globals.css, so the
   dashboards keep the exact typography they shipped with. */
const bricolage = localFont({
  src: [
    {
      path: "../public/fonts/bricolage-grotesque-var.woff2",
      weight: "500 800",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const instrumentSans = localFont({
  src: [
    {
      path: "../public/fonts/instrument-sans-var.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../public/fonts/instrument-sans-var-ext.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-space",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const spaceGrotesk = localFont({
  src: [
    {
      path: "../public/fonts/space-grotesk-var.woff2",
      weight: "300 700",
      style: "normal",
    },
  ],
  variable: "--font-dashboard",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "UrbanExplore — Restaurants, Events & Rides",
    template: "%s | UrbanExplore",
  },
  description:
    "Discover the best restaurants, book unforgettable events, and get a ride — all in one place.",
  openGraph: {
    title: "UrbanExplore",
    description: "Discover restaurants, book events, get a ride.",
    type: "website",
    siteName: "UrbanExplore",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "UrbanExplore" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UrbanExplore",
    description: "Discover restaurants, book events, get a ride.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

/* Mirrors --bg-primary-rgb in globals.css for each theme. The app toggles the
   theme with data-theme, but the browser chrome picks a colour per colour-scheme
   media query, so both are listed. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#0C101A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${bricolage.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-app-bg text-app-fg">
        {/* Every public page has a sticky header plus a fixed bottom nav, so
            keyboard users otherwise tab through 2-3 stops before content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-ember focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-on-accent focus:shadow-elevate"
        >
          Skip to content
        </a>
        <Script id="theme-init" strategy="beforeInteractive">
        {`try{var t=localStorage.getItem('urbanexplore-theme');document.documentElement.dataset.theme=(t==='dark'||t==='light')?t:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch(e){document.documentElement.dataset.theme='light';}`}
        </Script>
        <Providers>
        <OAuthCodeCatcher />
        {children}
        </Providers>
      </body>
    </html>
  );
}
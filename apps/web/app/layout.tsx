import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import OAuthCodeCatcher from "@/components/OAuthCodeCatcher";
import { getSiteUrl } from "@/lib/site";

/* Self-hosted variable font — no external requests, works offline */
const spaceGrotesk = localFont({
  src: [
    {
      path: "../public/fonts/space-grotesk-var.woff2",
      weight: "300 700",
      style: "normal",
    },
  ],
  variable: "--font-space",
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F12" },
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
      className={`${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-app-bg text-app-fg">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('urbanexplore-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}`}
        </Script>
        <Providers>
          <OAuthCodeCatcher />
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-app-bg text-app-fg">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('urbanexplore-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

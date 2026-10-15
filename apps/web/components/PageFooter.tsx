'use client'

import Footer from './Footer'
import { useSession } from './SessionProvider'

/**
 * Gated footer: visitors (no account) see the footer on every page,
 * signed-in users only see it on the Home page (which renders <Footer />
 * directly). Everywhere else the footer is hidden for logged-in users.
 *
 * Client-side on purpose: this used to await the Supabase session on the
 * server, and `cookies()` in the render tree forced every page that renders it
 * to be dynamically rendered and uncacheable — see SessionProvider.
 *
 * The visitor case renders immediately (it is the common and crawlable one);
 * we only remove the footer once we positively know the viewer is signed in.
 */
export default function PageFooter() {
  const { ready, isAuthenticated } = useSession()

  if (ready && isAuthenticated) return null
  return <Footer />
}

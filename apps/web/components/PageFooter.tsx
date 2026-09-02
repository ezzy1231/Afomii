import { createClient } from '@/lib/supabase/server'
import Footer from './Footer'

/**
 * Gated footer: visitors (no account) see the footer on every page,
 * signed-in users only see it on the Home page (which renders <Footer />
 * directly). Everywhere else the footer is hidden for logged-in users.
 */
export default async function PageFooter() {
  let isAuthed = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isAuthed = Boolean(user)
  } catch {
    isAuthed = false
  }
  if (isAuthed) return null
  return <Footer />
}
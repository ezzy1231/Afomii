import { createBrowserClient } from '@supabase/ssr'
import { trimEnv } from '@/lib/env'

export function createClient() {
  const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // The server callback route (/auth/callback) is the ONLY place that
      // exchanges the OAuth `code`. If the browser client also reacts to
      // `?code=` (its default behavior), a client-side exchange can consume
      // and delete the PKCE verifier cookie before the server callback reads
      // it, producing "PKCE code verifier not found in storage".
      detectSessionInUrl: false,
    },
  })
}

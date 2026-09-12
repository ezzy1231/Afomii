import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { trimEnv } from '@/lib/env'

/**
 * Cookie-free Supabase client for anonymous, public read paths that must not
 * depend on request cookies — e.g. the sitemap (crawlers carry no session)
 * and other static/cached contexts. RLS treats it exactly like an anonymous
 * request: only published rows are readable.
 */
export function createAnonClient() {
  const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Never persist or react to URL codes in this context — it exists for
      // one-shot public reads only.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

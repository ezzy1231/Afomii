import { createBrowserClient } from '@supabase/ssr'
import { trimEnv } from '@/lib/env'

export function createClient() {
  const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}

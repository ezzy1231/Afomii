import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import RoleClient from './RoleClient'

export const metadata: Metadata = { title: 'Get Started' }

export default async function RolePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <Suspense>
      <RoleClient isAuthenticated={Boolean(user)} />
    </Suspense>
  )
}

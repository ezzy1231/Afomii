import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConsumerPlans } from '@/lib/supabase/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Current user's plans (reservations + event tickets). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ plans: [] }, { status: 401 })
  }

  const plans = await getConsumerPlans(user.id)
  return NextResponse.json({ plans })
}

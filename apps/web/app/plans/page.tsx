import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import PlansView from '@/components/PlansView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Plans' }

export default async function PlansPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin?next=/plans')

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full px-4 py-10 sm:px-6">
        <div className="mx-auto mb-8 max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ember">Your calendar</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-app-fg sm:text-4xl">
            My Plans
          </h1>
          <p className="mt-1.5 max-w-lg text-sm font-medium text-app-muted">
            Every reservation and event ticket you&apos;ve booked lives here. Book a ride to any plan within 3 hours
            of start time.
          </p>
        </div>
        <PlansView userId={user.id} />
      </main>
      <PageFooter />
    </>
  )
}

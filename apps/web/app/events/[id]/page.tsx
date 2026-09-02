import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import EventDetail from '@/components/EventDetail'
import { getEventDetail } from '@/lib/supabase/queries'

export const metadata: Metadata = { title: 'Event' }

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEventDetail(params.id)
  if (!event) notFound()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <EventDetail event={event} />
      </main>
      <PageFooter />
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import EventDetail from '@/components/EventDetail'
import { getEventDetail } from '@/lib/supabase/queries'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventDetail(params.id)

  if (!event) {
    return { title: 'Event not found' }
  }

  const title = event.title
  const when = event.startDateTime
    ? new Date(event.startDateTime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null
  const descriptionParts = [
    event.category,
    event.venueName ? `at ${event.venueName}` : null,
    when ? `on ${when}` : null,
    '— get tickets on UrbanExplore.',
  ].filter(Boolean)
  const description = descriptionParts.join(' ')

  const ogImages = event.coverImageUrl
    ? [{ url: event.coverImageUrl, width: 1200, height: 630, alt: title }]
    : [{ url: '/og-image.png', width: 1200, height: 630 }]

  return {
    title,
    description,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      title,
      description,
      // 'website' renders richer previews than article for events
      type: 'website',
      url: `/events/${event.id}`,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
  }
}

export default async function EventDetailPage({ params }: Props) {
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

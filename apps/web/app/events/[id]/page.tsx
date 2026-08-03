import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventDetail from '@/components/EventDetail'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export const metadata: Metadata = { title: 'Event' }

async function getEvent(id: string) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)
  if (!event) notFound()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <EventDetail event={event} />
      </main>
      <Footer />
    </>
  )
}

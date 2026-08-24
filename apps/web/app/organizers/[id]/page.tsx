import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OrganizerProfile from '@/components/OrganizerProfile'
import { getOrganizerDetail } from '@/lib/supabase/queries'

export const metadata: Metadata = { title: 'Organizer' }

export default async function OrganizerPage({ params }: { params: { id: string } }) {
  const organizer = await getOrganizerDetail(params.id)
  if (!organizer) notFound()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <OrganizerProfile organizer={organizer} />
      </main>
      <Footer />
    </>
  )
}

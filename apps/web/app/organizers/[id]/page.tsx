import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import OrganizerProfile from '@/components/OrganizerProfile'
import { getOrganizerDetail } from '@/lib/supabase/queries'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const organizer = await getOrganizerDetail(params.id)

  if (!organizer) {
    return { title: 'Organizer not found' }
  }

  const title = organizer.name
  const description = organizer.bio
    ? `${organizer.bio.slice(0, 155)}${organizer.bio.length > 155 ? '…' : ''}`
    : `Events by ${organizer.name} — see upcoming events and get tickets on UrbanExplore.`

  return {
    title,
    description,
    alternates: { canonical: `/organizers/${organizer.id}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/organizers/${organizer.id}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default async function OrganizerPage({ params }: Props) {
  const organizer = await getOrganizerDetail(params.id)
  if (!organizer) notFound()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <OrganizerProfile organizer={organizer} />
      </main>
      <PageFooter />
    </>
  )
}

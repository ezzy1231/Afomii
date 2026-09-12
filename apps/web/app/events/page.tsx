import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import ExploreCatalogue from '@/components/ExploreCatalogue'
import { getEventCatalogue } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Discover what is happening in Addis Ababa — concerts, markets, exhibitions, and community nights with tickets on UrbanExplore.',
  alternates: { canonical: '/events' },
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const { items, source } = await getEventCatalogue()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <ExploreCatalogue
          type="events"
          items={items}
          source={source}
          initialQuery={searchParams?.q ?? ''}
        />
      </main>
      <PageFooter />
    </>
  )
}

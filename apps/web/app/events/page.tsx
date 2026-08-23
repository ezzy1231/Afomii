import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ExploreCatalogue from '@/components/ExploreCatalogue'
import { getEventCatalogue } from '@/lib/catalogue'

export const metadata: Metadata = { title: 'Events' }

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
      <Footer />
    </>
  )
}

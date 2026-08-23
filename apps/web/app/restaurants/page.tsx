import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ExploreCatalogue from '@/components/ExploreCatalogue'
import { getRestaurantCatalogue } from '@/lib/catalogue'

export const metadata: Metadata = { title: 'Restaurants' }

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const { items, source } = await getRestaurantCatalogue()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <ExploreCatalogue
          type="restaurants"
          items={items}
          source={source}
          initialQuery={searchParams?.q ?? ''}
        />
      </main>
      <Footer />
    </>
  )
}

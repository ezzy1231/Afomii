import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import ExploreCatalogue from '@/components/ExploreCatalogue'
import { getRestaurantCatalogue } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: 'Restaurants',
  description:
    'Browse verified restaurants across Addis Ababa — see menus, hours, and book a table in seconds.',
  alternates: { canonical: '/restaurants' },
}

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
      <PageFooter />
    </>
  )
}

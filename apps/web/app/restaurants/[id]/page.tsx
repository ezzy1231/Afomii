import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import RestaurantDetail from '@/components/RestaurantDetail'
import { getRestaurantDetail } from '@/lib/supabase/queries'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const restaurant = await getRestaurantDetail(params.id)

  if (!restaurant) {
    return { title: 'Restaurant not found' }
  }

  const title = restaurant.name
  const description = restaurant.category
    ? `${restaurant.category} restaurant${restaurant.isVerified ? ' · verified' : ''} — see menus, opening hours, and book a table on UrbanExplore.`
    : 'See menus, opening hours, and book a table on UrbanExplore.'

  const ogImages = restaurant.coverUrl
    ? [{ url: restaurant.coverUrl, width: 1200, height: 630, alt: title }]
    : [{ url: '/og-image.png', width: 1200, height: 630 }]

  return {
    title,
    description,
    alternates: { canonical: `/restaurants/${restaurant.id}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/restaurants/${restaurant.id}`,
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

export default async function RestaurantDetailPage({ params }: Props) {
  const restaurant = await getRestaurantDetail(params.id)
  if (!restaurant) notFound()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <RestaurantDetail restaurant={restaurant} />
      </main>
      <PageFooter />
    </>
  )
}

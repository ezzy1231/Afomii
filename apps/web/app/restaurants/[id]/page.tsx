import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import RestaurantDetail from '@/components/RestaurantDetail'
import { getRestaurantDetail } from '@/lib/supabase/queries'

export const metadata: Metadata = { title: 'Restaurant' }

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {
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

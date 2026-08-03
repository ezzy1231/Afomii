import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RestaurantDetail from '@/components/RestaurantDetail'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export const metadata: Metadata = { title: 'Restaurant' }

async function getRestaurant(id: string) {
  try {
    const res = await fetch(`${API_BASE}/partners/restaurants`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.find((b: any) => b.id === id) ?? null
  } catch {
    return null
  }
}

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const restaurant = await getRestaurant(params.id)
  if (!restaurant) notFound()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <RestaurantDetail restaurant={restaurant} />
      </main>
      <Footer />
    </>
  )
}

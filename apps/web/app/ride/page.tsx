import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RidePlanner from '@/components/RidePlanner'

export const metadata: Metadata = { title: 'Ride' }

export default function RidePage() {
  return <><Navbar /><RidePlanner /><Footer /></>
}

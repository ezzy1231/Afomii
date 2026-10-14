import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import RidePlanner from '@/components/RidePlanner'

export const metadata: Metadata = {
  title: 'Ride — Meter-taxi fare estimates in ETB',
  description:
    'Estimate your meter-taxi fare upfront across three vehicle tiers, and get to your table or event on time.',
}

export default function RidePage() {
  return <><Navbar /><RidePlanner /><PageFooter /></>
}

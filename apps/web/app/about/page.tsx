import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'About',
  description:
    'UrbanExplore helps you make city plans without stitching together a dozen different apps — discover places, find events, and plan a ride in one place.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <InfoPage eyebrow="UrbanExplore" title="City life, in one place." intro="UrbanExplore helps you make plans without stitching together a dozen different apps." sections={[{ heading: 'Built for moving cities', body: 'Discover places, find events and plan a ride from the same calm, connected experience.' }, { heading: 'Local first', body: 'We make it easier for independent venues and organisers to reach people who are ready to show up.' }]} />
}

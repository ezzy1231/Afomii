import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How UrbanExplore collects, uses, and protects your information — account details, preferences, and activity such as bookings and ride planning.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <InfoPage eyebrow="Legal" title="Privacy policy" intro="We use only the information needed to provide and improve your UrbanExplore experience." sections={[{ heading: 'What we collect', body: 'Account details, preferences and the information you provide while using features such as bookings and ride planning.' }, { heading: 'How it is used', body: 'Your information is used to operate the service, personalise recommendations and protect account security.' }, { heading: 'Your choices', body: 'You can review your account information in Settings and contact us to request help with your data.' }]} />
}

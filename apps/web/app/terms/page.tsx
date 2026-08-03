import InfoPage from '@/components/InfoPage'

export default function TermsPage() {
  return <InfoPage eyebrow="Legal" title="Terms of service" intro="These terms describe how UrbanExplore can be used to discover places, events and rides." sections={[{ heading: 'Using the service', body: 'Use UrbanExplore lawfully and keep your account information accurate. You are responsible for activity on your account.' }, { heading: 'Third-party services', body: 'Bookings, tickets and rides may be fulfilled by independent partners. Their availability and terms may apply to your order.' }, { heading: 'Account access', body: 'We may update features to maintain a safe and reliable service. You can stop using the service at any time.' }]} />
}

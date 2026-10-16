import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UrbanExplore — Restaurants, Events & Rides',
    short_name: 'UrbanExplore',
    description:
      'Discover the best restaurants, book unforgettable events, and get a ride — all in one place.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF5F0',
    theme_color: '#0B1F3A',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}

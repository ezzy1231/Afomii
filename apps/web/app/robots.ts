import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/settings', '/auth', '/api', '/plans'],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}

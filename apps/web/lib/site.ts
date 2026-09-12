import { trimEnv } from '@/lib/env'

/**
 * Canonical site origin used for metadataBase, canonical URLs, OG cards, and
 * the sitemap.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL — explicit production domain (set on the host).
 *  2. VERCEL_PROJECT_PRODUCTION_URL — auto-provided by Vercel deployments
 *     (e.g. "urbanexplore.vercel.app"; scheme is prepended).
 *  3. http://localhost:3000 — local development fallback.
 *
 * Trailing slashes are stripped so URL joining stays predictable.
 */
export function getSiteUrl(): string {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_SITE_URL)
  if (explicit) return stripTrailingSlash(explicit.startsWith('http') ? explicit : `https://${explicit}`)

  const vercel = trimEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (vercel) return stripTrailingSlash(vercel.startsWith('http') ? vercel : `https://${vercel}`)

  return 'http://localhost:3000'
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') && value.length > 1 ? value.slice(0, -1) : value
}

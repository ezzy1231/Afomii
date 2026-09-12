import { describe, expect, it } from 'vitest'
import { getSiteUrl } from '@/lib/site'

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {}
  for (const key of Object.keys(vars)) {
    saved[key] = process.env[key]
    if (vars[key] === undefined) delete process.env[key]
    else process.env[key] = vars[key]
  }
  try {
    fn()
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

describe('getSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL', () => {
    withEnv(
      {
        NEXT_PUBLIC_SITE_URL: 'https://urbanexplore.com',
        VERCEL_PROJECT_PRODUCTION_URL: 'ignored.vercel.app',
      },
      () => expect(getSiteUrl()).toBe('https://urbanexplore.com')
    )
  })

  it('accepts a bare domain and adds https://', () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: 'urbanexplore.com' }, () =>
      expect(getSiteUrl()).toBe('https://urbanexplore.com')
    )
  })

  it('strips trailing slashes', () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: 'https://urbanexplore.com/' }, () =>
      expect(getSiteUrl()).toBe('https://urbanexplore.com')
    )
  })

  it('strips surrounding quotes copied from .env files', () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: '"https://urbanexplore.com"' }, () =>
      expect(getSiteUrl()).toBe('https://urbanexplore.com')
    )
  })

  it('falls back to VERCEL_PROJECT_PRODUCTION_URL', () => {
    withEnv(
      { NEXT_PUBLIC_SITE_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: 'ue.vercel.app' },
      () => expect(getSiteUrl()).toBe('https://ue.vercel.app')
    )
  })

  it('defaults to localhost for local development', () => {
    withEnv(
      { NEXT_PUBLIC_SITE_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: undefined },
      () => expect(getSiteUrl()).toBe('http://localhost:3000')
    )
  })
})

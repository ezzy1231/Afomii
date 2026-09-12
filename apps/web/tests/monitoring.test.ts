import { describe, expect, it, vi, afterEach } from 'vitest'
import { reportError, reportErrorClient } from '@/lib/monitoring'

// console.error is the local behavior — assert it fires and never throws.
describe('reportError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs Error objects with the scope prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    reportError('action:createReservation', new Error('db down'))
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[action:createReservation] db down')
    )
  })

  it('stringifies non-Error payloads', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    reportError('action:rateLimit', 'identity blocked')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[action:rateLimit] identity blocked')
    )
  })

  it('never throws even if the payload is weird', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => reportError('scope', undefined)).not.toThrow()
    expect(() => reportError('scope', { nested: { deep: Symbol('x') } })).not.toThrow()
    expect(spy).toHaveBeenCalled()
  })
})

describe('reportErrorClient', () => {
  it('logs on the server side without throwing (SSR path)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // vitest node env: window undefined → routes to the server reporter
    expect(() => reportErrorClient(new Error('boundary hit'))).not.toThrow()
    expect(spy).toHaveBeenCalled()
  })
})

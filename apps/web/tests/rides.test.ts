import { describe, expect, it } from 'vitest'
import { buildMeterTaxiEstimates, haversineKm, roundBirr } from '@/lib/rides'

describe('roundBirr', () => {
  it('rounds to the nearest whole birr', () => {
    expect(roundBirr(10.4)).toBe(10)
    expect(roundBirr(10.5)).toBe(11)
    expect(roundBirr(0.1)).toBe(0)
  })
})

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 9.03, lng: 38.74 } // Addis Ababa
    expect(haversineKm(p, p)).toBe(0)
  })

  it('computes a known Addis Ababa distance (Bole ↔ Meskel Square ≈ 5–7 km)', () => {
    const bole = { lat: 8.9936, lng: 38.7871 }
    const meskel = { lat: 9.0108, lng: 38.7613 }
    const km = haversineKm(bole, meskel)
    expect(km).toBeGreaterThan(3)
    expect(km).toBeLessThan(6)
  })

  it('is symmetric', () => {
    const a = { lat: 9.03, lng: 38.74 }
    const b = { lat: 9.1, lng: 38.8 }
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10)
  })

  it('computes a long distance correctly (Addis ↔ Nairobi ≈ 1160–1175 km)', () => {
    const addis = { lat: 9.03, lng: 38.74 }
    const nairobi = { lat: -1.29, lng: 36.82 }
    const km = haversineKm(addis, nairobi)
    expect(km).toBeGreaterThan(1160)
    expect(km).toBeLessThan(1175)
  })
})

describe('buildMeterTaxiEstimates', () => {
  it('returns exactly three tiers', () => {
    expect(buildMeterTaxiEstimates(5)).toHaveLength(3)
  })

  it('labels tiers Standard/Comfort/Minivan with ETB currency', () => {
    const tiers = buildMeterTaxiEstimates(5)
    expect(tiers.map((t) => t.tier)).toEqual(['Standard', 'Comfort', 'Minivan'])
    for (const t of tiers) {
      expect(t.estimatedPrice.currency).toBe('ETB')
      expect(t.estimatedPrice.amount).toBeGreaterThan(0)
      expect(Number.isInteger(t.estimatedPrice.amount)).toBe(true)
    }
  })

  it('normalizes sub-500m trips to a 0.5 km minimum', () => {
    const short = buildMeterTaxiEstimates(0.1)
    const half = buildMeterTaxiEstimates(0.5)
    expect(short[0].estimatedPrice.amount).toBe(half[0].estimatedPrice.amount)
    expect(short[0].estimatedPrice.amount).toBe(Math.round(90 + 0.5 * 18))
  })

  it('prices tiers monotonically (Standard ≤ Comfort ≤ Minivan)', () => {
    const [std, comfort, van] = buildMeterTaxiEstimates(7.3).map((t) => t.estimatedPrice.amount)
    expect(std).toBeLessThan(comfort)
    expect(comfort).toBeLessThan(van)
  })

  it('matches the published rate formula for 10 km', () => {
    const [std, comfort, van] = buildMeterTaxiEstimates(10).map((t) => t.estimatedPrice.amount)
    expect(std).toBe(Math.round(90 + 10 * 18)) // 270
    expect(comfort).toBe(Math.round(110 + 10 * 22)) // 330
    expect(van).toBe(Math.round(140 + 10 * 28)) // 420
  })

  it('produces sane ETAs (>= 4 minutes)', () => {
    for (const t of buildMeterTaxiEstimates(12)) {
      expect(t.etaMinutes).toBeGreaterThanOrEqual(4)
    }
  })
})

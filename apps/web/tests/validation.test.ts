import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import {
  bannerUrlSchema,
  bookingConfigInputSchema,
  eventListingInputSchema,
  firstIssue,
  purchaseTicketsInputSchema,
  reservationInputSchema,
  restaurantListingInputSchema,
  ticketTierInputSchema,
} from '@/lib/validation'

const UUID = '123e4567-e89b-12d3-a456-426614174000'

describe('bannerUrlSchema', () => {
  it('accepts a public banners-bucket URL from our project', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/public/banners/abc.jpg'
    expect(bannerUrlSchema.safeParse(url).success).toBe(true)
  })

  it('rejects arbitrary external images', () => {
    expect(bannerUrlSchema.safeParse('https://evil.example.com/banner.jpg').success).toBe(false)
  })

  it('rejects http (non-https) and other storage buckets', () => {
    expect(
      bannerUrlSchema.safeParse('http://xyz.supabase.co/storage/v1/object/public/banners/abc.jpg').success
    ).toBe(false)
    expect(
      bannerUrlSchema.safeParse('https://xyz.supabase.co/storage/v1/object/public/avatars/abc.jpg').success
    ).toBe(false)
  })
})

describe('reservationInputSchema', () => {
  it('accepts a valid reservation', () => {
    const input = {
      branchId: UUID,
      reservationDate: '2026-09-10',
      timeSlot: '19:00',
      guestCount: 4,
    }
    expect(reservationInputSchema.safeParse(input).success).toBe(true)
  })

  it('coerces numeric strings for guestCount', () => {
    const input = {
      branchId: UUID,
      reservationDate: '2026-09-10',
      timeSlot: '19:00',
      guestCount: '4',
    }
    const parsed = reservationInputSchema.safeParse(input)
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.guestCount).toBe(4)
  })

  it('rejects malformed dates and zero guests', () => {
    const base = { branchId: UUID, timeSlot: '19:00' }
    expect(
      reservationInputSchema.safeParse({ ...base, reservationDate: '09/10/2026', guestCount: 2 }).success
    ).toBe(false)
    expect(
      reservationInputSchema.safeParse({ ...base, reservationDate: '2026-09-10', guestCount: 0 }).success
    ).toBe(false)
  })

  it('rejects non-uuid branch ids', () => {
    const input = { branchId: 'not-a-uuid', reservationDate: '2026-09-10', timeSlot: '19:00', guestCount: 2 }
    expect(reservationInputSchema.safeParse(input).success).toBe(false)
  })
})

describe('purchaseTicketsInputSchema', () => {
  it('accepts a valid purchase and caps quantity at 100', () => {
    expect(purchaseTicketsInputSchema.safeParse({ ticketTypeId: UUID, quantity: 2 }).success).toBe(true)
    expect(purchaseTicketsInputSchema.safeParse({ ticketTypeId: UUID, quantity: 101 }).success).toBe(false)
    expect(purchaseTicketsInputSchema.safeParse({ ticketTypeId: UUID, quantity: 0 }).success).toBe(false)
  })
})

describe('ticketTierInputSchema', () => {
  it('accepts a valid tier', () => {
    const input = {
      eventId: UUID,
      name: 'General Admission',
      tier: 'standard',
      price: '500',
      totalQuantity: '200',
    }
    const parsed = ticketTierInputSchema.safeParse(input)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.price).toBe(500)
      expect(parsed.data.totalQuantity).toBe(200)
    }
  })

  it('rejects unknown tier keys and negative prices', () => {
    const base = { eventId: UUID, name: 'VIP', price: 100, totalQuantity: 10 }
    expect(ticketTierInputSchema.safeParse({ ...base, tier: 'premium' }).success).toBe(false)
    expect(ticketTierInputSchema.safeParse({ ...base, tier: 'vip', price: -1 }).success).toBe(false)
  })
})

describe('restaurantListingInputSchema', () => {
  it('requires a name of at least 2 chars and a city', () => {
    const base = { name: 'Yod Abyssinia', city: 'Addis Ababa' }
    expect(restaurantListingInputSchema.safeParse(base).success).toBe(true)
    expect(restaurantListingInputSchema.safeParse({ ...base, name: 'Y' }).success).toBe(false)
    expect(restaurantListingInputSchema.safeParse({ name: 'Yod Abyssinia' }).success).toBe(false)
  })
})

describe('eventListingInputSchema', () => {
  it('requires a title and venue', () => {
    const base = { title: 'Night Market', venueName: 'Meskel Square' }
    expect(eventListingInputSchema.safeParse(base).success).toBe(true)
    expect(eventListingInputSchema.safeParse({ venueName: 'Meskel Square' }).success).toBe(false)
  })

  it('rejects invalid start dates but allows empty', () => {
    const base = { title: 'Night Market', venueName: 'Meskel Square' }
    expect(eventListingInputSchema.safeParse({ ...base, startsAt: 'next tuesday' }).success).toBe(false)
    expect(eventListingInputSchema.safeParse({ ...base, startsAt: '' }).success).toBe(true)
  })
})

describe('bookingConfigInputSchema', () => {
  it('validates booking mode and numeric ranges', () => {
    const base = {
      branchId: UUID,
      bookingMode: 'instant',
      totalTables: 12,
      maxGuestPerTable: 6,
      slotDurationMinutes: 30,
      advanceNoticeHours: 2,
    }
    expect(bookingConfigInputSchema.safeParse(base).success).toBe(true)
    expect(bookingConfigInputSchema.safeParse({ ...base, bookingMode: 'always' }).success).toBe(false)
    expect(bookingConfigInputSchema.safeParse({ ...base, slotDurationMinutes: 5 }).success).toBe(false)
  })
})

describe('firstIssue', () => {
  it('returns the first issue message or a default', () => {
    const result = reservationInputSchema.safeParse({ branchId: 'x' })
    if (!result.success) {
      expect(typeof firstIssue(result.error)).toBe('string')
      expect(firstIssue(result.error).length).toBeGreaterThan(0)
    }
    expect(firstIssue(new ZodError([]))).toBe('Invalid input.')
  })
})

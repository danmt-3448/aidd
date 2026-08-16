import { describe, it, expect } from 'vitest'
import { computeRemaining, isValidTarget } from './countdown'

// ---------------------------------------------------------------------------
// isValidTarget
// ---------------------------------------------------------------------------

describe('isValidTarget', () => {
  it('returns false for empty string', () => {
    expect(isValidTarget('')).toBe(false)
  })

  it('returns false for whitespace-only string', () => {
    expect(isValidTarget('   ')).toBe(false)
  })

  it('returns false for non-ISO string', () => {
    expect(isValidTarget('abc')).toBe(false)
  })

  it('returns false for alphanumeric garbage string', () => {
    expect(isValidTarget('abc123')).toBe(false)
  })

  // Note: bare integer strings like '12345' are parsed by Date.parse as year
  // 12345 (a valid date). isValidTarget correctly returns true for them.
  // The guard is purely "parseable as a date" — year-only strings pass.
  it('returns true for a bare year string (Date.parse treats it as valid)', () => {
    expect(isValidTarget('12345')).toBe(true)
  })

  it('returns true for valid ISO 8601 UTC string', () => {
    expect(isValidTarget('2025-08-15T09:00:00.000Z')).toBe(true)
  })

  it('returns true for ISO with positive timezone offset (+07)', () => {
    expect(isValidTarget('2025-08-15T16:00:00+07:00')).toBe(true)
  })

  it('returns true for ISO with negative timezone offset', () => {
    expect(isValidTarget('2025-08-15T02:00:00-05:00')).toBe(true)
  })

  it('returns true for ISO without milliseconds', () => {
    expect(isValidTarget('2025-08-15T09:00:00Z')).toBe(true)
  })

  it('returns true for date-only ISO string (midnight UTC)', () => {
    // Date-only strings parse as UTC midnight in modern engines
    expect(isValidTarget('2025-08-15')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// computeRemaining — future targets
// ---------------------------------------------------------------------------

describe('computeRemaining — future target', () => {
  const BASE = new Date('2025-08-01T00:00:00.000Z').getTime()

  it('returns correct values for exactly 1 day away', () => {
    const target = '2025-08-02T00:00:00.000Z'
    const result = computeRemaining(target, BASE)
    expect(result).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0, done: false })
  })

  it('rounds 23h 59m 59s UP to exactly 1 day (ceil at minute granularity)', () => {
    const nowMs = new Date('2025-08-01T00:00:01.000Z').getTime()
    const target = '2025-08-02T00:00:00.000Z' // 86399 s from now → 1439.98 min → ceil 1440 = 1 day
    const result = computeRemaining(target, nowMs)
    expect(result).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0, done: false })
  })

  it('rounds a sub-minute remainder UP to 1 minute (never shows a frozen 0)', () => {
    // 45 s left → ceil to 1 minute so the counter reads "1", not a stuck "0",
    // until done fires at exactly 0. This is the fix for the last-minute UX gap.
    const target = '2025-08-01T00:00:45.000Z'
    const nowMs = new Date('2025-08-01T00:00:00.000Z').getTime()
    const result = computeRemaining(target, nowMs)
    expect(result).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 0, done: false })
  })

  it('rounds leftover seconds UP into the minute when decomposing d/h/m', () => {
    // 2d 3h 14m 22s → the 22 s bumps minutes 14 → 15 (ceil), seconds not shown.
    const totalSeconds = 2 * 86400 + 3 * 3600 + 14 * 60 + 22
    const nowMs = new Date('2025-08-01T00:00:00.000Z').getTime()
    const targetMs = nowMs + totalSeconds * 1000
    const target = new Date(targetMs).toISOString()
    const result = computeRemaining(target, nowMs)
    expect(result).toEqual({ days: 2, hours: 3, minutes: 15, seconds: 0, done: false })
  })

  it('a whole-minute remainder is NOT rounded up (no phantom extra minute)', () => {
    // exactly 5 minutes → stays 5, not 6 (ceil of an exact multiple = itself)
    const nowMs = new Date('2025-08-01T00:00:00.000Z').getTime()
    const target = new Date(nowMs + 5 * 60_000).toISOString()
    const result = computeRemaining(target, nowMs)
    expect(result).toEqual({ days: 0, hours: 0, minutes: 5, seconds: 0, done: false })
  })

  it('returns raw value for > 99 days without capping', () => {
    // 100 days + 1 second in the future
    const nowMs = new Date('2025-08-01T00:00:00.000Z').getTime()
    const targetMs = nowMs + (100 * 86400 + 1) * 1000
    const target = new Date(targetMs).toISOString()
    const result = computeRemaining(target, nowMs)
    // days must be 100 — NOT capped to 99. Padding/capping is UI's job.
    expect(result.days).toBe(100)
    expect(result.done).toBe(false)
  })

  it('done is false when 1 millisecond remains (rounds up to 1 minute)', () => {
    const nowMs = new Date('2025-08-01T00:00:00.000Z').getTime()
    const targetMs = nowMs + 1 // 1 ms ahead → remaining > 0 → NOT done
    const target = new Date(targetMs).toISOString()
    const result = computeRemaining(target, nowMs)
    // remainingMs > 0 → done=false; ceil(1ms) → 1 minute shown, seconds always 0
    expect(result.done).toBe(false)
    expect(result).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 0, done: false })
  })
})

// ---------------------------------------------------------------------------
// computeRemaining — past / boundary targets
// ---------------------------------------------------------------------------

describe('computeRemaining — past or exact boundary', () => {
  it('returns all zeros and done=true when target is in the past', () => {
    const target = '2025-07-31T23:59:59.000Z'
    const nowMs = new Date('2025-08-01T00:00:00.000Z').getTime()
    const result = computeRemaining(target, nowMs)
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  })

  it('returns all zeros and done=true when target equals now (remaining=0)', () => {
    const target = '2025-08-01T00:00:00.000Z'
    const nowMs = new Date('2025-08-01T00:00:00.000Z').getTime()
    const result = computeRemaining(target, nowMs)
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  })

  it('returns all zeros and done=true when target is 1 second in the past', () => {
    const nowMs = new Date('2025-08-01T00:00:01.000Z').getTime()
    const result = computeRemaining('2025-08-01T00:00:00.000Z', nowMs)
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  })
})

// ---------------------------------------------------------------------------
// computeRemaining — clamp: never negative
// ---------------------------------------------------------------------------

describe('computeRemaining — never returns negative values', () => {
  it('days is never negative', () => {
    const result = computeRemaining('2020-01-01T00:00:00.000Z', Date.now())
    expect(result.days).toBeGreaterThanOrEqual(0)
  })

  it('hours is never negative', () => {
    const result = computeRemaining('2020-01-01T00:00:00.000Z', Date.now())
    expect(result.hours).toBeGreaterThanOrEqual(0)
  })

  it('minutes is never negative', () => {
    const result = computeRemaining('2020-01-01T00:00:00.000Z', Date.now())
    expect(result.minutes).toBeGreaterThanOrEqual(0)
  })

  it('seconds is never negative', () => {
    const result = computeRemaining('2020-01-01T00:00:00.000Z', Date.now())
    expect(result.seconds).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// computeRemaining — invalid ISO strings
// ---------------------------------------------------------------------------

describe('computeRemaining — invalid ISO input', () => {
  const BASE = new Date('2025-08-01T00:00:00.000Z').getTime()

  it('returns all zeros and done=true for empty string', () => {
    expect(computeRemaining('', BASE)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  })

  it('returns all zeros and done=true for non-ISO string', () => {
    expect(computeRemaining('abc', BASE)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  })

  it('returns all zeros and done=true for NaN-producing string', () => {
    expect(computeRemaining('NaN', BASE)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
  })

  it('returns all zeros and done=true for random text', () => {
    expect(computeRemaining('not-a-date-at-all', BASE)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: true,
    })
  })
})

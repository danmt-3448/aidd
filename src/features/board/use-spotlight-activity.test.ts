import { describe, it, expect } from 'vitest'
import { formatActivityTime } from './use-spotlight-activity'

describe('formatActivityTime', () => {
  it('formats a morning time to hh:mmAM (no space before AM)', () => {
    // 2026-08-12 08:30:00 UTC → Ho Chi Minh is UTC+7 → 15:30 local (3:30 PM)
    const isoString = '2026-08-12T08:30:00Z'
    const result = formatActivityTime(isoString)
    // In Ho Chi Minh TZ: 15:30 → 03:30PM
    expect(result).toBe('03:30PM')
  })

  it('formats noon to 12:xxPM (not 00:xxPM)', () => {
    // UTC+7: 05:00Z = 12:00 local (noon)
    const isoString = '2026-08-12T05:00:00Z'
    const result = formatActivityTime(isoString)
    expect(result).toBe('12:00PM')
  })

  it('formats midnight to 12:xxAM (not 00:xxAM)', () => {
    // UTC+7: 17:00Z = 00:00 local (midnight)
    const isoString = '2026-08-12T17:00:00Z'
    const result = formatActivityTime(isoString)
    expect(result).toBe('12:00AM')
  })

  it('formats 1 AM correctly', () => {
    // UTC+7: 18:00Z = 01:00 local (1 AM)
    const isoString = '2026-08-12T18:00:00Z'
    const result = formatActivityTime(isoString)
    expect(result).toBe('01:00AM')
  })

  it('formats 1 PM correctly', () => {
    // UTC+7: 06:00Z = 13:00 local (1 PM)
    const isoString = '2026-08-12T06:00:00Z'
    const result = formatActivityTime(isoString)
    expect(result).toBe('01:00PM')
  })

  it('formats 11:59 PM correctly', () => {
    // UTC+7: 16:59Z = 23:59 local (11:59 PM)
    const isoString = '2026-08-12T16:59:00Z'
    const result = formatActivityTime(isoString)
    expect(result).toBe('11:59PM')
  })

  it('handles daylight and overnight boundaries in Ho Chi Minh TZ', () => {
    // A time in the evening (Ho Chi Minh local)
    // UTC+7: 10:00Z = 17:00 local (5 PM)
    const isoString = '2026-08-12T10:00:00Z'
    const result = formatActivityTime(isoString)
    expect(result).toBe('05:00PM')
  })

  it('removes space between time and AM/PM in output', () => {
    const isoString = '2026-08-12T01:00:00Z'
    const result = formatActivityTime(isoString)
    // Ensure no space: "01:00AM", not "01:00 AM"
    expect(result).not.toContain(' ')
    expect(result).toMatch(/^\d{2}:\d{2}(AM|PM)$/)
  })

  it('always uses 2-digit hour and minute format', () => {
    const isoString = '2026-08-12T02:05:00Z'
    const result = formatActivityTime(isoString)
    // Should be "09:05AM" or similar, never "9:5AM"
    expect(result).toMatch(/^\d{2}:\d{2}(AM|PM)$/)
  })
})

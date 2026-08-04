/**
 * Unit tests for rules-content.ts constants.
 *
 * Happy paths:
 *  - HERO_BADGES has exactly 4 entries with unique ids
 *  - SECRET_BADGES has exactly 6 entries with unique ids
 *  - RECIPIENT_SECTION / SENDER_SECTION have non-empty heading + body
 *  - footer / kudos-quoc-dan constants are non-empty strings
 *  - every SecretBadge has positive width and height
 */
import { describe, it, expect } from 'vitest'
import {
  HERO_BADGES,
  SECRET_BADGES,
  RECIPIENT_SECTION,
  SENDER_SECTION,
  SENDER_FOOTER_TEXT,
  KUDOS_QUOC_DAN_HEADING,
  KUDOS_QUOC_DAN_BODY,
} from './rules-content'

describe('HERO_BADGES', () => {
  it('has exactly 4 entries', () => {
    expect(HERO_BADGES).toHaveLength(4)
  })

  it('all ids are unique', () => {
    const ids = HERO_BADGES.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry has a non-empty id, name, condition, and description', () => {
    for (const badge of HERO_BADGES) {
      expect(badge.id.trim().length, `id for ${badge.name}`).toBeGreaterThan(0)
      expect(badge.name.trim().length, `name for ${badge.id}`).toBeGreaterThan(0)
      expect(badge.condition.trim().length, `condition for ${badge.id}`).toBeGreaterThan(0)
      expect(badge.description.trim().length, `description for ${badge.id}`).toBeGreaterThan(0)
    }
  })
})

describe('SECRET_BADGES', () => {
  it('has exactly 6 entries', () => {
    expect(SECRET_BADGES).toHaveLength(6)
  })

  it('all ids are unique', () => {
    const ids = SECRET_BADGES.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every SecretBadge has positive width and height', () => {
    for (const badge of SECRET_BADGES) {
      expect(badge.width, `width for ${badge.id}`).toBeGreaterThan(0)
      expect(badge.height, `height for ${badge.id}`).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty imageSrc and alt', () => {
    for (const badge of SECRET_BADGES) {
      expect(badge.imageSrc.trim().length, `imageSrc for ${badge.id}`).toBeGreaterThan(0)
      expect(badge.alt.trim().length, `alt for ${badge.id}`).toBeGreaterThan(0)
    }
  })
})

describe('RECIPIENT_SECTION', () => {
  it('has a non-empty heading', () => {
    expect(RECIPIENT_SECTION.heading.trim().length).toBeGreaterThan(0)
  })

  it('has a non-empty body', () => {
    expect(RECIPIENT_SECTION.body.trim().length).toBeGreaterThan(0)
  })
})

describe('SENDER_SECTION', () => {
  it('has a non-empty heading', () => {
    expect(SENDER_SECTION.heading.trim().length).toBeGreaterThan(0)
  })

  it('has a non-empty body', () => {
    expect(SENDER_SECTION.body.trim().length).toBeGreaterThan(0)
  })
})

describe('string constants', () => {
  it('SENDER_FOOTER_TEXT is non-empty', () => {
    expect(SENDER_FOOTER_TEXT.trim().length).toBeGreaterThan(0)
  })

  it('KUDOS_QUOC_DAN_HEADING is non-empty', () => {
    expect(KUDOS_QUOC_DAN_HEADING.trim().length).toBeGreaterThan(0)
  })

  it('KUDOS_QUOC_DAN_BODY is non-empty', () => {
    expect(KUDOS_QUOC_DAN_BODY.trim().length).toBeGreaterThan(0)
  })
})

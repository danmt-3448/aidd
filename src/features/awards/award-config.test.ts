/**
 * Unit tests for AWARDS constant (award-config.ts).
 *
 * Happy paths:
 *  - exactly 6 awards defined
 *  - all slugs unique
 *  - all slugs match kebab-case pattern
 *  - hashtagAnchor equals slug on every entry
 *
 * Invariant paths:
 *  - every entry has non-empty title, description, prize, navLabel, quantityUnit
 *  - every entry has quantity > 0
 */
import { describe, it, expect } from 'vitest'
import { AWARDS } from './award-config'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

describe('AWARDS', () => {
  it('has exactly 6 entries', () => {
    expect(AWARDS).toHaveLength(6)
  })

  it('all slugs are unique', () => {
    const slugs = AWARDS.map((a) => a.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('every slug matches kebab-case pattern', () => {
    for (const award of AWARDS) {
      expect(award.slug, `slug "${award.slug}" must be kebab-case`).toMatch(
        SLUG_PATTERN,
      )
    }
  })

  it('hashtagAnchor equals slug on every entry', () => {
    for (const award of AWARDS) {
      expect(award.hashtagAnchor).toBe(award.slug)
    }
  })

  it('every entry has a non-empty title', () => {
    for (const award of AWARDS) {
      expect(award.title.trim().length, `title for ${award.slug}`).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty description', () => {
    for (const award of AWARDS) {
      expect(award.description.trim().length, `description for ${award.slug}`).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty prize', () => {
    for (const award of AWARDS) {
      expect(award.prize.trim().length, `prize for ${award.slug}`).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty navLabel', () => {
    for (const award of AWARDS) {
      expect(award.navLabel.trim().length, `navLabel for ${award.slug}`).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty quantityUnit', () => {
    for (const award of AWARDS) {
      expect(award.quantityUnit.trim().length, `quantityUnit for ${award.slug}`).toBeGreaterThan(0)
    }
  })

  it('every entry has quantity > 0', () => {
    for (const award of AWARDS) {
      expect(award.quantity, `quantity for ${award.slug}`).toBeGreaterThan(0)
    }
  })
})

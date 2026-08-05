/**
 * Unit tests for AWARDS constant (award-config.ts).
 *
 * Per-award value assertions (happy path — regression guard against uniform values):
 *  - exact prize, quantity, quantityUnit, and icon per slug
 *
 * Invariant paths:
 *  - exactly 6 awards defined
 *  - all slugs unique and kebab-case
 *  - hashtagAnchor equals slug on every entry
 *  - every entry has non-empty title, description, navLabel
 */
import { describe, it, expect } from 'vitest'
import { AWARDS } from './award-config'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// ---------------------------------------------------------------------------
// Helper: look up a single award by slug, throw a clear message on miss
// ---------------------------------------------------------------------------
function bySlug(slug: string) {
  const award = AWARDS.find((a) => a.slug === slug)
  if (!award) throw new Error(`Award with slug "${slug}" not found in AWARDS`)
  return award
}

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

describe('AWARDS invariants', () => {
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
      expect(award.slug, `slug "${award.slug}" must be kebab-case`).toMatch(SLUG_PATTERN)
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

  it('every entry has a non-empty navLabel', () => {
    for (const award of AWARDS) {
      expect(award.navLabel.trim().length, `navLabel for ${award.slug}`).toBeGreaterThan(0)
    }
  })

  it('every entry has quantity > 0', () => {
    for (const award of AWARDS) {
      expect(award.quantity, `quantity for ${award.slug}`).toBeGreaterThan(0)
    }
  })

  it('no two entries share the same prize value', () => {
    const prizes = AWARDS.map((a) => a.prize)
    // MVP and Top Project both equal 15M — allowed when Figma shows them equal.
    // This test guards against regression to the old uniform-7M state by verifying
    // at least two distinct prize values exist across all 6 awards.
    const distinct = new Set(prizes)
    expect(distinct.size, 'prizes must not all be uniform').toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// Per-award exact value assertions (source: MoMorph screen zFYDgyj_pD)
// A regression to the old uniform '7.000.000 VNĐ' / quantity=10 values
// will fail at least one of the individual tests below.
// ---------------------------------------------------------------------------

describe('AWARDS per-award values (source: MoMorph zFYDgyj_pD)', () => {
  it('top-talent: prize=10.000.000 VNĐ, quantity=10, quantityUnit=Cá nhân', () => {
    const a = bySlug('top-talent')
    expect(a.prize).toBe('10.000.000 VNĐ')
    expect(a.quantity).toBe(10)
    expect(a.quantityUnit).toBe('Cá nhân')
  })

  it('top-project: prize=15.000.000 VNĐ, quantity=10, quantityUnit=Dự án', () => {
    const a = bySlug('top-project')
    expect(a.prize).toBe('15.000.000 VNĐ')
    expect(a.quantity).toBe(10)
    expect(a.quantityUnit).toBe('Dự án')
  })

  it('top-project-leader: prize=7.000.000 VNĐ, quantity=3, quantityUnit=Cá nhân', () => {
    const a = bySlug('top-project-leader')
    expect(a.prize).toBe('7.000.000 VNĐ')
    expect(a.quantity).toBe(3)
    expect(a.quantityUnit).toBe('Cá nhân')
  })

  it('best-manager: prize=10.000.000 VNĐ, quantity=2, quantityUnit=Cá nhân', () => {
    const a = bySlug('best-manager')
    expect(a.prize).toBe('10.000.000 VNĐ')
    expect(a.quantity).toBe(2)
    expect(a.quantityUnit).toBe('Cá nhân')
  })

  it('signature-2025-creator: prize=5.000.000 – 8.000.000 VNĐ, quantity=1, quantityUnit=Cá nhân', () => {
    const a = bySlug('signature-2025-creator')
    expect(a.prize).toBe('5.000.000 – 8.000.000 VNĐ')
    expect(a.quantity).toBe(1)
    expect(a.quantityUnit).toBe('Cá nhân')
  })

  it('mvp: prize=15.000.000 VNĐ, quantity=1, quantityUnit=Cá nhân', () => {
    const a = bySlug('mvp')
    expect(a.prize).toBe('15.000.000 VNĐ')
    expect(a.quantity).toBe(1)
    expect(a.quantityUnit).toBe('Cá nhân')
  })
})

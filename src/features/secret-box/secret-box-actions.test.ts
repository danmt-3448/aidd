/**
 * Unit tests for the pure badgeAsset() allowlist (src/features/secret-box/badge-assets.ts).
 *
 * badgeAsset lives outside the 'use server' actions file so it can be imported
 * client-side; getSecretBoxState/openSecretBox are server actions (hit Supabase).
 *
 * Happy paths:
 *  - every known badge key returns a string path under /rules/
 *
 * Failure / edge paths:
 *  - unknown key returns undefined (allowlist-only, no echo)
 *  - the function never returns a caller-supplied arbitrary string
 */
import { describe, it, expect } from 'vitest'
import { badgeAsset } from './badge-assets'

const KNOWN_KEYS = [
  'stay-gold',
  'flow-to-horizon',
  'touch-of-light',
  'beyond-the-boundary',
  'root-further',
  'revival',
] as const

describe('badgeAsset', () => {
  // ── Happy paths ─────────────────────────────────────────────────────────────

  it.each(KNOWN_KEYS)(
    'returns a /rules/ path for known key "%s"',
    (key) => {
      const result = badgeAsset(key)
      expect(result).toBeDefined()
      expect(result).toMatch(/^\/rules\//)
    },
  )

  it('returns a string (not undefined) for each known badge key', () => {
    for (const key of KNOWN_KEYS) {
      expect(typeof badgeAsset(key)).toBe('string')
    }
  })

  // ── Failure / edge paths ─────────────────────────────────────────────────────

  it('returns undefined for an unknown badge key', () => {
    expect(badgeAsset('not-a-real-badge')).toBeUndefined()
  })

  it('returns undefined for an empty string key', () => {
    expect(badgeAsset('')).toBeUndefined()
  })

  it('does not echo back the caller-supplied key as the return value', () => {
    const arbitraryKey = 'http://evil.example.com/hack.png'
    const result = badgeAsset(arbitraryKey)
    // Must be undefined (allowlist miss), never the supplied string itself
    expect(result).not.toBe(arbitraryKey)
  })

  it('revival key resolves to the stay-gold fallback asset (documented workaround)', () => {
    // WORKAROUND: badge-revival.png not yet in public/rules/.
    // revival maps to badge-stay-gold.png as placeholder.
    // Replace assertion when the real asset is added.
    expect(badgeAsset('revival')).toBe('/rules/badge-stay-gold.png')
  })
})

import { describe, it, expect } from 'vitest'
import {
  createKudoSchema,
  contentHtmlSchema,
  hashtagIdsSchema,
  imagePathsSchema,
  countContentChars,
} from './kudo-schema'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID_V4 = '550e8400-e29b-41d4-a716-446655440000'
const VALID_UUID_V4_B = '6ba7b810-9dad-41d4-80b4-00c04fd430c8'
const VALID_INPUT = {
  kudoId: VALID_UUID_V4,
  receiverId: VALID_UUID_V4_B,
  contentHtml: '<p>Cảm ơn bạn rất nhiều!</p>',
  hashtagIds: [VALID_UUID_V4],
  imagePaths: [],
  isAnonymous: false,
  anonymousName: undefined,
}

// ---------------------------------------------------------------------------
// createKudoSchema — happy path
// ---------------------------------------------------------------------------

describe('createKudoSchema — valid input', () => {
  it('accepts a complete valid input', () => {
    const result = createKudoSchema.safeParse(VALID_INPUT)
    expect(result.success).toBe(true)
  })

  it('defaults imagePaths to [] when omitted', () => {
    const { imagePaths: _, ...withoutImages } = VALID_INPUT
    const result = createKudoSchema.safeParse(withoutImages)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.imagePaths).toEqual([])
  })

  it('defaults isAnonymous to false when omitted', () => {
    const { isAnonymous: _, ...without } = VALID_INPUT
    const result = createKudoSchema.safeParse(without)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isAnonymous).toBe(false)
  })

  it('accepts isAnonymous=true with an alias', () => {
    const result = createKudoSchema.safeParse({
      ...VALID_INPUT,
      isAnonymous: true,
      anonymousName: 'Sunner ẩn danh',
    })
    expect(result.success).toBe(true)
  })

  it('accepts up to 5 hashtags', () => {
    const ids = Array.from({ length: 5 }, (_, i) =>
      `550e8400-e29b-41d4-a716-44665544000${i}`,
    )
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, hashtagIds: ids })
    expect(result.success).toBe(true)
  })

  it('accepts up to 5 image paths', () => {
    const paths = Array.from({ length: 5 }, (_, i) => `uid/kudoid/img${i}.jpg`)
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, imagePaths: paths })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createKudoSchema — failure cases
// ---------------------------------------------------------------------------

describe('createKudoSchema — invalid input', () => {
  it('rejects missing receiverId', () => {
    const { receiverId: _, ...without } = VALID_INPUT
    const result = createKudoSchema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it('rejects non-uuid receiverId', () => {
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, receiverId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects empty contentHtml', () => {
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, contentHtml: '' })
    expect(result.success).toBe(false)
  })

  it('rejects contentHtml with only HTML tags (no visible text)', () => {
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, contentHtml: '<p></p>' })
    expect(result.success).toBe(false)
  })

  it('rejects contentHtml exceeding 2000 chars of plain text', () => {
    const longText = 'a'.repeat(2001)
    const result = createKudoSchema.safeParse({
      ...VALID_INPUT,
      contentHtml: `<p>${longText}</p>`,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty hashtagIds array', () => {
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, hashtagIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejects hashtagIds with 6 entries', () => {
    const ids = Array.from({ length: 6 }, (_, i) =>
      `550e8400-e29b-41d4-a716-44665544000${i}`,
    )
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, hashtagIds: ids })
    expect(result.success).toBe(false)
  })

  it('rejects imagePaths with 6 entries', () => {
    const paths = Array.from({ length: 6 }, (_, i) => `uid/kudoid/img${i}.jpg`)
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, imagePaths: paths })
    expect(result.success).toBe(false)
  })

  it('rejects isAnonymous=true with empty string anonymousName', () => {
    const result = createKudoSchema.safeParse({
      ...VALID_INPUT,
      isAnonymous: true,
      anonymousName: '',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// contentHtmlSchema — edge cases
// ---------------------------------------------------------------------------

describe('contentHtmlSchema', () => {
  it('accepts plain text without tags', () => {
    expect(contentHtmlSchema.safeParse('Hello').success).toBe(true)
  })

  it('rejects whitespace-only string', () => {
    expect(contentHtmlSchema.safeParse('   ').success).toBe(false)
  })

  it('rejects HTML that strips to empty', () => {
    expect(contentHtmlSchema.safeParse('<strong></strong>').success).toBe(false)
  })

  it('counts HTML entities correctly', () => {
    // "&amp;" is one char '&' after stripping
    expect(contentHtmlSchema.safeParse('A &amp; B').success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// hashtagIdsSchema
// ---------------------------------------------------------------------------

describe('hashtagIdsSchema', () => {
  it('rejects non-uuid entries', () => {
    expect(hashtagIdsSchema.safeParse(['not-valid']).success).toBe(false)
  })

  it('accepts exactly 1 uuid', () => {
    expect(hashtagIdsSchema.safeParse([VALID_UUID_V4]).success).toBe(true)
  })

  // C1 regression: seed.sql uses non-v4 UUIDs (aaaaaaaa-0000-0000-0000-...).
  // The old v4-only regex rejected them and silently broke every dev submit.
  it('accepts seed hashtag UUIDs (non-v4 format from supabase/seed.sql)', () => {
    const seedHashtagIds = [
      'aaaaaaaa-0000-0000-0000-000000000001', // TeamWork
      'aaaaaaaa-0000-0000-0000-000000000002', // Support
      'aaaaaaaa-0000-0000-0000-000000000003', // Innovation
    ]
    expect(hashtagIdsSchema.safeParse(seedHashtagIds).success).toBe(true)
  })

  it('seed hashtag UUIDs pass the full createKudoSchema', () => {
    const result = createKudoSchema.safeParse({
      kudoId: VALID_UUID_V4,
      receiverId: VALID_UUID_V4_B,
      contentHtml: '<p>Cảm ơn bạn!</p>',
      hashtagIds: ['aaaaaaaa-0000-0000-0000-000000000001'],
      imagePaths: [],
      isAnonymous: false,
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// imagePathsSchema
// ---------------------------------------------------------------------------

describe('imagePathsSchema', () => {
  it('defaults to [] when undefined', () => {
    const result = imagePathsSchema.safeParse(undefined)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual([])
  })

  it('rejects more than 5 paths', () => {
    const paths = Array.from({ length: 6 }, (_, i) => `path${i}`)
    expect(imagePathsSchema.safeParse(paths).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// countContentChars
// ---------------------------------------------------------------------------

describe('countContentChars', () => {
  it('strips tags and counts plain text', () => {
    expect(countContentChars('<p>Hello</p>')).toBe(5)
  })

  it('decodes HTML entities in count', () => {
    expect(countContentChars('A &amp; B')).toBe(5) // "A & B"
  })

  it('returns 0 for empty string', () => {
    expect(countContentChars('')).toBe(0)
  })

  it('returns 0 for tags-only HTML', () => {
    expect(countContentChars('<p><br></p>')).toBe(0)
  })
})

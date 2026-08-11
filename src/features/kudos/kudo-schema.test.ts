import { describe, it, expect } from 'vitest'
import {
  createKudoSchema,
  updateKudoSchema,
  contentHtmlSchema,
  hashtagIdsSchema,
  imagePathsSchema,
  danhHieuSchema,
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
  danhHieu: 'Người truyền động lực cho tôi',
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
// danhHieuSchema — required field (phase-08)
// ---------------------------------------------------------------------------

describe('danhHieuSchema', () => {
  it('accepts a non-empty title', () => {
    expect(danhHieuSchema.safeParse('Người truyền động lực cho tôi').success).toBe(true)
  })

  it('rejects empty string', () => {
    const result = danhHieuSchema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues[0].message).toBe('Danh hiệu không được để trống')
  })

  it('rejects string exceeding 200 characters', () => {
    expect(danhHieuSchema.safeParse('a'.repeat(201)).success).toBe(false)
  })

  it('accepts exactly 200 characters', () => {
    expect(danhHieuSchema.safeParse('a'.repeat(200)).success).toBe(true)
  })
})

describe('createKudoSchema — danhHieu required', () => {
  it('rejects input when danhHieu is missing', () => {
    const { danhHieu: _, ...withoutDanhHieu } = VALID_INPUT
    const result = createKudoSchema.safeParse(withoutDanhHieu)
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.danhHieu).toBeDefined()
    }
  })

  it('rejects input when danhHieu is empty string', () => {
    const result = createKudoSchema.safeParse({ ...VALID_INPUT, danhHieu: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.danhHieu).toBeDefined()
    }
  })

  it('accepts valid input with danhHieu present', () => {
    expect(createKudoSchema.safeParse(VALID_INPUT).success).toBe(true)
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
      danhHieu: 'Người truyền động lực cho tôi',
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

// ---------------------------------------------------------------------------
// updateKudoSchema — happy path + failure paths
// ---------------------------------------------------------------------------

const VALID_UUID_UPDATE = '550e8400-e29b-41d4-a716-446655440000'
const VALID_UUID_TAG_U  = '6ba7b810-9dad-41d4-80b4-00c04fd430c8'

const VALID_UPDATE_INPUT = {
  kudoId:      VALID_UUID_UPDATE,
  contentHtml: '<p>Updated content</p>',
  danhHieu:    'Người cải tiến tiên phong',
  hashtagIds:  [VALID_UUID_TAG_U],
  imagePaths:  [],
}

describe('updateKudoSchema — valid input', () => {
  it('accepts a complete valid update input', () => {
    const result = updateKudoSchema.safeParse(VALID_UPDATE_INPUT)
    expect(result.success).toBe(true)
  })

  it('defaults imagePaths to [] when omitted', () => {
    const { imagePaths: _, ...withoutImages } = VALID_UPDATE_INPUT
    const result = updateKudoSchema.safeParse(withoutImages)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.imagePaths).toEqual([])
  })

  it('accepts up to 5 hashtag IDs', () => {
    const ids = Array.from({ length: 5 }, (_, i) =>
      `00000000-0000-0000-0000-00000000000${i + 1}`,
    )
    const result = updateKudoSchema.safeParse({ ...VALID_UPDATE_INPUT, hashtagIds: ids })
    expect(result.success).toBe(true)
  })
})

describe('updateKudoSchema — invalid input', () => {
  it('rejects missing kudoId', () => {
    const { kudoId: _, ...rest } = VALID_UPDATE_INPUT
    const result = updateKudoSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID kudoId', () => {
    const result = updateKudoSchema.safeParse({ ...VALID_UPDATE_INPUT, kudoId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects empty contentHtml', () => {
    const result = updateKudoSchema.safeParse({ ...VALID_UPDATE_INPUT, contentHtml: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty danhHieu', () => {
    const result = updateKudoSchema.safeParse({ ...VALID_UPDATE_INPUT, danhHieu: '' })
    expect(result.success).toBe(false)
  })

  it('rejects zero hashtags', () => {
    const result = updateKudoSchema.safeParse({ ...VALID_UPDATE_INPUT, hashtagIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejects more than 5 hashtags', () => {
    const ids = Array.from({ length: 6 }, (_, i) =>
      `00000000-0000-0000-0000-00000000000${i + 1}`,
    )
    const result = updateKudoSchema.safeParse({ ...VALID_UPDATE_INPUT, hashtagIds: ids })
    expect(result.success).toBe(false)
  })

  it('rejects more than 5 image paths', () => {
    const paths = Array.from({ length: 6 }, (_, i) => `path/img-${i}.jpg`)
    const result = updateKudoSchema.safeParse({ ...VALID_UPDATE_INPUT, imagePaths: paths })
    expect(result.success).toBe(false)
  })

  it('rejects danhHieu over 200 characters', () => {
    const result = updateKudoSchema.safeParse({
      ...VALID_UPDATE_INPUT,
      danhHieu: 'x'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('note: update schema has no receiverId field (receiver cannot change on edit)', () => {
    // Passing receiverId is silently stripped by Zod (unknown key) — it does NOT
    // cause a parse failure (strict mode not enabled on this schema by design).
    const result = updateKudoSchema.safeParse({
      ...VALID_UPDATE_INPUT,
      receiverId: VALID_UUID_TAG_U,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      // @ts-expect-error — receiverId is not in the schema output type
      expect(result.data.receiverId).toBeUndefined()
    }
  })
})

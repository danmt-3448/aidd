/**
 * Unit tests for board-queries.ts
 *
 * Strategy: mock @/lib/supabase/server so no real DB is needed.
 * We test the pure transformation and branching logic:
 *  - getHighlightKudos: weighted ranking, top-5 cap, mask (senderId=null on anon)
 *  - listBoardKudos: keyset cursor construction, heartCount + likedByMe mapping
 *  - getSpotlightAggregation: receiver aggregation + sort
 *
 * Server actions that call `createClient()` are exercised by controlling the
 * mock's return value per test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

// ── Supabase mock wiring ─────────────────────────────────────────────────────
// vitest.setup.ts already stubs @/lib/supabase/server; here we import the
// mock so individual tests can control what it returns.

import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as Mock

// ---------------------------------------------------------------------------
// Helper: build a chainable Supabase query mock.
// The builder pattern means each method returns `this`; the final await
// resolves to `{ data, error }`.
// ---------------------------------------------------------------------------

function makeQueryMock(result: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const chain = (): typeof self => self

  self.from = vi.fn(() => self)
  self.select = vi.fn(chain)
  self.eq = vi.fn(chain)
  self.or = vi.fn(chain)
  self.order = vi.fn(chain)
  self.limit = vi.fn(chain)
  self.maybeSingle = vi.fn(() => Promise.resolve(result))
  // Make the mock itself awaitable (covers `await q.order().limit()`).
  self.then = (resolve: (v: unknown) => void) => resolve(result)

  return self
}

// Supabase client shape used by board-queries.
interface MockClient {
  auth: { getUser: Mock }
  from: Mock
}

function makeClient(uid: string | null, fromImpl: (table: string) => unknown): MockClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: uid ? { id: uid } : null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => fromImpl(table)),
  }
}

// ---------------------------------------------------------------------------
// Import the module under test AFTER mocks are configured.
// ---------------------------------------------------------------------------

import {
  getHighlightKudos,
  listBoardKudos,
  getSpotlightAggregation,
} from './board-queries'

// ---------------------------------------------------------------------------
// getHighlightKudos
// ---------------------------------------------------------------------------

describe('getHighlightKudos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns top-5 rows ordered by weighted heart count', async () => {
    // 6 kudos; kudo with id='k6' has 4 hearts (2 special) and should rank
    // first when multiplier=2. k1 has 3 plain hearts → second.
    const kudoRows = Array.from({ length: 6 }, (_, i) => {
      const id = `k${i + 1}`
      const hearts =
        id === 'k6'
          ? [
              { user_id: 'u1', is_special_day: true },
              { user_id: 'u2', is_special_day: true },
              { user_id: 'u3', is_special_day: false },
              { user_id: 'u4', is_special_day: false },
            ]
          : id === 'k1'
            ? [
                { user_id: 'u1', is_special_day: false },
                { user_id: 'u2', is_special_day: false },
                { user_id: 'u3', is_special_day: false },
              ]
            : []
      return {
        id,
        sender_id: null,
        sender_name: 'Ẩn danh',
        sender_avatar_url: null,
        receiver_name: 'Receiver',
        receiver_avatar_url: null,
        content_html: '<p>hello</p>',
        created_at: '2026-08-01T00:00:00Z',
        hearts,
      }
    })

    mockCreateClient.mockResolvedValue(
      makeClient('viewer', (table) => {
        if (table === 'special_day_config') {
          // Return multiplier=2 for today.
          const m = makeQueryMock({ data: { hearts_multiplier: 2 }, error: null })
          return m
        }
        // kudos_public
        const m: Record<string, unknown> = {}
        m.from = vi.fn(() => m)
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: kudoRows, error: null }))
        return m
      }),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(false)
    if ('error' in result) return

    // At most 5 rows.
    expect(result.data.length).toBeLessThanOrEqual(5)

    // k6: score = 4 + 2*(2-1) = 6; k1: score = 3 + 0 = 3. k6 must be first.
    expect(result.data[0]?.id).toBe('k6')
    expect(result.data[1]?.id).toBe('k1')
  })

  it('returns ≤5 rows even when more kudos exist', async () => {
    const kudoRows = Array.from({ length: 20 }, (_, i) => ({
      id: `k${i}`,
      sender_id: null,
      sender_name: 'Ẩn danh',
      sender_avatar_url: null,
      receiver_name: 'Receiver',
      receiver_avatar_url: null,
      content_html: '<p>x</p>',
      created_at: '2026-08-01T00:00:00Z',
      hearts: [{ user_id: `u${i}`, is_special_day: false }],
    }))

    mockCreateClient.mockResolvedValue(
      makeClient(null, (table) => {
        if (table === 'special_day_config') {
          return makeQueryMock({ data: null, error: null })
        }
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: kudoRows, error: null }))
        return m
      }),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data.length).toBeLessThanOrEqual(5)
  })

  it('masks sender: senderId=null for anonymous kudo', async () => {
    const kudoRows = [
      {
        id: 'k1',
        sender_id: null, // masked by kudos_public view
        sender_name: 'Ẩn danh',
        sender_avatar_url: null,
        receiver_name: 'Alice',
        receiver_avatar_url: null,
        content_html: '<p>hi</p>',
        created_at: '2026-08-01T00:00:00Z',
        hearts: [],
      },
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(null, (table) => {
        if (table === 'special_day_config') {
          return makeQueryMock({ data: null, error: null })
        }
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: kudoRows, error: null }))
        return m
      }),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]?.senderId).toBeNull()
    expect(result.data[0]?.receiverName).toBe('Alice')
  })

  it('returns error when Supabase query fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(null, (table) => {
        if (table === 'special_day_config') {
          return makeQueryMock({ data: null, error: null })
        }
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() =>
          Promise.resolve({ data: null, error: { message: 'DB error' } }),
        )
        return m
      }),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listBoardKudos
// ---------------------------------------------------------------------------

describe('listBoardKudos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped rows with heartCount and likedByMe=false for unauthenticated', async () => {
    const rawRows = [
      {
        id: 'k1',
        sender_id: 'u1',
        sender_name: 'Alice',
        sender_avatar_url: null,
        receiver_id: 'r1',
        receiver_name: 'Bob',
        receiver_avatar_url: null,
        content_html: '<p>kudos</p>',
        created_at: '2026-08-01T10:00:00Z',
        hearts: [
          { user_id: 'u2', is_special_day: false },
          { user_id: 'u3', is_special_day: false },
        ],
      },
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(null, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: rawRows, error: null }))
        return m
      }),
    )

    const result = await listBoardKudos({})
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data[0]?.heartCount).toBe(2)
    expect(result.data[0]?.likedByMe).toBe(false)
    expect(result.data[0]?.senderId).toBe('u1')
    expect(result.data[0]?.receiverId).toBe('r1')
  })

  it('sets likedByMe=true when calling user has a heart', async () => {
    const viewerId = 'viewer-uid'
    const rawRows = [
      {
        id: 'k1',
        sender_id: 'u1',
        sender_name: 'Alice',
        sender_avatar_url: null,
        receiver_name: 'Bob',
        receiver_avatar_url: null,
        content_html: '<p>hi</p>',
        created_at: '2026-08-01T10:00:00Z',
        hearts: [{ user_id: viewerId, is_special_day: false }],
      },
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(viewerId, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: rawRows, error: null }))
        return m
      }),
    )

    const result = await listBoardKudos({})
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]?.likedByMe).toBe(true)
  })

  it('sets nextCursor when page is full', async () => {
    const limit = 20
    const rawRows = Array.from({ length: limit }, (_, i) => ({
      id: `k${i}`,
      sender_id: null,
      sender_name: 'Ẩn danh',
      sender_avatar_url: null,
      receiver_name: 'R',
      receiver_avatar_url: null,
      content_html: '<p>x</p>',
      created_at: `2026-08-01T0${String(i).padStart(1, '0')}:00:00Z`,
      hearts: [],
    }))

    mockCreateClient.mockResolvedValue(
      makeClient(null, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: rawRows, error: null }))
        return m
      }),
    )

    const result = await listBoardKudos({ limit })
    expect('error' in result).toBe(false)
    if ('error' in result) return

    const lastRow = rawRows[rawRows.length - 1]!
    expect(result.nextCursor).toEqual({
      createdAt: lastRow.created_at,
      id: lastRow.id,
    })
  })

  it('sets nextCursor=null when page is not full', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(null, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: [], error: null }))
        return m
      }),
    )

    const result = await listBoardKudos({ limit: 20 })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.nextCursor).toBeNull()
  })

  it('returns error on invalid kudoId UUID in cursor', async () => {
    const result = await listBoardKudos({
      cursor: { createdAt: '2026-08-01T00:00:00Z', id: 'not-a-uuid' },
    })
    expect('error' in result).toBe(true)
  })

  it('returns error on malformed createdAt in cursor (H-4 strict datetime)', async () => {
    // H-4: z.string().datetime() rejects non-ISO8601 values before reaching PostgREST.
    const result = await listBoardKudos({
      cursor: { createdAt: 'not-a-date', id: '00000000-0000-0000-0000-000000000001' },
    })
    expect('error' in result).toBe(true)
  })

  it('returns error when Supabase query fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(null, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() =>
          Promise.resolve({ data: null, error: { message: 'fail' } }),
        )
        return m
      }),
    )

    const result = await listBoardKudos({})
    expect('error' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getSpotlightAggregation
// ---------------------------------------------------------------------------

describe('getSpotlightAggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates kudo counts per receiver and sorts descending', async () => {
    const rawRows = [
      { receiver_id: 'r1', receiver_name: 'Alice', receiver_avatar_url: null },
      { receiver_id: 'r2', receiver_name: 'Bob', receiver_avatar_url: '/b.png' },
      { receiver_id: 'r1', receiver_name: 'Alice', receiver_avatar_url: null },
      { receiver_id: 'r1', receiver_name: 'Alice', receiver_avatar_url: null },
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(null, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: rawRows, error: null }))
        return m
      }),
    )

    const result = await getSpotlightAggregation({})
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data[0]?.receiverId).toBe('r1')
    expect(result.data[0]?.kudoCount).toBe(3)
    expect(result.data[1]?.receiverId).toBe('r2')
    expect(result.data[1]?.kudoCount).toBe(1)
  })

  it('returns empty array when no kudos exist', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(null, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: [], error: null }))
        return m
      }),
    )

    const result = await getSpotlightAggregation({})
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data).toEqual([])
  })

  it('returns error when Supabase query fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(null, () => {
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.limit = vi.fn(() =>
          Promise.resolve({ data: null, error: { message: 'db down' } }),
        )
        return m
      }),
    )

    const result = await getSpotlightAggregation({})
    expect('error' in result).toBe(true)
  })

  it('returns error for invalid hashtagId UUID', async () => {
    const result = await getSpotlightAggregation({ hashtagId: 'bad-uuid' })
    expect('error' in result).toBe(true)
  })
})

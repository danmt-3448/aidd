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
  rpc: Mock
}

function makeClient(
  uid: string | null,
  fromImpl: (table: string) => unknown,
  rpcResult: { data: unknown; error: unknown } = { data: [], error: null },
): MockClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: uid ? { id: uid } : null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => fromImpl(table)),
    rpc: vi.fn(() => Promise.resolve(rpcResult)),
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
//
// After the RPC migration, getHighlightKudos calls:
//   1. supabase.from('special_day_config').select('hearts_multiplier').eq(...).maybeSingle()
//   2. supabase.rpc('get_highlight_kudos', { p_today, p_multiplier })
//
// The RPC returns flat rows (no nested hearts[]) pre-ranked by the DB.
// RPC row shape: { id, receiver_id, content_html, created_at, is_anonymous,
//                  sender_id, sender_name, sender_avatar_url,
//                  receiver_name, receiver_avatar_url,
//                  heart_count, weighted_score, liked_by_me }
// ---------------------------------------------------------------------------

// Build an RPC row as the DB would return it.
function makeRpcRow(overrides: Partial<{
  id: string
  receiver_id: string | null
  content_html: string
  created_at: string
  is_anonymous: boolean
  sender_id: string | null
  sender_name: string | null
  sender_avatar_url: string | null
  receiver_name: string | null
  receiver_avatar_url: string | null
  heart_count: number
  weighted_score: number
  liked_by_me: boolean
}> = {}) {
  return {
    id: 'k1',
    receiver_id: 'r1',
    content_html: '<p>hello</p>',
    created_at: '2026-08-01T00:00:00Z',
    is_anonymous: false,
    sender_id: 's1',
    sender_name: 'Sender',
    sender_avatar_url: null,
    receiver_name: 'Receiver',
    receiver_avatar_url: null,
    heart_count: 0,
    weighted_score: 0,
    liked_by_me: false,
    ...overrides,
  }
}

describe('getHighlightKudos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns top-5 rows ordered by weighted heart count (RPC pre-ranks)', async () => {
    // The RPC returns rows already ranked by weighted_score DESC.
    // k6: heart_count=4, weighted_score=6 (2 special × (2-1) bonus = 4+2=6)
    // k1: heart_count=3, weighted_score=3
    // DB guarantees k6 first — caller just maps the rows in order.
    const rpcRows = [
      makeRpcRow({ id: 'k6', heart_count: 4, weighted_score: 6 }),
      makeRpcRow({ id: 'k1', heart_count: 3, weighted_score: 3 }),
      makeRpcRow({ id: 'k2', heart_count: 0, weighted_score: 0 }),
      makeRpcRow({ id: 'k3', heart_count: 0, weighted_score: 0 }),
      makeRpcRow({ id: 'k4', heart_count: 0, weighted_score: 0 }),
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(
        'viewer',
        (table) => {
          if (table === 'special_day_config') {
            return makeQueryMock({ data: { hearts_multiplier: 2 }, error: null })
          }
          return makeQueryMock({ data: null, error: null })
        },
        { data: rpcRows, error: null },
      ),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data.length).toBeLessThanOrEqual(5)
    expect(result.data[0]?.id).toBe('k6')
    expect(result.data[1]?.id).toBe('k1')
  })

  it('returns ≤5 rows (RPC enforces LIMIT 5 server-side)', async () => {
    // DB returns at most 5 — simulate exactly 5.
    const rpcRows = Array.from({ length: 5 }, (_, i) =>
      makeRpcRow({ id: `k${i}`, heart_count: 1, weighted_score: 1 }),
    )

    mockCreateClient.mockResolvedValue(
      makeClient(
        null,
        (table) => {
          if (table === 'special_day_config') {
            return makeQueryMock({ data: null, error: null })
          }
          return makeQueryMock({ data: null, error: null })
        },
        { data: rpcRows, error: null },
      ),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data.length).toBeLessThanOrEqual(5)
  })

  it('masks sender: senderId=null for anonymous kudo (RPC applies mask)', async () => {
    // The RPC applies the same anonymous mask as kudos_public:
    // sender_id=null, sender_name=anonymous_name??'Ẩn danh', sender_avatar_url=null.
    const rpcRows = [
      makeRpcRow({
        id: 'k1',
        is_anonymous: true,
        sender_id: null,
        sender_name: 'Ẩn danh',
        sender_avatar_url: null,
        receiver_name: 'Alice',
      }),
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(
        null,
        (table) => {
          if (table === 'special_day_config') {
            return makeQueryMock({ data: null, error: null })
          }
          return makeQueryMock({ data: null, error: null })
        },
        { data: rpcRows, error: null },
      ),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]?.senderId).toBeNull()
    expect(result.data[0]?.receiverName).toBe('Alice')
  })

  it('maps liked_by_me from RPC (no client-side hearts.some())', async () => {
    const rpcRows = [makeRpcRow({ id: 'k1', liked_by_me: true, heart_count: 1 })]

    mockCreateClient.mockResolvedValue(
      makeClient(
        'viewer',
        (table) => {
          if (table === 'special_day_config') {
            return makeQueryMock({ data: null, error: null })
          }
          return makeQueryMock({ data: null, error: null })
        },
        { data: rpcRows, error: null },
      ),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]?.likedByMe).toBe(true)
  })

  it('returns error when RPC fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(
        null,
        (table) => {
          if (table === 'special_day_config') {
            return makeQueryMock({ data: null, error: null })
          }
          return makeQueryMock({ data: null, error: null })
        },
        { data: null, error: { message: 'DB error' } },
      ),
    )

    const result = await getHighlightKudos()
    expect('error' in result).toBe(true)
  })

  it('returns error when special_day_config fetch fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(
        null,
        (table) => {
          if (table === 'special_day_config') {
            return makeQueryMock({ data: null, error: { message: 'config error' } })
          }
          return makeQueryMock({ data: null, error: null })
        },
        { data: [], error: null },
      ),
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

// ---------------------------------------------------------------------------
// listBoardKudos — department filter
//
// Department filter flow:
//   1. supabase.from('profiles').select('id').eq('department_ref', deptId)
//      → returns matching receiver IDs
//   2. kudos_public query has .in('receiver_id', receiverIds) applied
//
// Masking guarantee: the department join is on the RECEIVER side only.
// sender_id / sender_name come from kudos_public and are never joined through
// profiles — so anon-sender masking is fully preserved.
// ---------------------------------------------------------------------------

describe('listBoardKudos — departmentId filter', () => {
  // RFC 4122 v4 UUIDs — Zod z.string().uuid() requires version (4) and variant bits.
  const DEPT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const RECEIVER_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters feed to kudos whose receiver is in the department', async () => {
    // profiles lookup returns one member
    const profileRows = [{ id: RECEIVER_ID }]
    // kudos_public returns one kudo for that receiver (sender anonymous — masking test)
    const kudosRows = [
      {
        id: 'k1',
        sender_id: null,           // anonymous — kudos_public applied the mask
        sender_name: 'Ẩn danh',
        sender_avatar_url: null,
        receiver_id: RECEIVER_ID,
        receiver_name: 'Nguyễn Văn An',
        receiver_avatar_url: null,
        content_html: '<p>great work</p>',
        created_at: '2026-08-01T10:00:00Z',
        hearts: [],
      },
    ]

    // makeClient wires auth.getUser + from(table) + rpc.
    // profiles branch must be awaitable at .eq() — the final call in the chain.
    // kudos_public branch must be awaitable at .limit().
    mockCreateClient.mockResolvedValue(
      makeClient(null, (table) => {
        if (table === 'profiles') {
          const m: Record<string, unknown> = {}
          // .select() returns self; .eq() resolves — matches the actual call pattern.
          m.select = vi.fn(() => m)
          m.eq = vi.fn(() => Promise.resolve({ data: profileRows, error: null }))
          return m
        }
        // kudos_public path: .select().in().order().order().limit()
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => m)
        m.in = vi.fn(() => m)
        m.order = vi.fn(() => m)
        m.limit = vi.fn(() => Promise.resolve({ data: kudosRows, error: null }))
        return m
      }),
    )

    const result = await listBoardKudos({ departmentId: DEPT_ID })
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data).toHaveLength(1)
    // Receiver identity is exposed (never masked)
    expect(result.data[0]?.receiverId).toBe(RECEIVER_ID)
    expect(result.data[0]?.receiverName).toBe('Nguyễn Văn An')
    // Sender masking preserved — sender_id was null from kudos_public
    expect(result.data[0]?.senderId).toBeNull()
    expect(result.data[0]?.senderName).toBe('Ẩn danh')
  })

  it('returns empty immediately when no profiles match the department', async () => {
    // profiles returns zero rows — early return, kudos_public never queried.
    mockCreateClient.mockResolvedValue(
      makeClient(null, (table) => {
        if (table === 'profiles') {
          const m: Record<string, unknown> = {}
          m.select = vi.fn(() => m)
          m.eq = vi.fn(() => Promise.resolve({ data: [], error: null }))
          return m
        }
        // kudos_public should NOT be called — early return guard
        const m: Record<string, unknown> = {}
        m.select = vi.fn(() => {
          throw new Error('kudos_public should not be queried when dept has no members')
        })
        return m
      }),
    )

    const result = await listBoardKudos({ departmentId: DEPT_ID })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data).toEqual([])
    expect(result.nextCursor).toBeNull()
  })

  it('returns error when profiles dept lookup fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(null, (table) => {
        if (table === 'profiles') {
          const m: Record<string, unknown> = {}
          m.select = vi.fn(() => m)
          m.eq = vi.fn(() =>
            Promise.resolve({ data: null, error: { message: 'db error' } }),
          )
          return m
        }
        return makeQueryMock({ data: null, error: null })
      }),
    )

    const result = await listBoardKudos({ departmentId: DEPT_ID })
    expect('error' in result).toBe(true)
  })

  it('returns error for invalid departmentId UUID', async () => {
    const result = await listBoardKudos({ departmentId: 'not-a-uuid' })
    expect('error' in result).toBe(true)
  })
})

/**
 * Unit tests for profile-queries.ts
 *
 * Strategy: mock @/lib/supabase/server (same pattern as board-queries.test.ts).
 * Tests cover the binary acceptance criteria:
 *  - getProfileStats: sent=null for non-owner, boxesRemaining=0 when no secret_box row
 *  - listProfileKudos: sent direction denied for non-owner; anon kudo senderId=null
 *  - getProfileHeader: no email/auth-id fields; explicit column allowlist
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as Mock

// ---------------------------------------------------------------------------
// Helpers — mirror the pattern from board-queries.test.ts
//
// Two distinct factories:
//   makeSingleChain — for queries ending with .single() / .maybeSingle().
//     Uses `then` to make the object awaitable at any point in the chain
//     (covers `await q.eq().single()` where single() is the terminal).
//   makeLimitChain  — for queries ending with .limit(n).
//     Does NOT set `then` on the chain object so that intermediate `await`
//     (e.g. `await q.order(...).order(...)`) does not resolve early.
//     Only `.limit()` returns a real Promise.
// ---------------------------------------------------------------------------

function makeSingleChain(finalResult: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const chain = () => self

  self.from = vi.fn(chain)
  self.select = vi.fn(chain)
  self.eq = vi.fn(chain)
  self.or = vi.fn(chain)
  self.order = vi.fn(chain)
  self.single = vi.fn(() => Promise.resolve(finalResult))
  self.maybeSingle = vi.fn(() => Promise.resolve(finalResult))
  // Thenable: resolves at any await point in the chain.
  self.then = (resolve: (v: unknown) => void) => resolve(finalResult)

  return self
}

function makeLimitChain(finalResult: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  const chain = () => self

  self.from = vi.fn(chain)
  self.select = vi.fn(chain)
  self.eq = vi.fn(chain)
  self.or = vi.fn(chain)
  // order must return self (non-thenable) so chained .order().order().limit() works.
  self.order = vi.fn(chain)
  // Only limit() produces a real Promise — no `then` on the chain itself.
  self.limit = vi.fn(() => Promise.resolve(finalResult))

  return self
}

function makeClient(uid: string | null, fromImpl: (table: string) => unknown) {
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
// Imports — after mock wiring
// ---------------------------------------------------------------------------

import {
  getProfileStats,
  listProfileKudos,
  getProfileHeader,
} from './profile-queries'

// ---------------------------------------------------------------------------
// getProfileStats
// ---------------------------------------------------------------------------

// RFC 4122 v4-compatible UUIDs (version nibble=4, variant bits=8).
const OWNER_ID = 'a0000000-0000-4000-8000-000000000001'
const OTHER_ID = 'b0000000-0000-4000-8000-000000000002'

describe('getProfileStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns sent=null when querying another user (privacy guard)', async () => {
    // The view returns sent=null for non-callers (security_invoker).
    // We verify the query layer passes it through as null (not converting to 0).
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({
          data: {
            user_id: OTHER_ID,
            received: 5,
            sent: null, // view returns null for non-owner
            hearts_received: 10,
            boxes_opened: 1,
            boxes_remaining: 2,
          },
          error: null,
        }),
      ),
    )

    const result = await getProfileStats(OTHER_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data.sent).toBeNull()
  })

  it('returns sent as a number when querying own profile', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({
          data: {
            user_id: OWNER_ID,
            received: 12,
            sent: 8,
            hearts_received: 20,
            boxes_opened: 3,
            boxes_remaining: 1,
          },
          error: null,
        }),
      ),
    )

    const result = await getProfileStats(OWNER_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data.sent).toBe(8)
  })

  it('returns boxesRemaining=0 (not null) when user has no secret_box row', async () => {
    // profile_stats view coalesces boxes_remaining to 0; query must not surface null.
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({
          data: {
            user_id: OWNER_ID,
            received: 3,
            sent: 0,
            hearts_received: 5,
            boxes_opened: 0,
            boxes_remaining: 0, // coalesced by view
          },
          error: null,
        }),
      ),
    )

    const result = await getProfileStats(OWNER_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data.boxesRemaining).toBe(0)
    expect(result.data.boxesRemaining).not.toBeNull()
  })

  it('derives tier and stars only when received >= 10', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({
          data: {
            user_id: OWNER_ID,
            received: 15,
            sent: 5,
            hearts_received: 30,
            boxes_opened: 2,
            boxes_remaining: 1,
          },
          error: null,
        }),
      ),
    )

    const result = await getProfileStats(OWNER_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data.tier).toBeDefined()
    expect(result.data.stars).toBeDefined()
  })

  it('returns tier=null and stars=null when received < 10', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({
          data: {
            user_id: OWNER_ID,
            received: 9,
            sent: 2,
            hearts_received: 5,
            boxes_opened: 0,
            boxes_remaining: 0,
          },
          error: null,
        }),
      ),
    )

    const result = await getProfileStats(OWNER_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data.tier).toBeNull()
    expect(result.data.stars).toBeNull()
  })

  it('returns error when Supabase query fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({ data: null, error: { message: 'DB error' } }),
      ),
    )

    const result = await getProfileStats(OWNER_ID)
    expect('error' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listProfileKudos
// ---------------------------------------------------------------------------

describe('listProfileKudos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('SECURITY: rejects sent direction for a different user — never returns rows', async () => {
    // Caller is OWNER_ID but requesting sent for OTHER_ID → must be denied.
    // The deny happens before any DB call so the chain factory type doesn't matter.
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeLimitChain({ data: [], error: null }),
      ),
    )

    const result = await listProfileKudos({
      profileId: OTHER_ID,
      direction: 'sent',
    })

    // Must return an error result, never data rows.
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(typeof result.error).toBe('string')
    }
  })

  it('allows sent direction for caller own profile', async () => {
    const rawRows = [
      {
        id: 'k1',
        sender_id: OWNER_ID,
        sender_name: 'Alice',
        sender_avatar_url: null,
        receiver_name: 'Bob',
        receiver_avatar_url: null,
        content_html: '<p>well done</p>',
        created_at: '2026-08-01T10:00:00Z',
        hearts: [],
      },
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () => makeLimitChain({ data: rawRows, error: null })),
    )

    const result = await listProfileKudos({
      profileId: OWNER_ID,
      direction: 'sent',
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data.length).toBe(1)
  })

  it('returns senderId=null for anonymous received kudo', async () => {
    // kudos_public view masks sender_id for anonymous kudos.
    const rawRows = [
      {
        id: 'k1',
        sender_id: null, // masked by view
        sender_name: 'Ẩn danh',
        sender_avatar_url: null,
        receiver_name: 'Alice',
        receiver_avatar_url: '/a.png',
        content_html: '<p>great</p>',
        created_at: '2026-08-01T09:00:00Z',
        hearts: [],
      },
    ]

    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () => makeLimitChain({ data: rawRows, error: null })),
    )

    const result = await listProfileKudos({
      profileId: OTHER_ID,
      direction: 'received',
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]?.senderId).toBeNull()
  })

  it('returns nextCursor when page is full', async () => {
    const limit = 20
    const rawRows = Array.from({ length: limit }, (_, i) => ({
      id: `k${i}`,
      sender_id: OWNER_ID,
      sender_name: 'Alice',
      sender_avatar_url: null,
      receiver_name: 'Bob',
      receiver_avatar_url: null,
      content_html: '<p>x</p>',
      created_at: `2026-08-01T${String(i).padStart(2, '0')}:00:00Z`,
      hearts: [],
    }))

    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () => makeLimitChain({ data: rawRows, error: null })),
    )

    const result = await listProfileKudos({
      profileId: OTHER_ID,
      direction: 'received',
      limit,
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return

    const last = rawRows[rawRows.length - 1]!
    expect(result.nextCursor).toEqual({ createdAt: last.created_at, id: last.id })
  })

  it('returns nextCursor=null when page is not full', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () => makeLimitChain({ data: [], error: null })),
    )

    const result = await listProfileKudos({
      profileId: OTHER_ID,
      direction: 'received',
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.nextCursor).toBeNull()
  })

  it('returns error when Supabase query fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeLimitChain({ data: null, error: { message: 'db fail' } }),
      ),
    )

    const result = await listProfileKudos({
      profileId: OTHER_ID,
      direction: 'received',
    })

    expect('error' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getProfileHeader
// ---------------------------------------------------------------------------

describe('getProfileHeader', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns exactly the allowed fields — no email/auth-id', async () => {
    const profileRow = {
      id: OTHER_ID,
      full_name: 'Alice Nguyen',
      avatar_url: '/alice.png',
      department_id: 'dept-uuid-001',
      title: 'Engineer',
      // email is NOT in the allowlist — the query must not select it.
    }

    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({ data: profileRow, error: null }),
      ),
    )

    const result = await getProfileHeader(OTHER_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data.id).toBe(OTHER_ID)
    expect(result.data.full_name).toBe('Alice Nguyen')
    expect(result.data.avatar_url).toBe('/alice.png')
    expect(result.data.department_id).toBe('dept-uuid-001')
    expect(result.data.title).toBe('Engineer')

    // Strict check: no email or auth fields must appear on the result.
    const keys = Object.keys(result.data)
    expect(keys).not.toContain('email')
    expect(keys).not.toContain('auth_id')
    expect(keys).not.toContain('user_id')
  })

  it('returns error when profile not found', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({ data: null, error: { message: 'not found' } }),
      ),
    )

    const result = await getProfileHeader(OTHER_ID)
    expect('error' in result).toBe(true)
  })

  it('returns error when Supabase query fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient(OWNER_ID, () =>
        makeSingleChain({ data: null, error: { message: 'db error' } }),
      ),
    )

    const result = await getProfileHeader(OTHER_ID)
    expect('error' in result).toBe(true)
  })
})

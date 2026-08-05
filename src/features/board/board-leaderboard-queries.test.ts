/**
 * Unit tests for board-leaderboard-queries.ts
 *
 * Tests:
 *  - getRankingLeaderboard: maps RPC rows, handles empty, handles error
 *  - getGiftLeaderboard: same shape
 *  - getSpotlightAggregationRpc: maps RPC rows, validates hashtagId UUID, handles error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as Mock

// ---------------------------------------------------------------------------
// Helper: build a client mock whose rpc() resolves to a given result.
// ---------------------------------------------------------------------------

function makeClient(rpcResult: { data: unknown; error: unknown }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue(rpcResult),
  }
}

// ---------------------------------------------------------------------------
// Shared leaderboard RPC row shape.
// ---------------------------------------------------------------------------

function makeLeaderboardRow(overrides: Partial<{
  rank: number
  user_id: string
  name: string
  avatar_url: string | null
  score: number
}> = {}) {
  return {
    rank: 1,
    user_id: '00000000-0000-0000-0000-000000000001',
    name: 'Alice',
    avatar_url: null,
    score: 5,
    ...overrides,
  }
}

import {
  getRankingLeaderboard,
  getGiftLeaderboard,
  getSpotlightAggregationRpc,
} from './board-leaderboard-queries'

// ---------------------------------------------------------------------------
// getRankingLeaderboard — BOARD-3
// ---------------------------------------------------------------------------

describe('getRankingLeaderboard', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns mapped LeaderboardEntry[] from RPC rows', async () => {
    const rows = [
      makeLeaderboardRow({ rank: 1, name: 'Alice', score: 10 }),
      makeLeaderboardRow({ rank: 2, user_id: '00000000-0000-0000-0000-000000000002', name: 'Bob', score: 5 }),
    ]
    mockCreateClient.mockResolvedValue(makeClient({ data: rows, error: null }))

    const result = await getRankingLeaderboard()
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toMatchObject({ rank: 1, name: 'Alice', score: 10 })
    expect(result.data[1]).toMatchObject({ rank: 2, name: 'Bob', score: 5 })
  })

  it('returns empty array when no kudos exist', async () => {
    mockCreateClient.mockResolvedValue(makeClient({ data: [], error: null }))

    const result = await getRankingLeaderboard()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data).toEqual([])
  })

  it('coerces null name to empty string', async () => {
    const rows = [makeLeaderboardRow({ name: null as unknown as string })]
    mockCreateClient.mockResolvedValue(makeClient({ data: rows, error: null }))

    const result = await getRankingLeaderboard()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]?.name).toBe('')
  })

  it('returns error when RPC fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ data: null, error: { message: 'rpc error' } }),
    )
    const result = await getRankingLeaderboard()
    expect('error' in result).toBe(true)
  })

  it('returns error when createClient throws', async () => {
    mockCreateClient.mockRejectedValue(new Error('conn failed'))
    const result = await getRankingLeaderboard()
    expect('error' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getGiftLeaderboard — BOARD-4
// ---------------------------------------------------------------------------

describe('getGiftLeaderboard', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns mapped LeaderboardEntry[] from RPC rows', async () => {
    const rows = [
      makeLeaderboardRow({ rank: 1, name: 'Carol', score: 3 }),
    ]
    mockCreateClient.mockResolvedValue(makeClient({ data: rows, error: null }))

    const result = await getGiftLeaderboard()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]).toMatchObject({ rank: 1, name: 'Carol', score: 3 })
  })

  it('returns empty array when no badges exist', async () => {
    mockCreateClient.mockResolvedValue(makeClient({ data: [], error: null }))

    const result = await getGiftLeaderboard()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data).toEqual([])
  })

  it('returns error when RPC fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ data: null, error: { message: 'fail' } }),
    )
    const result = await getGiftLeaderboard()
    expect('error' in result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getSpotlightAggregationRpc — BOARD-5
// ---------------------------------------------------------------------------

function makeSpotlightRow(overrides: Partial<{
  receiver_id: string
  receiver_name: string | null
  avatar_url: string | null
  kudo_count: number
}> = {}) {
  return {
    receiver_id: '00000000-0000-0000-0000-000000000001',
    receiver_name: 'Alice',
    avatar_url: null,
    kudo_count: 3,
    ...overrides,
  }
}

describe('getSpotlightAggregationRpc', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns mapped SpotlightRpcNode[] from RPC rows', async () => {
    const rows = [
      makeSpotlightRow({ receiver_id: 'r1', receiver_name: 'Alice', kudo_count: 5 }),
      makeSpotlightRow({ receiver_id: 'r2', receiver_name: 'Bob', kudo_count: 2 }),
    ]
    mockCreateClient.mockResolvedValue(makeClient({ data: rows, error: null }))

    const result = await getSpotlightAggregationRpc({})
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data[0]).toMatchObject({ receiverId: 'r1', name: 'Alice', kudoCount: 5 })
    expect(result.data[1]).toMatchObject({ receiverId: 'r2', name: 'Bob', kudoCount: 2 })
  })

  it('returns empty array when no kudos exist', async () => {
    mockCreateClient.mockResolvedValue(makeClient({ data: [], error: null }))

    const result = await getSpotlightAggregationRpc({})
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data).toEqual([])
  })

  it('coerces null receiver_name to empty string', async () => {
    const rows = [makeSpotlightRow({ receiver_name: null })]
    mockCreateClient.mockResolvedValue(makeClient({ data: rows, error: null }))

    const result = await getSpotlightAggregationRpc({})
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data[0]?.name).toBe('')
  })

  it('passes hashtagId to RPC when provided', async () => {
    const client = makeClient({ data: [], error: null })
    mockCreateClient.mockResolvedValue(client)

    // Must be a valid RFC 4122 v4 UUID (Zod v4 .uuid() enforces version/variant bits).
    const hashtagId = 'a0e33a1f-bcc7-4b3e-8901-000000000001'
    await getSpotlightAggregationRpc({ hashtagId })

    expect(client.rpc).toHaveBeenCalledWith('get_spotlight_aggregation', {
      p_hashtag_id: hashtagId,
    })
  })

  it('passes null when hashtagId is omitted', async () => {
    const client = makeClient({ data: [], error: null })
    mockCreateClient.mockResolvedValue(client)

    await getSpotlightAggregationRpc({})

    expect(client.rpc).toHaveBeenCalledWith('get_spotlight_aggregation', {
      p_hashtag_id: null,
    })
  })

  it('returns error for invalid hashtagId UUID', async () => {
    const result = await getSpotlightAggregationRpc({ hashtagId: 'not-a-uuid' })
    expect('error' in result).toBe(true)
  })

  it('returns error when RPC fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ data: null, error: { message: 'db down' } }),
    )
    const result = await getSpotlightAggregationRpc({})
    expect('error' in result).toBe(true)
  })
})

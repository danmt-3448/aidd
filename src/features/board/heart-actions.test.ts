/**
 * Unit tests for heart-actions.ts — toggleHeart server action.
 *
 * toggleHeart now delegates the whole like/unlike to the `toggle_heart` RPC
 * (migration 20260811010000) — one atomic call returning { liked, heart_count }.
 * Tests cover:
 *  - Input validation (UUID guard)
 *  - Auth guard (unauthenticated caller)
 *  - Like / unlike happy paths (RPC result mapped to { liked, heartCount })
 *  - Friendly error mapping for RPC codes: P0008 (self), P0007 (not found), generic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as Mock

/** Build a Supabase client mock whose `.rpc(...).single()` resolves to the given result. */
function makeRpcClient({
  uid,
  rpcData,
  rpcError,
}: {
  uid: string | null
  rpcData?: { liked: boolean; heart_count: number }
  rpcError?: { code: string; message: string }
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: uid ? { id: uid } : null },
        error: null,
      }),
    },
    rpc: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: rpcData ?? null,
        error: rpcError ?? null,
      }),
    })),
  }
}

import { toggleHeart } from './heart-actions'

// Valid RFC 4122 v4 UUID for test input (Zod v4 enforces version+variant bits).
const KUDO_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('toggleHeart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid UUID input', async () => {
    const result = await toggleHeart('not-a-uuid')
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error).toContain('UUID')
  })

  it('returns error when caller is unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeRpcClient({ uid: null }))
    const result = await toggleHeart(KUDO_ID)
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error).toContain('đăng nhập')
  })

  it('like path: RPC liked=true → { liked: true, heartCount }', async () => {
    mockCreateClient.mockResolvedValue(
      makeRpcClient({ uid: 'user-a', rpcData: { liked: true, heart_count: 3 } }),
    )
    const result = await toggleHeart(KUDO_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data.liked).toBe(true)
    expect(result.data.heartCount).toBe(3)
  })

  it('unlike path: RPC liked=false → { liked: false, heartCount }', async () => {
    mockCreateClient.mockResolvedValue(
      makeRpcClient({ uid: 'user-a', rpcData: { liked: false, heart_count: 1 } }),
    )
    const result = await toggleHeart(KUDO_ID)
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data.liked).toBe(false)
    expect(result.data.heartCount).toBe(1)
  })

  it('self-heart: RPC P0008 → friendly "chính mình" error', async () => {
    mockCreateClient.mockResolvedValue(
      makeRpcClient({
        uid: 'user-a',
        rpcError: { code: 'P0008', message: 'cannot heart own kudo' },
      }),
    )
    const result = await toggleHeart(KUDO_ID)
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error).toContain('chính mình')
  })

  it('kudo not found: RPC P0007 → friendly "không tồn tại" error', async () => {
    mockCreateClient.mockResolvedValue(
      makeRpcClient({
        uid: 'user-a',
        rpcError: { code: 'P0007', message: 'kudo not found' },
      }),
    )
    const result = await toggleHeart(KUDO_ID)
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error).toContain('không tồn tại')
  })

  it('generic RPC error → friendly fallback', async () => {
    mockCreateClient.mockResolvedValue(
      makeRpcClient({
        uid: 'user-a',
        rpcError: { code: 'XX000', message: 'boom' },
      }),
    )
    const result = await toggleHeart(KUDO_ID)
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error).toContain('Vui lòng thử lại')
  })
})

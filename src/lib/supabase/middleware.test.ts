/**
 * Unit tests for updateSession() — the middleware session/identity resolver.
 *
 * Phase 06 (optimize-nav-latency): identity now comes from getClaims() (local ES256
 * verify, no /auth/v1/user round-trip) with a getUser() fallback that ALSO handles
 * token refresh. The safety-critical invariant these tests lock in:
 *
 *   - Valid, non-expired claims  → accept locally, getUser() NOT called (the fast path).
 *   - Expired claims (exp <= now) → fall back to getUser() (which refreshes the session).
 *   - getClaims error            → fall back to getUser().
 *   - No session anywhere        → user = null (guard will redirect to /login).
 *
 * The expired-token case is the one that must fall back: getClaims does NOT rotate the
 * cookie, only getUser() does. Accepting an expired token on the fast path would let a
 * session silently age out without renewal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from './middleware'

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
vi.mock('next/server', () => ({
  NextResponse: { next: vi.fn(() => ({ cookies: { set: vi.fn() } })) },
}))

const mockCreateServerClient = createServerClient as unknown as Mock

const NOW = Math.floor(Date.now() / 1000)

function makeRequest(): NextRequest {
  return {
    cookies: { getAll: () => [], set: vi.fn() },
  } as unknown as NextRequest
}

/** Wire the mocked Supabase client's auth methods for one test. */
function wireAuth(opts: {
  getClaims: { data: unknown; error: unknown }
  getUser?: { data: { user: { id: string } | null }; error: unknown }
}) {
  const getClaims = vi.fn().mockResolvedValue(opts.getClaims)
  const getUser = vi.fn().mockResolvedValue(
    opts.getUser ?? { data: { user: null }, error: null },
  )
  mockCreateServerClient.mockReturnValue({ auth: { getClaims, getUser } })
  return { getClaims, getUser }
}

describe('updateSession — identity resolution', () => {
  beforeEach(() => vi.clearAllMocks())

  it('accepts valid non-expired claims locally without calling getUser', async () => {
    const { getUser } = wireAuth({
      getClaims: { data: { claims: { sub: 'user-123', exp: NOW + 3600 } }, error: null },
    })
    const { user } = await updateSession(makeRequest())
    expect(user).toEqual({ id: 'user-123' })
    expect(getUser).not.toHaveBeenCalled()
  })

  it('falls back to getUser when the token is EXPIRED (refresh path)', async () => {
    const { getUser } = wireAuth({
      getClaims: { data: { claims: { sub: 'user-123', exp: NOW - 10 } }, error: null },
      getUser: { data: { user: { id: 'user-123' } }, error: null },
    })
    const { user } = await updateSession(makeRequest())
    expect(getUser).toHaveBeenCalledOnce()
    expect(user).toEqual({ id: 'user-123' })
  })

  it('falls back to getUser when getClaims errors', async () => {
    const { getUser } = wireAuth({
      getClaims: { data: null, error: { message: 'JWKS unreachable' } },
      getUser: { data: { user: { id: 'user-9' } }, error: null },
    })
    const { user } = await updateSession(makeRequest())
    expect(getUser).toHaveBeenCalledOnce()
    expect(user).toEqual({ id: 'user-9' })
  })

  it('returns null user when there is no session (unauthenticated)', async () => {
    const { getUser } = wireAuth({
      getClaims: { data: { claims: null }, error: null },
      getUser: { data: { user: null }, error: null },
    })
    const { user } = await updateSession(makeRequest())
    expect(getUser).toHaveBeenCalledOnce()
    expect(user).toBeNull()
  })

  it('falls back when claims lack a sub', async () => {
    const { getUser } = wireAuth({
      getClaims: { data: { claims: { exp: NOW + 3600 } }, error: null },
      getUser: { data: { user: { id: 'user-7' } }, error: null },
    })
    const { user } = await updateSession(makeRequest())
    expect(getUser).toHaveBeenCalledOnce()
    expect(user).toEqual({ id: 'user-7' })
  })
})

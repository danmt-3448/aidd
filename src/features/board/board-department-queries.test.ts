/**
 * Unit tests for board-department-queries.ts
 *
 * Strategy: mock @/lib/supabase/server — no real DB.
 * Tests cover: listDepartments happy path, empty, error path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as Mock

// ---------------------------------------------------------------------------
// Chainable query mock
// ---------------------------------------------------------------------------

function makeQueryMock(result: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {}
  self.select = vi.fn(() => self)
  self.order = vi.fn(() => Promise.resolve(result))
  return self
}

function makeClient(fromResult: { data: unknown; error: unknown }) {
  return {
    from: vi.fn(() => makeQueryMock(fromResult)),
  }
}

import { listDepartments } from './board-department-queries'

// ---------------------------------------------------------------------------
// listDepartments
// ---------------------------------------------------------------------------

describe('listDepartments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sorted department rows on success', async () => {
    const rows = [
      { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Marketing' },
      { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'CEVC10' },
    ]

    mockCreateClient.mockResolvedValue(makeClient({ data: rows, error: null }))

    const result = await listDepartments()
    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({ id: rows[0]!.id, name: rows[0]!.name })
    expect(result.data[1]).toEqual({ id: rows[1]!.id, name: rows[1]!.name })
  })

  it('returns empty array when no departments exist', async () => {
    mockCreateClient.mockResolvedValue(makeClient({ data: [], error: null }))

    const result = await listDepartments()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data).toEqual([])
  })

  it('handles null data (treats as empty)', async () => {
    mockCreateClient.mockResolvedValue(makeClient({ data: null, error: null }))

    const result = await listDepartments()
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data).toEqual([])
  })

  it('returns error when Supabase query fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ data: null, error: { message: 'connection refused' } }),
    )

    const result = await listDepartments()
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toMatch(/phòng ban/i)
    }
  })

  it('returns error on unexpected throw', async () => {
    mockCreateClient.mockRejectedValue(new Error('network failure'))

    const result = await listDepartments()
    expect('error' in result).toBe(true)
  })
})

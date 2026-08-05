/**
 * Unit tests for use-department-list.ts
 *
 * Strategy: mock board-department-queries so the hook test is
 * purely about data-mapping and the nameToId Map, not about the
 * Supabase client. Uses @tanstack/react-query's renderHook helper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// ---------------------------------------------------------------------------
// Mock the server action
// ---------------------------------------------------------------------------

vi.mock('./board-department-queries', () => ({
  listDepartments: vi.fn(),
}))

import { listDepartments } from './board-department-queries'
import type { Mock } from 'vitest'
import { useDepartmentList } from './use-department-list'

const mockListDepartments = listDepartments as Mock

// ---------------------------------------------------------------------------
// Test wrapper — fresh QueryClient per test to avoid state leakage
// ---------------------------------------------------------------------------

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
  Wrapper.displayName = 'QueryWrapper'
  return Wrapper
}

// ---------------------------------------------------------------------------
// useDepartmentList
// ---------------------------------------------------------------------------

describe('useDepartmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns departments and populated nameToId map on success', async () => {
    const depts = [
      { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Marketing' },
      { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'CEVC10' },
    ]
    mockListDepartments.mockResolvedValue({ data: depts })

    const { result } = renderHook(() => useDepartmentList(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.departments).toEqual(depts)
    expect(result.current.error).toBeNull()
    expect(result.current.nameToId.get('Marketing')).toBe(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    )
    expect(result.current.nameToId.get('CEVC10')).toBe(
      'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    )
  })

  it('returns empty departments and empty nameToId when server returns empty', async () => {
    mockListDepartments.mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useDepartmentList(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.departments).toEqual([])
    expect(result.current.nameToId.size).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('surfaces error string when server action returns an error', async () => {
    mockListDepartments.mockResolvedValue({ error: 'Không thể tải danh sách phòng ban.' })

    const { result } = renderHook(() => useDepartmentList(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Không thể tải danh sách phòng ban.')
    expect(result.current.departments).toEqual([])
  })

  it('surfaces error string when server action throws', async () => {
    mockListDepartments.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useDepartmentList(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('network down')
    expect(result.current.departments).toEqual([])
  })
})

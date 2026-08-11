/**
 * use-update-kudo.test.ts
 *
 * Unit tests for the useUpdateKudo hook:
 *   - Happy path: isSuccess=true, queries invalidated, reset clears state
 *   - Server ok:false: fieldErrors + rootError populated, isSuccess=false
 *   - Network error: rootError set from thrown Error
 *
 * Strategy: mock updateKudo server action + queryClient.invalidateQueries.
 * The hook itself is exercised via renderHook (no DOM needed).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock the server action and query key modules
// ---------------------------------------------------------------------------

vi.mock('../kudos/kudo-actions', () => ({
  updateKudo: vi.fn(),
}))

vi.mock('@/features/board/use-board-feed', () => ({
  boardFeedKeys: { all: ['board', 'feed'] },
}))

vi.mock('@/features/board/use-highlights', () => ({
  highlightKeys: { all: ['board', 'highlights'] },
}))

vi.mock('@/features/profile/profile-feed-keys', () => ({
  profileFeedKeys: { all: ['profile', 'feed'] },
}))

// Import AFTER mocks are registered
import { useUpdateKudo } from './hooks/use-update-kudo'
import { updateKudo } from './kudo-actions'

const mockUpdateKudo = vi.mocked(updateKudo)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const UUID_A = '550e8400-e29b-41d4-a716-446655440000'
const UUID_B = '6ba7b810-9dad-41d4-80b4-00c04fd430c8'

const VALID_INPUT = {
  kudoId: UUID_A,
  contentHtml: '<p>Updated content</p>',
  danhHieu: 'Người cải tiến tiên phong',
  hashtagIds: [UUID_B],
  imagePaths: [],
}

// ---------------------------------------------------------------------------
// Helper: create a fresh QueryClient + wrapper for each test
// ---------------------------------------------------------------------------

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUpdateKudo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial state: isPending=false, isSuccess=false, no errors', () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateKudo(), { wrapper })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.fieldErrors).toEqual({})
    expect(result.current.rootError).toBeNull()
  })

  it('sets isSuccess=true and invalidates queries on ok:true response', async () => {
    mockUpdateKudo.mockResolvedValueOnce({ ok: true })
    const { queryClient, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateKudo(), { wrapper })

    act(() => { result.current.submit(VALID_INPUT) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isPending).toBe(false)
    expect(result.current.rootError).toBeNull()
    expect(result.current.fieldErrors).toEqual({})

    // All three query families should be invalidated
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
    const keys = invalidateSpy.mock.calls.map((call) => call[0])
    expect(keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ queryKey: ['board', 'feed'] }),
        expect.objectContaining({ queryKey: ['board', 'highlights'] }),
        expect.objectContaining({ queryKey: ['profile', 'feed'] }),
      ]),
    )
  })

  it('populates fieldErrors and rootError on ok:false response', async () => {
    mockUpdateKudo.mockResolvedValueOnce({
      ok: false,
      errors: {
        _root: ['Bạn chỉ sửa được Kudo của mình'],
        contentHtml: ['Nội dung không được để trống'],
      },
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateKudo(), { wrapper })

    act(() => { result.current.submit(VALID_INPUT) })

    await waitFor(() => expect(result.current.rootError).not.toBeNull())

    expect(result.current.isSuccess).toBe(false)
    expect(result.current.rootError).toBe('Bạn chỉ sửa được Kudo của mình')
    expect(result.current.fieldErrors).toEqual({
      contentHtml: ['Nội dung không được để trống'],
    })
  })

  it('sets rootError on network / thrown error', async () => {
    mockUpdateKudo.mockRejectedValueOnce(new Error('Network failure'))
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateKudo(), { wrapper })

    act(() => { result.current.submit(VALID_INPUT) })

    await waitFor(() => expect(result.current.rootError).not.toBeNull())

    expect(result.current.isSuccess).toBe(false)
    expect(result.current.rootError).toBe('Network failure')
  })

  it('reset() clears errors and isSuccess state', async () => {
    mockUpdateKudo.mockResolvedValueOnce({
      ok: false,
      errors: { _root: ['Lỗi server'] },
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateKudo(), { wrapper })

    act(() => { result.current.submit(VALID_INPUT) })
    await waitFor(() => expect(result.current.rootError).not.toBeNull())

    act(() => { result.current.reset() })

    expect(result.current.rootError).toBeNull()
    expect(result.current.fieldErrors).toEqual({})
    expect(result.current.isSuccess).toBe(false)
  })
})

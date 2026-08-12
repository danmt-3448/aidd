/**
 * use-kudo-image-cleanup.test.ts
 *
 * Regression tests for the two orphan/dangling Storage bugs in the Kudo compose
 * modal:
 *   BUG 1 — edit-mode premature delete: removing an ORIGINAL (committed) image
 *           must NOT hit Storage immediately; deletion is deferred until save.
 *   BUG 2 — unmount leak: blob (uncommitted) uploads must be removed when the
 *           modal unmounts via a path that bypassed handleCancel.
 *
 * Strategy: mock the browser Supabase client's storage.remove and assert exactly
 * when it is (and is not) called.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKudoImageCleanup } from './use-kudo-image-cleanup'
import type { UploadedImage } from '../components/image-uploader'

// ---------------------------------------------------------------------------
// Mock the browser Supabase client — capture storage.remove calls
// ---------------------------------------------------------------------------
const removeSpy = vi.fn(async () => ({ data: [], error: null }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: { from: () => ({ remove: removeSpy }) },
  }),
}))

// jsdom lacks a real object-URL registry
beforeEach(() => {
  removeSpy.mockClear()
  globalThis.URL.revokeObjectURL = vi.fn()
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const blobImage = (id: string): UploadedImage => ({
  id,
  previewUrl: `blob:http://localhost/${id}`,
  storagePath: `uid/kudo/${id}.jpg`,
})
const originalImage = (id: string): UploadedImage => ({
  id,
  previewUrl: '', // edit-mode initial data → already committed to DB
  storagePath: `uid/kudo/${id}.jpg`,
})

describe('useKudoImageCleanup', () => {
  it('deletes a blob (uncommitted) image from Storage immediately on removal', async () => {
    const img = blobImage('a')
    const { result } = renderHook(() => useKudoImageCleanup([img]))

    await act(async () => {
      await result.current.handleImageRemoved(img)
    })

    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith([img.storagePath])
  })

  it('DEFERS deleting an original (committed) image on removal — BUG 1', async () => {
    const img = originalImage('b')
    const { result } = renderHook(() => useKudoImageCleanup([img]))

    await act(async () => {
      await result.current.handleImageRemoved(img)
    })

    // No Storage delete yet — DB still references it until an update commits.
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('flushes deferred original deletion only after save succeeds — BUG 1', async () => {
    const img = originalImage('c')
    const { result } = renderHook(() => useKudoImageCleanup([img]))

    await act(async () => {
      await result.current.handleImageRemoved(img)
    })
    expect(removeSpy).not.toHaveBeenCalled()

    act(() => {
      result.current.finalizeOnSuccess()
    })

    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith([img.storagePath])
  })

  it('does NOT delete original images on cancel (DB still references them)', async () => {
    const original = originalImage('d')
    const { result } = renderHook(() => useKudoImageCleanup([original]))

    await act(async () => {
      await result.current.finalizeOnCancel()
    })

    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('removes uncommitted blob uploads on explicit cancel', async () => {
    const blob = blobImage('e')
    const original = originalImage('f')
    const { result } = renderHook(() => useKudoImageCleanup([blob, original]))

    await act(async () => {
      await result.current.finalizeOnCancel()
    })

    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith([blob.storagePath])
  })

  it('cleans up blob orphans on unmount when never finalized — BUG 2', () => {
    const blob = blobImage('g')
    const { unmount } = renderHook(() => useKudoImageCleanup([blob]))

    unmount()

    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith([blob.storagePath])
  })

  it('does NOT delete on unmount after a successful submit (images committed)', () => {
    const blob = blobImage('h')
    const { result, unmount } = renderHook(() => useKudoImageCleanup([blob]))

    act(() => {
      result.current.finalizeOnSuccess()
    })
    removeSpy.mockClear() // ignore the finalize flush (no deferred originals here)

    unmount()

    expect(removeSpy).not.toHaveBeenCalled()
  })
})

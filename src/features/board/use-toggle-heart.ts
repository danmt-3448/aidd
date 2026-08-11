'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleHeart, type ToggleHeartSuccess } from './heart-actions'
import { boardFeedKeys } from './use-board-feed'
import { highlightKeys } from './use-highlights'
import { profileFeedKeys } from '@/features/profile/profile-feed-keys'
import type { BoardKudoRow, BoardCursor } from './board-queries'

// ---------------------------------------------------------------------------
// useToggleHeart
//
// Optimistic heart toggle with rollback on error.
//
// On fire:
//   1. Snapshot the current feed cache for every active page key.
//   2. Apply an optimistic update to every page that contains the target kudo:
//      flip `likedByMe` and adjust `heartCount` by ±1.
//   3. Also snapshot + optimistically update the highlights cache.
//   4. On server error → roll back all snapshots.
//   5. On settle (success or error) → invalidate highlights + full feed so
//      the server count is authoritative.
// ---------------------------------------------------------------------------

export interface UseToggleHeartReturn {
  toggle: (kudoId: string) => void
  isPending: boolean
  error: string | null
  clearError: () => void
}

// ---------------------------------------------------------------------------
// Helper: apply optimistic heart delta to a single BoardKudoRow array page.
// ---------------------------------------------------------------------------

function applyHeartDelta(
  page: BoardKudoRow[],
  kudoId: string,
  liked: boolean,
): BoardKudoRow[] {
  return page.map((row) => {
    if (row.id !== kudoId) return row
    return {
      ...row,
      likedByMe: liked,
      heartCount: liked
        ? row.heartCount + 1
        : Math.max(0, row.heartCount - 1),
    }
  })
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useToggleHeart(): UseToggleHeartReturn {
  const queryClient = useQueryClient()

  const mutation = useMutation<
    ToggleHeartSuccess,
    Error,
    string,
    {
      feedSnapshots: Map<
        string,
        { pages: { data: BoardKudoRow[]; nextCursor: BoardCursor | null }[] }
      >
      highlightSnapshot: BoardKudoRow[] | undefined
    }
  >({
    mutationFn: async (kudoId: string) => {
      const result = await toggleHeart(kudoId)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },

    onMutate: async (kudoId) => {
      // Cancel any in-flight refetches to avoid overwriting our optimistic state.
      await queryClient.cancelQueries({ queryKey: boardFeedKeys.all })
      await queryClient.cancelQueries({ queryKey: highlightKeys.all })

      // ── Snapshot feed pages ───────────────────────────────────────────────
      // We must optimistically update every cached page key that contains this
      // kudo. We don't know the `liked` state yet — derive it from the first
      // page we find that has this kudo.
      const feedSnapshots = new Map<
        string,
        { pages: { data: BoardKudoRow[]; nextCursor: BoardCursor | null }[] }
      >()

      let currentLiked: boolean | null = null

      const cache = queryClient.getQueriesData<{
        pages: { data: BoardKudoRow[]; nextCursor: BoardCursor | null }[]
      }>({ queryKey: boardFeedKeys.all })

      for (const [key, cached] of cache) {
        if (!cached) continue
        feedSnapshots.set(JSON.stringify(key), cached)

        if (currentLiked === null) {
          for (const page of cached.pages) {
            const found = page.data.find((r) => r.id === kudoId)
            if (found) {
              currentLiked = found.likedByMe
              break
            }
          }
        }
      }

      const willLike = currentLiked === null ? true : !currentLiked

      // Apply optimistic update to all cached feed queries.
      for (const [key, snapshot] of feedSnapshots) {
        const parsedKey = JSON.parse(key) as unknown[]
        queryClient.setQueryData<{
          pages: { data: BoardKudoRow[]; nextCursor: BoardCursor | null }[]
        }>(parsedKey, (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: applyHeartDelta(page.data, kudoId, willLike),
            })),
          }
        })
      }

      // ── Snapshot + update highlights ──────────────────────────────────────
      const highlightSnapshot = queryClient.getQueryData<BoardKudoRow[]>(
        highlightKeys.list(),
      )

      if (highlightSnapshot) {
        queryClient.setQueryData<BoardKudoRow[]>(
          highlightKeys.list(),
          applyHeartDelta(highlightSnapshot, kudoId, willLike),
        )
      }

      return { feedSnapshots, highlightSnapshot }
    },

    onError: (_err, _kudoId, context) => {
      if (!context) return

      // Roll back feed pages.
      for (const [key, snapshot] of context.feedSnapshots) {
        const parsedKey = JSON.parse(key) as unknown[]
        queryClient.setQueryData(parsedKey, snapshot)
      }

      // Roll back highlights.
      if (context.highlightSnapshot !== undefined) {
        queryClient.setQueryData(
          highlightKeys.list(),
          context.highlightSnapshot,
        )
      }
    },

    onSettled: () => {
      // Invalidate to reconcile optimistic state with server truth.
      void queryClient.invalidateQueries({ queryKey: highlightKeys.all })
      void queryClient.invalidateQueries({ queryKey: boardFeedKeys.all })
      // Also invalidate the profile feed so heart counts update when toggled
      // from the profile page (spec TC_WEB_PROFILE_FUN_014).
      void queryClient.invalidateQueries({ queryKey: profileFeedKeys.all })
    },
  })

  return {
    toggle: (kudoId: string) => mutation.mutate(kudoId),
    isPending: mutation.isPending,
    error: mutation.error?.message ?? null,
    clearError: () => mutation.reset(),
  }
}

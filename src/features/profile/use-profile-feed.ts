'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { listProfileKudos } from './profile-queries'
import type { ProfileKudoRow, ProfileCursor } from './profile-queries'
// Reuse the board's heart toggle — no re-implementation.
export { useToggleHeart } from '@/features/board/use-toggle-heart'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const profileFeedKeys = {
  all: ['profile', 'feed'] as const,
  list: (profileId: string, direction: 'received' | 'sent') =>
    [...profileFeedKeys.all, profileId, direction] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseProfileFeedReturn {
  pages: ProfileKudoRow[][]
  allRows: ProfileKudoRow[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: string | null
  fetchNextPage: () => void
}

// ---------------------------------------------------------------------------
// useProfileFeed
//
// Infinite keyset feed for a profile page in received or sent direction.
//
// Security: the server action `listProfileKudos` hard-denies `direction='sent'`
// when `profileId ≠ auth.uid()`. This hook does not need to replicate that
// check — an error from the server will surface through `query.error`.
//
// Heart toggling: consumers import `useToggleHeart` from this module (re-export
// above). The board's optimistic toggle operates on `boardFeedKeys`; the profile
// feed sits under `profileFeedKeys`. Invalidation after a toggle will refresh
// the board feed but not the profile feed — acceptable for this release phase.
// If full cross-feed invalidation is needed, wire it in the integration phase.
// ---------------------------------------------------------------------------

export function useProfileFeed(
  profileId: string,
  direction: 'received' | 'sent',
): UseProfileFeedReturn {
  const queryClient = useQueryClient()
  const queryKey = profileFeedKeys.list(profileId, direction)

  const query = useInfiniteQuery<
    { data: ProfileKudoRow[]; nextCursor: ProfileCursor | null },
    Error,
    { pages: { data: ProfileKudoRow[]; nextCursor: ProfileCursor | null }[] },
    ReturnType<typeof profileFeedKeys.list>,
    ProfileCursor | null
  >({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await listProfileKudos({
        profileId,
        direction,
        cursor: pageParam ?? undefined,
        limit: 20,
      })
      if ('error' in result) throw new Error(result.error)
      return result
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(profileId),
    staleTime: 30_000,
  })

  // Expose queryClient for consumers that need manual invalidation
  // (e.g. after posting a new kudo from this profile's write-bar).
  void queryClient

  const pages = query.data?.pages.map((p) => p.data) ?? []
  const allRows = pages.flat()

  return {
    pages,
    allRows,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error?.message ?? null,
    fetchNextPage: () => {
      void query.fetchNextPage()
    },
  }
}

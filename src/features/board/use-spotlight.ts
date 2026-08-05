'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { getSpotlightAggregationRpc } from './board-leaderboard-queries'
import type { SpotlightNode } from './board-queries'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const spotlightKeys = {
  all: ['board', 'spotlight'] as const,
  list: (hashtagId: string | null) =>
    [...spotlightKeys.all, { hashtagId }] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseSpotlightReturn {
  nodes: SpotlightNode[]
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// useSpotlight
//
// Returns flat recipient aggregation for the spotlight word-cloud.
// Reads the same `?hashtag` URL search param as useBoardFeed so the filter
// state stays consistent without extra prop-drilling. Layout math for the
// word-cloud lives in Track A / integration (phase 15) — this hook supplies
// the data only.
//
// Spotlight data is relatively stable (changes only when new kudos arrive),
// so staleTime is set to 60 s. No Realtime subscription here — the feed
// Realtime channel (use-board-feed) invalidates `boardFeedKeys.all` on any
// kudo INSERT; if integration phase 15 needs spotlight to refresh at the same
// cadence, it can call queryClient.invalidateQueries({ queryKey: spotlightKeys.all })
// after a kudos invalidation event.
// ---------------------------------------------------------------------------

export function useSpotlight(): UseSpotlightReturn {
  const searchParams = useSearchParams()
  const hashtagId = searchParams.get('hashtag') ?? null

  const { data, isLoading, error } = useQuery({
    queryKey: spotlightKeys.list(hashtagId),
    queryFn: async () => {
      // BOARD-5: replaced client-side GROUP BY with server-side RPC.
      const result = await getSpotlightAggregationRpc({
        hashtagId: hashtagId ?? undefined,
      })
      if ('error' in result) throw new Error(result.error)
      // Map RPC result to SpotlightNode (same shape, explicit cast for type safety).
      return result.data.map((n): SpotlightNode => ({
        receiverId: n.receiverId,
        name: n.name,
        avatar: n.avatar,
        kudoCount: n.kudoCount,
      }))
    },
    staleTime: 60_000,
  })

  return {
    nodes: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

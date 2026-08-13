'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
// Realtime: signal-only INSERT on `kudos` → debounce 300ms → invalidate so the
// word-cloud names AND the total "NNN KUDOS" count (derived from node kudoCount)
// refresh as soon as a new kudo is created. Mirrors use-board-feed.ts:86-125.
// ---------------------------------------------------------------------------

export function useSpotlight(): UseSpotlightReturn {
  const searchParams = useSearchParams()
  const hashtagId = searchParams.get('hashtag') ?? null
  const queryClient = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // ── Realtime signal-only subscription ──────────────────────────────────
  // New kudo INSERT → debounced invalidate of the whole spotlight key space
  // (covers every hashtag filter) so names + count update live.
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('spotlight-aggregation-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kudos' },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: spotlightKeys.all })
          }, 300)
        },
      )
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    nodes: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

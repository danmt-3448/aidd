'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { listBoardKudos, type BoardKudoRow, type BoardCursor } from './board-queries'

// ---------------------------------------------------------------------------
// Query key factory — colocated so invalidation is consistent across hooks.
// ---------------------------------------------------------------------------

export const boardFeedKeys = {
  all: ['board', 'feed'] as const,
  list: (hashtagId: string | null) =>
    [...boardFeedKeys.all, { hashtagId }] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseBoardFeedReturn {
  pages: BoardKudoRow[][]
  allRows: BoardKudoRow[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: string | null
  fetchNextPage: () => void
}

// ---------------------------------------------------------------------------
// useBoardFeed
//
// Infinite keyset feed reading the `?hashtag` URL search param for its filter.
// Filter state ownership lives in the Live board `page.tsx` (phase 15) — this
// hook reads it via `useSearchParams`, never sets it.
//
// Realtime integration: Realtime events are subscribed in `use-board-feed.ts`
// using a single channel shared across the feed. Kudos INSERTs invalidate the
// feed so the first page re-fetches via `kudos_public` (masked view). The raw
// Realtime payload (id + created_at only) is NEVER surfaced to the UI.
// ---------------------------------------------------------------------------

export function useBoardFeed(): UseBoardFeedReturn {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const hashtagId = searchParams.get('hashtag') ?? null

  const queryKey = boardFeedKeys.list(hashtagId)

  const query = useInfiniteQuery<
    { data: BoardKudoRow[]; nextCursor: BoardCursor | null },
    Error,
    { pages: { data: BoardKudoRow[]; nextCursor: BoardCursor | null }[] },
    ReturnType<typeof boardFeedKeys.list>,
    BoardCursor | null
  >({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await listBoardKudos({
        cursor: pageParam ?? undefined,
        hashtagId: hashtagId ?? undefined,
        limit: 20,
      })
      if ('error' in result) throw new Error(result.error)
      return result
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })

  // ── Realtime signal-only subscription ────────────────────────────────────
  // Subscribe `postgres_changes` on the base `kudos` table (INSERT) and the
  // `hearts` table (INSERT / DELETE). The `kudos` publication is restricted to
  // (id, created_at) only (phase-01) — `payload.new.id` is used PURELY as an
  // invalidation signal. The actual row is re-fetched via `kudos_public`
  // (masked view). Raw payload fields are NEVER surfaced to the UI.
  //
  // A single channel covers both tables. Debounce: a ref timer prevents
  // flooding invalidations when a burst of hearts arrives.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('board-feed-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kudos' },
        () => {
          // Signal received — invalidate so the query refetches via kudos_public.
          // Debounce to coalesce rapid inserts (e.g. demo burst).
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: boardFeedKeys.all })
          }, 300)
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hearts' },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: boardFeedKeys.all })
          }, 300)
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'hearts' },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: boardFeedKeys.all })
          }, 300)
        },
      )
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

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

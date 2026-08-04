'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getHighlightKudos, type BoardKudoRow } from './board-queries'

// ---------------------------------------------------------------------------
// Query key factory — exported so use-toggle-heart can invalidate highlights.
// ---------------------------------------------------------------------------

export const highlightKeys = {
  all: ['board', 'highlights'] as const,
  list: () => [...highlightKeys.all] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseHighlightsReturn {
  highlights: BoardKudoRow[]
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// useHighlights
//
// Fetches the top-5 kudos ranked by weighted heart count. Keeps the carousel
// live via the same Realtime signal-only pattern as useBoardFeed: hearts
// INSERT/DELETE events trigger invalidation, and the query re-fetches via
// `kudos_public` (masked view). Raw Realtime payload fields are never used.
// ---------------------------------------------------------------------------

export function useHighlights(): UseHighlightsReturn {
  const queryClient = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: highlightKeys.list(),
    queryFn: async () => {
      const result = await getHighlightKudos()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 30_000,
  })

  // ── Realtime signal-only subscription ────────────────────────────────────
  // Hearts INSERT/DELETE change weighted scores → invalidate highlights.
  // Kudos INSERT may promote a new kudo into top-5 → also invalidate.
  useEffect(() => {
    const supabase = createClient()

    const invalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: highlightKeys.all })
      }, 300)
    }

    const channel = supabase
      .channel('board-highlights-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kudos' },
        invalidate,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hearts' },
        invalidate,
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'hearts' },
        invalidate,
      )
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    highlights: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

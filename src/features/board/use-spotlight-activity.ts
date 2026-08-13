'use client'

/**
 * use-spotlight-activity.ts — TanStack Query hook for the Spotlight activity feed.
 *
 * Data flow: list_recent_activity RPC (kudos_public, ordered by created_at desc)
 * → SpotlightActivityEntry[] → board-connected → BoardSpotlight → ActivityLog.
 *
 * Realtime: signal-only INSERT on `kudos` (payload carries only id + created_at
 * per the kudos publication config) → debounce 300ms → invalidateQueries → refetch.
 * Mirrors the pattern in use-board-feed.ts:86-125.
 */

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SpotlightActivityEntry } from './components/board-types'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const spotlightActivityKeys = {
  all: ['spotlight', 'activity'] as const,
  list: () => [...spotlightActivityKeys.all, 'list'] as const,
}

// ---------------------------------------------------------------------------
// Time formatter — pinned, no date library.
// Output: "08:30PM" (no space before AM/PM), Asia/Ho_Chi_Minh TZ.
// Exported for unit testing in phase 07.
// ---------------------------------------------------------------------------

const _timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Ho_Chi_Minh',
})

export function formatActivityTime(isoString: string): string {
  const date = new Date(isoString)
  // Intl.DateTimeFormat produces "08:30 AM" — strip the space before AM/PM.
  return _timeFormatter.format(date).replace(/\s(AM|PM)/, '$1')
}

// ---------------------------------------------------------------------------
// RPC row shape (matches list_recent_activity return columns)
// ---------------------------------------------------------------------------

interface RecentActivityRow {
  receiver_id: string
  receiver_name: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Query function
// ---------------------------------------------------------------------------

async function getRecentActivity(limit = 6): Promise<SpotlightActivityEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('list_recent_activity', { p_limit: limit })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as RecentActivityRow[]
  return rows.map((row) => ({
    receiverId: row.receiver_id,
    createdAt: row.created_at,
    name: row.receiver_name,
    time: formatActivityTime(row.created_at),
  }))
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSpotlightActivityReturn {
  activity: SpotlightActivityEntry[]
  isLoading: boolean
  error: string | null
}

export function useSpotlightActivity(): UseSpotlightActivityReturn {
  const queryClient = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = useQuery({
    queryKey: spotlightActivityKeys.list(),
    queryFn: () => getRecentActivity(6),
    staleTime: 15_000,
  })

  // ── Realtime signal-only subscription ──────────────────────────────────
  // Subscribe to INSERT on `kudos` (publication: id + created_at only —
  // payload is never surfaced to UI). Signal triggers a debounced invalidate
  // so the query refetches the latest 6 rows via the RPC.
  // Mirrors use-board-feed.ts:86-125.
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('spotlight-activity-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kudos' },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            void queryClient.invalidateQueries({
              queryKey: spotlightActivityKeys.list(),
            })
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
    activity: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  }
}

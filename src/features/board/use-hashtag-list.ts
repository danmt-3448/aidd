'use client'

/**
 * use-hashtag-list.ts — BOARD-1
 *
 * Fetches the full hashtag catalog for the board's filter chips.
 * Reuses listHashtags() from kudos feature — no new server action needed.
 *
 * Returns:
 *   hashtags   — full {id, name} list, stable until catalog changes
 *   nameToId   — Map<displayName, uuid> for URL-param routing
 *                (e.g. "#ThanhOm" → "uuid-...")
 */

import { useQuery } from '@tanstack/react-query'
import { listHashtags, type HashtagResult } from '@/features/kudos/hashtag-actions'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const hashtagListKeys = {
  all: ['board', 'hashtagList'] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseHashtagListReturn {
  hashtags: HashtagResult[]
  /** Map from display name (e.g. "ThanhOm") to UUID for URL routing. */
  nameToId: Map<string, string>
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// useHashtagList
//
// staleTime 5 min — hashtag catalog is effectively static during an event.
// No Realtime subscription needed (hashtags are seeded, not user-created).
// ---------------------------------------------------------------------------

export function useHashtagList(): UseHashtagListReturn {
  const { data, isLoading, error } = useQuery<HashtagResult[]>({
    queryKey: hashtagListKeys.all,
    queryFn: () => listHashtags(),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })

  const hashtags = data ?? []

  const nameToId = new Map<string, string>(
    hashtags.map((h) => [h.name, h.id]),
  )

  return {
    hashtags,
    nameToId,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

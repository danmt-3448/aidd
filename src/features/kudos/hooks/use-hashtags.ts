'use client'

import { useQuery } from '@tanstack/react-query'
import { listHashtags, type HashtagResult } from '../hashtag-actions'

/**
 * Fetches the full hashtag catalog (optionally filtered by query).
 * Long staleTime: catalog rarely changes, no need to refetch on every focus.
 *
 * Usage:
 *   const { data: hashtags = [] } = useHashtags()
 *   const { data: filtered = [] } = useHashtags('team')
 */
export function useHashtags(query?: string) {
  return useQuery<HashtagResult[]>({
    queryKey: ['hashtags', query ?? ''],
    queryFn: () => listHashtags(query),
    staleTime: 5 * 60 * 1000, // 5 minutes — catalog is static in v1
    placeholderData: (prev) => prev,
  })
}

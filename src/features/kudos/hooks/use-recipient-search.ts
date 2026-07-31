'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { searchRecipients, type RecipientResult } from '../recipient-actions'

const DEBOUNCE_MS = 300

/**
 * Debounced recipient autocomplete hook.
 *
 * @param query - Raw input string from the search field.
 * @returns TanStack Query result containing RecipientResult[].
 *
 * Usage:
 *   const { data, isLoading } = useRecipientSearch(inputValue)
 */
export function useRecipientSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  return useQuery<RecipientResult[]>({
    queryKey: ['recipients', debouncedQuery],
    queryFn: () => searchRecipients(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })
}

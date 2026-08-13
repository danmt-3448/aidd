'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { searchRecipients, type RecipientResult } from '../recipient-actions'

const DEBOUNCE_MS = 300

/**
 * Debounced recipient autocomplete hook.
 *
 * @param query - Raw input string from the search field.
 * @param enabled - Whether the picker is open. When open, fetches even for an
 *   empty query so the dropdown shows a default suggestion list on first focus.
 * @returns TanStack Query result containing RecipientResult[].
 *
 * Usage:
 *   const { data, isLoading } = useRecipientSearch(inputValue, isOpen)
 */
export function useRecipientSearch(query: string, enabled = false) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  return useQuery<RecipientResult[]>({
    queryKey: ['recipients', debouncedQuery],
    queryFn: () => searchRecipients(debouncedQuery),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })
}

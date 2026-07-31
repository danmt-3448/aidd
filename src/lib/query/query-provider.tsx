'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { getQueryClient } from './query-client'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Client-side TanStack Query provider.
 * Mount this once at the layout or page level that wraps the Kudo modal.
 *
 * Example (app/kudos/layout.tsx):
 *   import { QueryProvider } from '@/lib/query/query-provider'
 *   export default function Layout({ children }) {
 *     return <QueryProvider>{children}</QueryProvider>
 *   }
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // getQueryClient() returns a browser singleton — stable across re-renders
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

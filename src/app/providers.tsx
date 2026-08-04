'use client'

import { type ReactNode } from 'react'
import { QueryProvider } from '@/lib/query/query-provider'
import { Toaster } from 'sonner'

/**
 * Root client providers.
 * Single QueryClient instance for the entire app — all routes share cache
 * across client-side navigation. getQueryClient() is a browser singleton so
 * multiple QueryProvider mounts were already sharing state; this makes it
 * explicit and removes the per-route wrappers.
 *
 * Toaster is mounted here once (position top-center, richColors) rather than
 * per route. Toast calls from any feature module will surface here.
 */
export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Toaster position="top-center" richColors />
      {children}
    </QueryProvider>
  )
}

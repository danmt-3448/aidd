import { QueryClient } from '@tanstack/react-query'

/**
 * Factory that creates a fresh QueryClient per request (SSR-safe).
 * On the browser a singleton is kept via module-level memoization below.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoid refetching immediately on the client after SSR hydration
        staleTime: 60 * 1000,
        // App is realtime-driven via Supabase subscriptions; window-focus
        // refetches add unnecessary round-trips with no UX benefit.
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always a new instance
    return makeQueryClient()
  }
  // Browser: reuse the same instance across renders
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

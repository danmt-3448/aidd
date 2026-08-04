'use client'

/**
 * /board — Sun* Kudos Live Board page.
 *
 * Shell: QueryProvider + Toaster wrapping BoardConnected.
 * All data fetching and Track B hook wiring lives in BoardConnected.
 * Auth guard is applied at the middleware layer — no PUBLIC_PATHS change needed.
 *
 * Integration phase-15: mock data removed; BoardConnected calls real Track B
 * hooks (use-board-feed, use-highlights, use-spotlight, use-toggle-heart).
 */

import { Toaster } from 'sonner'
import { QueryProvider } from '@/lib/query/query-provider'
import { BoardConnected } from '@/features/board/components/board-connected'

export default function BoardPage() {
  return (
    <QueryProvider>
      <Toaster position="top-center" richColors />
      <BoardConnected />
    </QueryProvider>
  )
}

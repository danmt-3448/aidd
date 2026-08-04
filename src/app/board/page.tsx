/**
 * /board — Sun* Kudos Live Board page.
 *
 * Server Component shell: QueryProvider + Toaster are now mounted at the root
 * layout (src/app/providers.tsx) and shared across all routes.
 * BoardConnected carries its own 'use client' boundary with all data hooks.
 * Auth guard is applied at the middleware layer.
 *
 * Integration phase-15: mock data removed; BoardConnected calls real Track B
 * hooks (use-board-feed, use-highlights, use-spotlight, use-toggle-heart).
 */

import { BoardConnected } from '@/features/board/components/board-connected'

export default function BoardPage() {
  return <BoardConnected />
}

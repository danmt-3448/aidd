'use client'

/**
 * kudos-dev-wrapper.tsx — dev-only wrapper for the /kudos route.
 *
 * Renders the full Board (via BoardConnected) and passes `initialComposeOpen`
 * as a prop so the KudoComposeModal can be pre-opened without embedding
 * query-param logic inside the production BoardScreen component.
 *
 * This file is the ONLY place that bridges ?modal=compose → initialComposeOpen prop.
 * The component itself has no NODE_ENV guard — the guard lives in kudos/page.tsx
 * which never renders this in production (redirects to /board instead).
 *
 * Pattern: RT-13/Scope-7 from phase-02 spec — dev-only wrapper as prop injector.
 */

import { BoardConnected } from '@/features/board/components/board-connected'

export interface KudosDevWrapperProps {
  uid: string | null
  user: { name: string; avatarUrl?: string } | null
  isAdmin: boolean
  /** When true, KudoComposeModal opens immediately on mount. */
  initialComposeOpen: boolean
}

export function KudosDevWrapper({
  uid,
  user,
  isAdmin,
  initialComposeOpen,
}: KudosDevWrapperProps) {
  return (
    <BoardConnected
      uid={uid}
      user={user}
      isAdmin={isAdmin}
      initialComposeOpen={initialComposeOpen}
    />
  )
}

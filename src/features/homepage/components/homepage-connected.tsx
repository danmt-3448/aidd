'use client'

/**
 * HomepageConnected — integration layer between the server page and HomepageScreen.
 *
 * Receives server-resolved identity (uid / user / isAdmin) as plain props, then
 * wires the two client data hooks HomepageScreen expects:
 *   - useCountdown()      → hero Days/Hours/Minutes (live tick)
 *   - useUnreadCount(uid) → header notification bell badge (Realtime)
 *
 * Dev-only: ?ui_state=full|empty|error|loading bypasses all hooks and renders
 * from homepage.mock.ts. No Supabase requests fire in override mode.
 * Mirror of board-connected.tsx pattern (phase-02 infra).
 *
 * Must be rendered inside <QueryProvider> (page.tsx supplies it).
 */

import { useCountdown } from '@/features/event/use-countdown'
import { useUnreadCount } from '@/features/notifications/use-notifications'
import { useUiStateOverride } from '@/lib/ui-state-override'
import { mockFull, mockEmpty, mockError, mockLoading } from '../mocks/homepage.mock'
import { HomepageScreen } from './homepage-screen'

export interface HomepageConnectedProps {
  /** Auth user id, or null when unauthenticated (public view). */
  uid: string | null
  /** Header identity — null renders the public header (no bell/account). */
  user: { name: string; avatarUrl?: string } | null
  /** Whether the signed-in user is an admin (server-resolved). */
  isAdmin: boolean
}

export function HomepageConnected({ uid, user, isAdmin }: HomepageConnectedProps) {
  const uiOverride = useUiStateOverride()

  // ── Real hooks (always called — Rules of Hooks) ───────────────────────────
  const { count } = useUnreadCount(uiOverride !== null ? null : uid)
  const { days, hours, minutes } = useCountdown()

  // ── Dev override: render from fixture, skip live data ────────────────────
  if (uiOverride !== null) {
    const fixture =
      uiOverride === 'empty'
        ? mockEmpty
        : uiOverride === 'error'
          ? mockError
          : uiOverride === 'loading'
            ? mockLoading
            : mockFull

    return <HomepageScreen header={fixture.header} countdown={fixture.countdown} />
  }

  // ── Production path ───────────────────────────────────────────────────────
  return (
    <HomepageScreen
      header={{ unreadCount: count, user, uid, isAdmin }}
      countdown={{ days, hours, minutes }}
    />
  )
}

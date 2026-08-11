'use client'

/**
 * HomepageConnected — integration layer between the server page and HomepageScreen.
 *
 * Receives server-resolved identity (uid / user / isAdmin) as plain props, then
 * wires the two client data hooks HomepageScreen expects:
 *   - useCountdown()      → hero Days/Hours/Minutes (live tick)
 *   - useUnreadCount(uid) → header notification bell badge (Realtime)
 *
 * Must be rendered inside <QueryProvider> (page.tsx supplies it).
 */

import { useCountdown } from '@/features/event/use-countdown'
import { useUnreadCount } from '@/features/notifications/use-notifications'
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
  const { count } = useUnreadCount(uid)
  const { days, hours, minutes, done } = useCountdown()

  return (
    <HomepageScreen
      header={{ unreadCount: count, user, uid, isAdmin }}
      countdown={{ days, hours, minutes, done }}
    />
  )
}

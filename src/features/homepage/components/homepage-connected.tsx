'use client'

/**
 * HomepageConnected — integration layer (phase-15) between the server page
 * and the presentational HomepageScreen.
 *
 * Receives the server-resolved identity (uid / user / isAdmin) as plain props,
 * then wires the two CLIENT data hooks that HomepageScreen expects as values:
 *   - useCountdown()      → hero Days/Hours/Minutes (live tick)
 *   - useUnreadCount(uid) → header notification bell badge (Realtime)
 *
 * Kept separate from HomepageScreen so the screen stays purely presentational
 * (prop-driven) and testable without a QueryClient. This component is the ONLY
 * place mock props were replaced with real hooks.
 *
 * Must be rendered inside a <QueryProvider> (page.tsx supplies it) — both hooks
 * use TanStack Query.
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
  // Bell badge — gated on uid internally (count stays 0, no subscription when null).
  const { count } = useUnreadCount(uid)

  // Hero countdown — live values; `invalid` falls back to 0s which the LED
  // blocks render as "00" (fail-closed, matches /countdown behaviour).
  const { days, hours, minutes } = useCountdown()

  return (
    <HomepageScreen
      header={{ unreadCount: count, user, uid, isAdmin }}
      countdown={{ days, hours, minutes }}
    />
  )
}

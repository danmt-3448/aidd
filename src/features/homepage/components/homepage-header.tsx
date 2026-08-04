'use client'

/**
 * HomepageHeader — thin wrapper around SiteHeader for the Homepage route.
 *
 * Passes activeNav='about' so the "About SAA 2025" nav item is marked
 * aria-current="page" while on the homepage. All other logic lives in
 * SiteHeader (src/components/site-header.tsx).
 *
 * Figma: mms_A1_Header (node 2167:9091)
 * Keep this file as the homepage-scoped entry point so HomepageScreen's
 * existing import path doesn't change.
 */

import { SiteHeader } from '@/components/site-header'

export interface HomepageHeaderProps {
  /** Number of unread notifications. 0 = no badge. */
  unreadCount: number
  /** Null = public (unauthenticated) header. */
  user: { name: string; avatarUrl?: string } | null
  /** Auth user id — passed through to NotificationPanel. */
  uid?: string | null
  /** Show "Admin Dashboard" in account dropdown when true. */
  isAdmin: boolean
}

export function HomepageHeader({ unreadCount, user, uid, isAdmin }: HomepageHeaderProps) {
  return (
    <SiteHeader
      user={user}
      unreadCount={unreadCount}
      uid={uid}
      isAdmin={isAdmin}
      activeNav="about"
    />
  )
}

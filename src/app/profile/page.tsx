import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { parseProfileId } from '@/features/profile/profile-route'
import { ProfileConnected } from '@/features/profile/components/profile-connected'
import { SiteHeader } from '@/components/site-header'

/**
 * /profile — Profile page server component (phase-15 integration).
 *
 * Route shapes:
 *   /profile            → SELF mode  (caller views their own profile)
 *   /profile?id={uuid}  → OTHER mode (caller views another user's profile)
 *
 * Guard logic:
 *   1. parseProfileId validates the `id` param. Invalid/malformed → 404 (no DB hit).
 *   2. supabase.auth.getUser() resolves the session. Middleware already enforces
 *      auth on this route (/profile is NOT in PUBLIC_PATHS), so the user will be
 *      present in practice. We still guard defensively.
 *   3. Canonicalization (TC_WEB_PROFILE_FUN_002): if mode=other AND id === caller's
 *      own uid, treat it as self (avoids showing the write-bar to yourself).
 *
 * SiteHeader is rendered server-side above ProfileConnected so the nav is
 * visible immediately (before client hydration) and always present regardless
 * of the ProfileConnected loading state. Figma 3FoIx6ALVb: header sits at the
 * top of the profile frame. unreadCount is passed as 0 — the notification count
 * is a client-side concern owned by HomepageConnected; profile does not fetch it
 * server-side to avoid the extra round-trip. activeNav={null} → no nav item
 * highlighted (profile is not a primary nav destination).
 *
 * Data wiring lives in ProfileConnected (client component). This server component
 * only resolves identity. QueryProvider + Toaster are at root (src/app/providers.tsx).
 */

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const routeResult = parseProfileId(params['id'])

  // Invalid UUID / repeated param → 404. No DB hit needed.
  if (routeResult.mode === 'invalid') {
    notFound()
  }

  // Resolve session for self-detection, canonicalization, and header identity.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware guards the route, but defence-in-depth: if no session somehow
  // reaches here, treat as if viewing self (empty profile, stats=null fallback).
  const callerId = user?.id ?? null

  // Admin flag — needed for the SiteHeader account menu. Parallel DB hit is
  // acceptable: getIsAdmin re-uses the server client and only reads one column.
  const isAdmin = user ? await getIsAdmin() : false

  // Header identity from OAuth session metadata — same pattern as Homepage.
  const headerUser = user
    ? {
        name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          'Sunner',
        avatarUrl:
          (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined),
      }
    : null

  // Resolve profileId and isSelf.
  // Canonicalization: if other-mode id === caller id → treat as self.
  let profileId: string
  let isSelf: boolean

  if (routeResult.mode === 'self') {
    // No id param — must be authenticated to have a meaningful self profile.
    if (!callerId) {
      notFound()
    }
    profileId = callerId
    isSelf = true
  } else {
    // routeResult.mode === 'other'
    const targetId = routeResult.id
    // Canonicalize: viewing own profile via ?id= → self mode.
    isSelf = callerId !== null && targetId === callerId
    profileId = targetId
  }

  return (
    <div style={{ background: '#00101A', minHeight: '100vh' }}>
      {/* Site navigation — matches Figma 3FoIx6ALVb top bar. unreadCount=0 because
          notification polling is a client concern; passing 0 shows the bell with
          no badge rather than omitting it. activeNav=null: profile is not a primary
          nav destination so no link is highlighted. */}
      <SiteHeader
        user={headerUser}
        unreadCount={0}
        isAdmin={isAdmin}
        activeNav={null}
      />
      <ProfileConnected profileId={profileId} isSelf={isSelf} />
    </div>
  )
}

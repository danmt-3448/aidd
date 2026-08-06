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
 * Dev-only: ?ui_state= present → skip Supabase entirely and render with a mock
 * identity so /aidd-ui-gate can screenshot /profile without local Supabase running.
 * In override mode we pass isSelf=true so the fixture's SELF layout (stats card +
 * full kudos list) is shown — that's the densest state to gate against Figma.
 * Mirrors the pattern in src/app/page.tsx (homepage bypass).
 *
 * Guard logic (production path only):
 *   1. parseProfileId validates the `id` param. Invalid/malformed → 404 (no DB hit).
 *   2. supabase.auth.getUser() resolves the session.
 *   3. Canonicalization: if mode=other AND id === caller's own uid → treat as self.
 *
 * SiteHeader is rendered server-side above ProfileConnected so nav is visible
 * immediately and always present regardless of ProfileConnected loading state.
 * unreadCount=0: notification count is a client concern — profile does not fetch
 * it server-side to avoid the extra round-trip. activeNav=null: profile is not a
 * primary nav destination so no link is highlighted.
 */

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  // Dev-only UI-gate bypass: ?ui_state= present → skip Supabase entirely.
  const uiState = params['ui_state']
  const mockMode =
    process.env.NODE_ENV !== 'production' && typeof uiState === 'string' && uiState.length > 0

  if (mockMode) {
    return (
      <div style={{ background: '#00101A', minHeight: '100vh' }}>
        <SiteHeader
          user={{ name: 'Sunner' }}
          unreadCount={0}
          isAdmin={false}
          activeNav={null}
        />
        {/* isSelf=true → SELF layout (stats + full feed) — densest fixture for gate */}
        <ProfileConnected profileId="mock-profile-self-001" isSelf={true} />
      </div>
    )
  }

  // ── Production path ───────────────────────────────────────────────────────
  const routeResult = parseProfileId(params['id'])

  if (routeResult.mode === 'invalid') {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const callerId = user?.id ?? null
  const isAdmin = user ? await getIsAdmin() : false

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

  let profileId: string
  let isSelf: boolean

  if (routeResult.mode === 'self') {
    if (!callerId) notFound()
    profileId = callerId
    isSelf = true
  } else {
    const targetId = routeResult.id
    isSelf = callerId !== null && targetId === callerId
    profileId = targetId
  }

  return (
    <div style={{ background: '#00101A', minHeight: '100vh' }}>
      {/* Site navigation — matches Figma 3FoIx6ALVb top bar. */}
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

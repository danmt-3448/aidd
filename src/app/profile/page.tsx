import { notFound } from 'next/navigation'
import { getCurrentUser, toHeaderUser } from '@/features/auth/current-user'
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

  const routeResult = parseProfileId(params['id'])
  if (routeResult.mode === 'invalid') {
    notFound()
  }

  const user = await getCurrentUser()
  const callerId = user?.id ?? null
  const isAdmin = user ? await getIsAdmin() : false
  const headerUser = toHeaderUser(user)

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
      <ProfileConnected profileId={profileId} isSelf={isSelf} selfUid={callerId ?? undefined} />
    </div>
  )
}

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseProfileId } from '@/features/profile/profile-route'
import { ProfileConnected } from '@/features/profile/components/profile-connected'

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

  // Resolve session for self-detection and canonicalization.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware guards the route, but defence-in-depth: if no session somehow
  // reaches here, treat as if viewing self (empty profile, stats=null fallback).
  const callerId = user?.id ?? null

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

  return <ProfileConnected profileId={profileId} isSelf={isSelf} />
}

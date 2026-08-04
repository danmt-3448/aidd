import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { HomepageConnected } from '@/features/homepage/components/homepage-connected'

/**
 * Root route `/` — Homepage SAA (public, per clarification 2026-08-04).
 *
 * Server component: resolves the caller's identity (session + admin flag)
 * server-side, then hands plain serializable props to HomepageConnected,
 * which wires the client data hooks (useCountdown, useUnreadCount).
 *
 * QueryProvider is at root (src/app/providers.tsx) — shared across all routes.
 * HomepageConnected uses TanStack Query hooks (useCountdown, useUnreadCount)
 * which resolve against that single shared QueryClient.
 *
 * /todo route is still directly reachable (src/app/todo/ untouched).
 */
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = user ? await getIsAdmin() : false

  // Header identity from the OAuth session metadata — no extra profile query.
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

  return (
    <HomepageConnected
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
    />
  )
}

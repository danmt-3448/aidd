import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { QueryProvider } from '@/lib/query/query-provider'
import { HomepageConnected } from '@/features/homepage/components/homepage-connected'

/**
 * Root route `/` — Homepage SAA (public, per clarification 2026-08-04).
 *
 * Server component: resolves the caller's identity (session + admin flag)
 * server-side, then hands plain serializable props to HomepageConnected,
 * which wires the client data hooks (useCountdown, useUnreadCount).
 *
 * QueryProvider is mounted here because the countdown + notification hooks
 * (and the FAB's KudoComposeModal) all use TanStack Query. Other routes
 * self-wrap the same way — there is no global provider in the root layout.
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
    <QueryProvider>
      <HomepageConnected
        uid={user?.id ?? null}
        user={headerUser}
        isAdmin={isAdmin}
      />
    </QueryProvider>
  )
}

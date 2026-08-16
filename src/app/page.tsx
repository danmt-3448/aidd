import { getCurrentUser, toHeaderUser } from '@/features/auth/current-user'
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
 */
export default async function Home() {
  const user = await getCurrentUser()
  const isAdmin = user ? await getIsAdmin() : false
  const headerUser = toHeaderUser(user)

  return (
    <HomepageConnected
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
    />
  )
}

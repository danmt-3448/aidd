/**
 * /board — Sun* Kudos Live Board page.
 *
 * Server Component shell: resolves the caller's identity (session + admin flag)
 * server-side, then passes plain serializable props to BoardConnected.
 *
 * Auth guard is applied at the proxy layer (board is not in PUBLIC_PATHS).
 * QueryProvider + Toaster are mounted at root (src/app/providers.tsx).
 */

import { getCurrentUser, toHeaderUser } from '@/features/auth/current-user'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { BoardConnected } from '@/features/board/components/board-connected'

export default async function BoardPage() {
  const user = await getCurrentUser()
  const isAdmin = user ? await getIsAdmin() : false
  const headerUser = toHeaderUser(user)

  return (
    <BoardConnected
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
    />
  )
}

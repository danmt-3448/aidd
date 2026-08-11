/**
 * /board — Sun* Kudos Live Board page.
 *
 * Server Component shell: resolves the caller's identity (session + admin flag)
 * server-side, then passes plain serializable props to BoardConnected.
 *
 * Auth guard is applied at the proxy layer (board is not in PUBLIC_PATHS).
 * QueryProvider + Toaster are mounted at root (src/app/providers.tsx).
 */

import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { BoardConnected } from '@/features/board/components/board-connected'

export default async function BoardPage() {
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
    <BoardConnected
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
    />
  )
}

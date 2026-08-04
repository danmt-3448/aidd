/**
 * /notifications — "Tất cả thông báo" full-screen page.
 *
 * MoMorph frame: 6-1LRz3vqr (full notification screen).
 * Server Component: resolves auth identity then delegates to NotificationsConnected.
 * Auth-guarded by middleware (/notifications is NOT in PUBLIC_PATHS).
 *
 * Pattern mirrors /board/page.tsx — server reads session once, passes serialisable
 * props to the client integration layer.
 */

import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { NotificationsConnected } from '@/features/notifications/notifications-connected'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  return (
    <NotificationsConnected
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
    />
  )
}

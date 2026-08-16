/**
 * /notifications — "Tất cả thông báo" full-screen page.
 *
 * MoMorph frame: 6-1LRz3vqr (full notification screen).
 * Server Component: resolves auth identity then delegates to NotificationsConnected.
 * Auth-guarded by proxy (/notifications is NOT in PUBLIC_PATHS).
 */

import { getCurrentUser, toHeaderUser } from '@/features/auth/current-user'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { NotificationsConnected } from '@/features/notifications/notifications-connected'

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  const isAdmin = user ? await getIsAdmin() : false
  const headerUser = toHeaderUser(user)

  return (
    <NotificationsConnected
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
    />
  )
}

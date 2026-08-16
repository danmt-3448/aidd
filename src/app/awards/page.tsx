import { getCurrentUser, toHeaderUser } from '@/features/auth/current-user'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { SiteHeader } from '@/components/site-header'
import { AwardsShowcase } from '@/features/awards/components'
import { AWARDS } from '@/features/awards/award-config'

/**
 * /awards — Hệ thống giải thưởng SAA 2025 page.
 *
 * Server Component: resolves session server-side to populate SiteHeader.
 * AWARDS content is static (imported from award-config.ts) — no DB query for awards data.
 *
 * force-static removed: the page needs request-time session resolution to show
 * the authenticated header state (bell, account menu). AWARDS data itself is still
 * compile-time static via the import; only the header auth state is dynamic.
 *
 * /awards is auth-guarded via proxy (not in PUBLIC_PATHS).
 */
export default async function AwardsPage() {
  const user = await getCurrentUser()
  const isAdmin = user ? await getIsAdmin() : false
  const headerUser = toHeaderUser(user)

  return (
    <div style={{ background: 'rgba(0,16,26,1)', minHeight: '100vh' }}>
      {/*
       * Site navigation — Figma zFYDgyj_pD shows the header above the awards content.
       * activeNav="awards" highlights the "Award Information" nav link.
       * unreadCount=0: notification polling is a client concern; awards does not fetch
       * it server-side to avoid the extra round-trip. The bell still renders.
       */}
      <SiteHeader
        user={headerUser}
        unreadCount={0}
        isAdmin={isAdmin}
        activeNav="awards"
      />
      <AwardsShowcase awards={AWARDS} />
    </div>
  )
}

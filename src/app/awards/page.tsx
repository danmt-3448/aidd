import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = user ? await getIsAdmin() : false

  // Header identity from OAuth session metadata — no extra profile query.
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

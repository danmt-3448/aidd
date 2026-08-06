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
 * Pattern mirrors /app/board/page.tsx — session read once, plain props to header.
 * /awards is auth-guarded via middleware (not in PUBLIC_PATHS).
 */
export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ ui_state?: string }>
}) {
  const { ui_state: uiState } = await searchParams

  // Dev-only UI-gate bypass: with `?ui_state=` present, render the header from a
  // mock identity and skip Supabase entirely, so /aidd-ui-gate can screenshot
  // /awards without local Supabase running (mirrors proxy.ts:26-31). Never in prod.
  const mockMode = process.env.NODE_ENV !== 'production' && Boolean(uiState)

  let headerUser: { name: string; avatarUrl?: string } | null = null
  let isAdmin = false

  if (mockMode) {
    // Awards is auth-guarded → reference state is logged-in. Figma header shows a
    // profile icon (no name text), so name falls back to the generic 'Sunner'.
    headerUser = { name: 'Sunner' }
  } else {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    isAdmin = user ? await getIsAdmin() : false

    // Header identity from OAuth session metadata — no extra profile query.
    headerUser = user
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
  }

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

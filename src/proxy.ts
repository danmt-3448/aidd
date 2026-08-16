import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPublic } from '@/features/auth/guard-rules'
import { isPreLaunch, isPostLaunch, isBypassPath } from '@/features/event/launch-gate'

/**
 * Proxy (Next.js 16 — kế nhiệm middleware): refresh session + pre-launch gate + route guard.
 *
 * Execution order:
 *   1. updateSession — refresh Supabase cookie-based session.
 *   2. Auth fast-path — logged-in on /login → /; unauthenticated on protected path → /login.
 *   3. Pre-launch gate — if now < event_start_at AND user is not admin → /countdown.
 *      - Bypass paths (/login, /auth, /dev-login) are never gated.
 *      - Unauthenticated users: cannot read event_config (RLS authenticated-only),
 *        so gate is skipped; the auth guard above redirects them to /login first.
 *      - Missing / invalid config: fail-open (no gate) to avoid total lockout.
 *   4. Post-launch /countdown lock — once the event has started, /countdown is a
 *      dead page: anyone landing there (nav, refresh, stale open tab) → /board.
 *      Only fires on a config we could read + parse (isPostLaunch); anon/null/
 *      invalid → fail-open so the pre-launch countdown stays visible.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // ------------------------------------------------------------------
  // Auth fast-path (cheap — decided from the session alone, NO DB query)
  // ------------------------------------------------------------------
  // "Chưa login → /login luôn, khỏi check gì thêm. Login rồi mới check."
  //   - logged in on /login  → send home.
  //   - NOT logged in + protected route → straight to /login WITHOUT touching
  //     the DB (event_config / profiles). This is the hot path for header link
  //     clicks, so it must not pay for the pre-launch queries.
  //   - NOT logged in + public route → fall through to the pre-launch gate so
  //     anonymous visitors on the landing page ('/') still get sent to
  //     /countdown before launch.
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  if (!user && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ------------------------------------------------------------------
  // event_config-dependent routing: pre-launch gate + post-launch /countdown lock.
  //   - /login, /auth, /dev-login: skipped entirely (no DB touch).
  //   - /countdown: NOT skipped here — it needs the config to decide whether the
  //     event has already started (→ /board) or is still pre-launch (→ stay).
  //   - everything else: the pre-launch gate.
  // event_config + is_admin run IN PARALLEL. is_admin only matters for the gate
  // branch, so it is fetched only when a session exists AND we are gating.
  // ------------------------------------------------------------------
  const isCountdownPath = pathname === '/countdown' || pathname.startsWith('/countdown/')
  const gated = !isBypassPath(pathname)

  if (isCountdownPath || gated) {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      },
    )

    const [eventResult, profileResult] = await Promise.all([
      supabase.from('event_config').select('event_start_at').eq('id', 1).maybeSingle(),
      user && gated
        ? supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    // Fail-open: a missing/unreadable config never locks everyone out.
    if (eventResult.error) console.error('[proxy:event_config]', eventResult.error.message)
    if (profileResult.error) console.error('[proxy:profiles]', profileResult.error.message)

    const eventStartAt = eventResult.data?.event_start_at ?? null

    // Post-launch lock: /countdown is meaningless once the event has started.
    // Only redirects on a config we could read + parse — anon RLS-blocked reads
    // (null) and malformed dates fail open so the pre-launch countdown stays live.
    if (isCountdownPath) {
      if (isPostLaunch(eventStartAt)) {
        return NextResponse.redirect(new URL('/board', request.url))
      }
      return response
    }

    // Pre-launch gate: not yet launched + not an admin → /countdown.
    const isAdmin = profileResult.data?.is_admin === true
    if (isPreLaunch(eventStartAt) && !isAdmin) {
      return NextResponse.redirect(new URL('/countdown', request.url))
    }
  }

  return response
}

export const config = {
  // Bỏ qua static assets + _next; chạy guard cho các route còn lại.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$).*)',
  ],
}

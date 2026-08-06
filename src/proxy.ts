import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPublic } from '@/features/auth/guard-rules'
import { isPreLaunch, isBypassPath } from '@/features/event/launch-gate'

/**
 * Proxy (Next.js 16 — kế nhiệm middleware): refresh session + pre-launch gate + route guard.
 *
 * Execution order:
 *   1. updateSession — refresh Supabase cookie-based session.
 *   2. Pre-launch gate — if now < event_start_at AND user is not admin → /countdown.
 *      - Bypass paths (/countdown, /login, /auth, /dev-login) are never gated.
 *      - Unauthenticated users: cannot read event_config (RLS authenticated-only),
 *        so gate is skipped; the auth guard below then redirects them to /login.
 *      - Missing / invalid config: fail-open (no gate) to avoid total lockout.
 *   3. Auth guard — logged-in on /login → /; unauthenticated on protected path → /login.
 */
export async function proxy(request: NextRequest) {
  // ------------------------------------------------------------------
  // Dev-only UI-gate bypass
  // ------------------------------------------------------------------
  // `?ui_state=full|empty|error|loading` makes board-connected render from
  // board-mock.ts without Supabase (see board-connected). Let those requests
  // through before session/gate/auth so /aidd-ui-gate can render mock screens
  // with no local Supabase running. Query-param + dev-gated → never in prod.
  if (
    process.env.NODE_ENV !== 'production' &&
    request.nextUrl.searchParams.has('ui_state')
  ) {
    return NextResponse.next()
  }

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
  // Pre-launch gate — only reached when logged in, or anonymous on a public
  // path. event_config + is_admin run IN PARALLEL (was 2 sequential queries).
  // Bypass paths (/countdown, /login, /auth, /dev-login) are never gated.
  // ------------------------------------------------------------------
  if (!isBypassPath(pathname)) {
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

    // Parallelise: pre-launch date + admin flag are independent lookups.
    // is_admin only matters when a session exists (admins bypass the gate).
    const [eventResult, profileResult] = await Promise.all([
      supabase.from('event_config').select('event_start_at').eq('id', 1).maybeSingle(),
      user
        ? supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    // Fail-open: a missing/unreadable config never locks everyone out.
    if (eventResult.error) console.error('[proxy:event_config]', eventResult.error.message)
    if (profileResult.error) console.error('[proxy:profiles]', profileResult.error.message)

    const eventStartAt = eventResult.data?.event_start_at ?? null
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

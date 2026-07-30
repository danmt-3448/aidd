import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPublic } from '@/features/auth/guard-rules'

/**
 * Proxy (Next.js 16 — kế nhiệm middleware): refresh session Supabase + route guard.
 * - Đã đăng nhập mà vào /login → /todo.
 * - Chưa đăng nhập mà vào route protected → /login.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/todo', request.url))
  }

  if (!user && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  // Bỏ qua static assets + _next; chạy guard cho các route còn lại.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

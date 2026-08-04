/**
 * Guard helpers thuần (không phụ thuộc Next) — tách riêng để unit-test dễ và
 * tái dùng cho proxy (route guard) lẫn auth callback.
 */

/**
 * Route công khai (không cần đăng nhập).
 *
 * '/' — Homepage SAA is public per clarification 2026-08-04:
 *   "Public view cho unauthenticated (test ID-0); phần cá nhân (bell + account
 *   menu) chỉ render khi đã đăng nhập."
 *
 * '/awards' and '/rules' are auth-guarded per phase-15 — NOT listed here.
 */
export const PUBLIC_PATHS = ['/', '/login', '/auth', '/dev-login'] as const

export function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Chống open-redirect: chỉ path nội bộ bắt đầu bằng "/" (không "//"), mặc định /todo. */
export function sanitizeNext(next: string | null | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/todo'
}

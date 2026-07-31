/**
 * Guard helpers thuần (không phụ thuộc Next) — tách riêng để unit-test dễ và
 * tái dùng cho proxy (route guard) lẫn auth callback.
 */

/** Route công khai (không cần đăng nhập). */
export const PUBLIC_PATHS = ['/login', '/auth', '/dev-login'] as const

export function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Chống open-redirect: chỉ path nội bộ bắt đầu bằng "/" (không "//"), mặc định /todo. */
export function sanitizeNext(next: string | null | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/todo'
}

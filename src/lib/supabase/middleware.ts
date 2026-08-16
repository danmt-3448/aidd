import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresh Supabase session trong middleware và trả về response + user hiện tại.
 * Route guard (src/middleware.ts) dựa trên `user` để điều hướng.
 * Lưu ý: luôn trả `response` (đã đồng bộ cookie) để session không bị mất.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Xác thực bằng getClaims(): với token ES256 (asymmetric signing keys — dự án này dùng,
  // xác nhận qua JWKS) getClaims verify chữ ký CỤC BỘ, KHÔNG round-trip /auth/v1/user mỗi
  // request. getUser() (cách cũ) tốn ~40–130ms mạng MỖI nav — đo được ở
  // plans/260816-1017-optimize-nav-latency/reports/baseline-260816-prod-nav.md.
  //
  // Token refresh do NHÁNH FALLBACK getUser() lo — KHÔNG phải getClaims. (@supabase/ssr chỉ
  // auto-refresh + rotate cookie qua callback setAll khi gọi getUser(), KHÔNG khi getSession/
  // getClaims.) Vì vậy CHỈ nhận claims khi token CÒN HẠN (exp > now): token hết hạn, getClaims
  // lỗi, hoặc thiếu sub → rơi xuống getUser() để vừa refresh vừa xác thực đầy đủ. Worst case
  // luôn = hành vi cũ (getUser), không bao giờ kém an toàn hơn.
  // Lưu ý: getClaims verify signature+exp cục bộ nên KHÔNG phát hiện user bị ban/revoke giữa
  // vòng đời token (≤ token TTL). Chấp nhận được cho guard chỉ gate navigation + đọc is_admin.
  let user: { id: string } | null = null
  const nowS = Math.floor(Date.now() / 1000)
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claimsError && claims?.sub && typeof claims.exp === 'number' && claims.exp > nowS) {
    user = { id: claims.sub }
  } else {
    const {
      data: { user: fullUser },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) console.error('[middleware:getUser-fallback]', userError.message)
    user = fullUser ? { id: fullUser.id } : null
  }

  return { response, user }
}

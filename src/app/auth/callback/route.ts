import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNext } from '@/features/auth/guard-rules'

/**
 * OAuth callback: đổi `code` (Google) lấy session rồi redirect vào app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Thiếu code hoặc exchange lỗi → quay lại login kèm cờ lỗi.
  return NextResponse.redirect(`${origin}/login?error=1`)
}

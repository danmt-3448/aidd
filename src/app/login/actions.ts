'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function callbackUrl() {
  const h = await headers()
  const origin = h.get('origin') ?? `http://${h.get('host') ?? '127.0.0.1:3000'}`
  return `${origin}/auth/callback`
}

/**
 * Sign-in chính (đúng design): khởi tạo OAuth Google, redirect trình duyệt
 * sang trang consent của Google. Lỗi → về /login?error=1.
 */
export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: await callbackUrl() },
  })

  if (error || !data?.url) {
    redirect('/login?error=1')
  }
  redirect(data.url)
}

/**
 * Dev fallback (email + password) — KHÔNG có trong UI production, gọi từ /dev-login.
 * Gated bằng env NEXT_PUBLIC_ENABLE_DEV_LOGIN; chỉ để test local với seeded users
 * (seed đặt sẵn password 'TestPass123!'). Session cookie set qua Supabase SSR client.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return { error: null }

  // Local fallback: nếu chưa có account (seeded users không login được qua GoTrue,
  // hoặc DB mới reset), tạo mới. Local có enable_confirmations=false → signUp trả
  // session ngay. Giúp /dev-login "just works" sau mỗi supabase db reset.
  const { error: signUpError } = await supabase.auth.signUp({ email, password })
  return { error: signUpError?.message ?? null }
}

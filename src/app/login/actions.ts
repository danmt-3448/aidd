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
 * Dev fallback (magic-link) — KHÔNG có trong UI production, gọi từ /dev-login.
 * Email bắt ở Mailpit local (http://127.0.0.1:54324).
 */
export async function signInWithOtp(email: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl() },
  })
  return { error: error?.message ?? null }
}

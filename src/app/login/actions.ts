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

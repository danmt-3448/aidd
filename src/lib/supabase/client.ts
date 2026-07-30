import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client cho Client Components (browser).
 * Chỉ dùng NEXT_PUBLIC_* — an toàn expose ra client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

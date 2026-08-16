import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/** Header identity view-model derived from OAuth session metadata. */
export interface HeaderUser {
  name: string
  avatarUrl: string | undefined
}

/**
 * Per-request cached resolver for the authenticated user.
 *
 * React `cache()` dedupes `getUser()` across ALL call sites within ONE server
 * render: a page server component + `getIsAdmin()` previously issued two separate
 * `getUser()` network round-trips per render — now they share a single call.
 * The cache is scoped to the request (never leaks between users or requests).
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/** Map a Supabase user to the SiteHeader identity shape (null when signed out). */
export function toHeaderUser(user: User | null): HeaderUser | null {
  if (!user) return null
  return {
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      'Sunner',
    avatarUrl:
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined),
  }
}

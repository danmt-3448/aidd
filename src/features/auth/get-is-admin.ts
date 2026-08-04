'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Returns whether the calling user has `is_admin = true` in their profile.
 *
 * - Returns `false` for unauthenticated callers (no error thrown — callers
 *   treat false as "not admin" and hide admin-only UI accordingly).
 * - Reads only the `is_admin` column to keep the query tight.
 * - Safe to call from Server Components, Route Handlers, and Server Actions.
 */
export async function getIsAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (error) {
    // Log server-side only — callers never see Postgres errors.
    console.error('[getIsAdmin]', error.message)
    return false
  }

  return data?.is_admin === true
}

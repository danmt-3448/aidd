'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './current-user'

/**
 * Returns whether the calling user has `is_admin = true` in their profile.
 *
 * - Returns `false` for unauthenticated callers (no error thrown — callers
 *   treat false as "not admin" and hide admin-only UI accordingly).
 * - Reads only the `is_admin` column to keep the query tight.
 * - Safe to call from Server Components, Route Handlers, and Server Actions.
 */
export async function getIsAdmin(): Promise<boolean> {
  // Shared per-request user resolver — dedupes getUser() with the calling page.
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
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

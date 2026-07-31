'use server'

import { createClient } from '@/lib/supabase/server'

export interface RecipientResult {
  id: string
  full_name: string
  avatar_url: string | null
}

/**
 * Full-text autocomplete on profiles.full_name.
 * Excludes the currently authenticated user.
 * Returns at most 10 matches.
 */
export async function searchRecipients(
  query: string,
): Promise<RecipientResult[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .ilike('full_name', `%${trimmed}%`)
    .neq('id', user.id)
    .limit(10)

  if (error) {
    console.error('[searchRecipients]', error.message)
    return []
  }

  return (data ?? []) as RecipientResult[]
}

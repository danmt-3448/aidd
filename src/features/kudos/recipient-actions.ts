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
 *
 * When `query` is empty (picker opened before typing), returns the first 20
 * users alphabetically so the dropdown shows ready suggestions on first focus.
 * Typed queries (non-empty) use ILIKE and return up to 10 matches.
 */
export async function searchRecipients(
  query: string,
): Promise<RecipientResult[]> {
  const trimmed = query.trim()

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  if (trimmed.length === 0) {
    // Empty focus — return first 20 users (alphabetical) as suggestions.
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .neq('id', user.id)
      .order('full_name', { ascending: true })
      .limit(20)

    if (error) {
      console.error('[searchRecipients] default list', error.message)
      return []
    }

    return (data ?? []) as RecipientResult[]
  }

  // Typed query — ILIKE search.
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

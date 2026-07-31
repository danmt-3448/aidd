'use server'

import { createClient } from '@/lib/supabase/server'

export interface HashtagResult {
  id: string
  name: string
}

/**
 * Returns the full hashtag catalog, optionally filtered by name prefix.
 * Used to populate the hashtag dropdown in the Viết Kudo modal.
 */
export async function listHashtags(query?: string): Promise<HashtagResult[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  let builder = supabase
    .from('hashtags')
    .select('id, name')
    .order('name', { ascending: true })

  if (query && query.trim().length > 0) {
    builder = builder.ilike('name', `%${query.trim()}%`)
  }

  const { data, error } = await builder

  if (error) {
    console.error('[listHashtags]', error.message)
    return []
  }

  return (data ?? []) as HashtagResult[]
}

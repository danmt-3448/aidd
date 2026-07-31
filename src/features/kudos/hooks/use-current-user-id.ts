'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Returns the current authenticated user's ID, or '' while auth resolves.
 * Use `disabled={!userId}` on image upload to prevent uploads before auth.
 */
export function useCurrentUserId(): string {
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setUserId(data.user.id)
      })
  }, [])

  return userId
}

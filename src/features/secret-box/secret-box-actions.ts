'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OpenedBadge {
  badgeKey: string
  openedAt: string
}

export interface SecretBoxState {
  unopened: number
  opened: OpenedBadge[]
}

export interface OpenSecretBoxSuccess {
  data: { badgeKey: string; remaining: number }
}

export interface OpenSecretBoxFailure {
  error: string
}

export type OpenSecretBoxResult = OpenSecretBoxSuccess | OpenSecretBoxFailure

// ---------------------------------------------------------------------------
// Map RPC SQLSTATE codes → friendly Vietnamese messages.
// PostgREST puts the raised errcode in `error.code`, not `error.message`.
// Raw Postgres error strings must never reach the client.
// ---------------------------------------------------------------------------

function friendlyRpcError(err: { code?: string }): string {
  if (err.code === 'P0101') return 'Bạn cần đăng nhập để mở Secret Box'
  if (err.code === 'P0102') return 'Bạn không có Secret Box nào để mở'
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

// ---------------------------------------------------------------------------
// getSecretBoxState — reads caller's count + badge history
// ---------------------------------------------------------------------------

export async function getSecretBoxState(): Promise<
  { data: SecretBoxState } | { error: string }
> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Bạn cần đăng nhập để xem Secret Box' }
  }

  // Fetch both in parallel — independent queries.
  const [boxResult, badgesResult] = await Promise.all([
    supabase
      .from('secret_box')
      .select('unopened_box_count')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('secret_box_badges')
      .select('badge_key, opened_at')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false }),
  ])

  if (boxResult.error) {
    console.error('[getSecretBoxState] box query error', boxResult.error.message)
    return { error: 'Đã xảy ra lỗi khi tải thông tin Secret Box' }
  }

  if (badgesResult.error) {
    console.error('[getSecretBoxState] badges query error', badgesResult.error.message)
    return { error: 'Đã xảy ra lỗi khi tải danh sách huy hiệu' }
  }

  return {
    data: {
      unopened: boxResult.data?.unopened_box_count ?? 0,
      opened: (badgesResult.data ?? []).map((row) => ({
        badgeKey: row.badge_key,
        openedAt: row.opened_at,
      })),
    },
  }
}

// ---------------------------------------------------------------------------
// openSecretBox — calls the DEFINER RPC, returns typed result
// ---------------------------------------------------------------------------

export async function openSecretBox(): Promise<OpenSecretBoxResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Bạn cần đăng nhập để mở Secret Box' }
  }

  const { data, error } = await supabase.rpc('open_secret_box')

  if (error) {
    console.error('[openSecretBox] RPC error', error.code, error.message)
    return { error: friendlyRpcError(error) }
  }

  // RPC returns JSON: { badge_key: string, remaining: number }
  const rpcData = data as { badge_key: string; remaining: number }

  revalidatePath('/secret-box')

  return {
    data: {
      badgeKey: rpcData.badge_key,
      remaining: rpcData.remaining,
    },
  }
}

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Notification type — shared contract between actions and the client hook.
// Columns: id, user_id, type, title, body, link, is_read, created_at
// ---------------------------------------------------------------------------

export interface Notification {
  id: string
  user_id: string
  /** Nullable; phase-01 schema allows null. */
  type: string | null
  title: string | null
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid({ message: 'id phải là UUID hợp lệ' })

const listSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveUid(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

export type UnreadCountResult = { data: number } | { error: string }

/**
 * Returns the number of unread notifications for the calling user.
 * Returns 0 (not an error) for unauthenticated callers so the bell renders
 * with a zero badge rather than blowing up.
 */
export async function getUnreadCount(): Promise<UnreadCountResult> {
  const uid = await resolveUid()
  if (!uid) return { data: 0 }

  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_read', false)

    if (error) {
      console.error('[getUnreadCount]', error.message)
      return { error: 'Không thể tải thông báo. Vui lòng thử lại.' }
    }

    return { data: count ?? 0 }
  } catch (err) {
    console.error('[getUnreadCount] unexpected', err)
    return { error: 'Không thể tải thông báo. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// listNotifications
// ---------------------------------------------------------------------------

export type ListNotificationsResult =
  | { data: Notification[] }
  | { error: string }

/**
 * Returns the most recent notifications for the calling user, newest first.
 */
export async function listNotifications(
  opts: { limit?: number } = {},
): Promise<ListNotificationsResult> {
  const uid = await resolveUid()
  if (!uid) return { data: [] }

  const parsed = listSchema.safeParse({ limit: opts.limit ?? 20 })
  if (!parsed.success) {
    return { error: 'Tham số limit không hợp lệ.' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, link, is_read, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit)

    if (error) {
      console.error('[listNotifications]', error.message)
      return { error: 'Không thể tải thông báo. Vui lòng thử lại.' }
    }

    return { data: (data ?? []) as Notification[] }
  } catch (err) {
    console.error('[listNotifications] unexpected', err)
    return { error: 'Không thể tải thông báo. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// markRead
// ---------------------------------------------------------------------------

export type MarkReadResult = { ok: true } | { error: string }

/**
 * Marks a single notification as read. Only the owning user's row is touched
 * (RLS enforces this at DB level; we also validate ownership via user_id filter).
 */
export async function markRead(id: string): Promise<MarkReadResult> {
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) {
    return { error: idParsed.error.issues[0]?.message ?? 'id không hợp lệ' }
  }

  const uid = await resolveUid()
  if (!uid) return { error: 'Bạn cần đăng nhập.' }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', idParsed.data)
      .eq('user_id', uid) // belt-and-suspenders on top of RLS

    if (error) {
      console.error('[markRead]', error.message)
      return { error: 'Không thể cập nhật thông báo. Vui lòng thử lại.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('[markRead] unexpected', err)
    return { error: 'Không thể cập nhật thông báo. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// markAllRead
// ---------------------------------------------------------------------------

/**
 * Marks ALL unread notifications for the calling user as read.
 */
export async function markAllRead(): Promise<MarkReadResult> {
  const uid = await resolveUid()
  if (!uid) return { error: 'Bạn cần đăng nhập.' }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', uid)
      .eq('is_read', false)

    if (error) {
      console.error('[markAllRead]', error.message)
      return { error: 'Không thể cập nhật thông báo. Vui lòng thử lại.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('[markAllRead] unexpected', err)
    return { error: 'Không thể cập nhật thông báo. Vui lòng thử lại.' }
  }
}

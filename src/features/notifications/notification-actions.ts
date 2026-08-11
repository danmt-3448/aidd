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
// Cursor type — composite (created_at, id) for stable keyset pagination.
// Mirrors the board feed pattern (board-queries.ts).
// ---------------------------------------------------------------------------

export interface NotificationCursor {
  createdAt: string
  id: string
}

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

// .guid() accepts any 8-4-4-4-12 hex UUID (version-0 seed ids, v4 prod ids).
// .uuid() in Zod v4 enforces RFC version/variant bytes and rejects seed UUIDs.
const uuidSchema = z.string().guid({ message: 'id phải là UUID hợp lệ' })

const listSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z
    .object({
      createdAt: z.string().datetime({ message: 'cursor.createdAt phải là ISO8601 hợp lệ' }),
      id: z.string().guid({ message: 'cursor.id phải là UUID hợp lệ' }),
    })
    .nullable()
    .optional(),
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
  | { data: Notification[]; nextCursor: NotificationCursor | null }
  | { error: string }

/**
 * Returns the most recent notifications for the calling user, newest first.
 * Supports keyset pagination via `cursor` (created_at, id) — same pattern as
 * listBoardKudos. When cursor is absent the first page is returned.
 */
export async function listNotifications(
  opts: { limit?: number; cursor?: NotificationCursor | null } = {},
): Promise<ListNotificationsResult> {
  const uid = await resolveUid()
  if (!uid) return { data: [], nextCursor: null }

  const parsed = listSchema.safeParse({
    limit: opts.limit ?? 20,
    cursor: opts.cursor ?? null,
  })
  if (!parsed.success) {
    return { error: 'Tham số không hợp lệ.' }
  }

  try {
    const supabase = await createClient()
    const { limit, cursor } = parsed.data

    let query = supabase
      .from('notifications')
      .select('id, user_id, type, title, body, link, is_read, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1) // fetch one extra to detect next page

    // Apply keyset cursor — rows older than (createdAt, id).
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('[listNotifications]', error.message)
      return { error: 'Không thể tải thông báo. Vui lòng thử lại.' }
    }

    const rows = (data ?? []) as Notification[]
    const hasNext = rows.length > limit
    const page = hasNext ? rows.slice(0, limit) : rows

    const lastRow = page[page.length - 1]
    const nextCursor: NotificationCursor | null =
      hasNext && lastRow
        ? { createdAt: lastRow.created_at, id: lastRow.id }
        : null

    return { data: page, nextCursor }
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

'use server'

import sanitizeHtml from 'sanitize-html'
import { createClient } from '@/lib/supabase/server'
import {
  createKudoSchema, type CreateKudoInput,
  updateKudoSchema, type UpdateKudoInput,
} from './kudo-schema'

// ---------------------------------------------------------------------------
// sanitize-html allowlist for content_html (Tiptap output)
// Permitted: bold, italic, strike, ordered/unordered list, link, blockquote,
//            paragraph, line-break, and @mention spans.
// ---------------------------------------------------------------------------

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br',
    'strong', 'em', 's',
    'ul', 'ol', 'li',
    'a',
    'blockquote',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    // @mention spans carry data-type="mention" + data-id
    span: ['data-type', 'data-id', 'class'],
  },
  allowedSchemes: ['https', 'http', 'mailto'],
  // Force safe rel on links added by users
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  },
}

function sanitize(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS)
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export type CreateKudoSuccess = { ok: true; kudoId: string }
export type CreateKudoFailure = { ok: false; errors: Record<string, string[]> }
export type CreateKudoResult = CreateKudoSuccess | CreateKudoFailure

// ---------------------------------------------------------------------------
// Map RPC SQLSTATE codes to user-friendly Vietnamese messages.
// Raw Postgres error strings must never reach the client.
// ---------------------------------------------------------------------------

function friendlyRpcError(msg: string): string {
  if (msg.includes('P0001')) return 'Bạn cần đăng nhập để gửi Kudo'
  if (msg.includes('P0002')) return 'Không thể gửi Kudo cho chính mình'
  if (msg.includes('P0003') || msg.includes('P0004')) return 'Hashtag không hợp lệ'
  if (msg.includes('P0005') || msg.includes('P0006')) return 'Tối đa 5 ảnh'
  if (msg.includes('P0007')) return 'Người nhận không tồn tại'
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

// ---------------------------------------------------------------------------
// createKudo — main server action
// ---------------------------------------------------------------------------

export async function createKudo(input: CreateKudoInput): Promise<CreateKudoResult> {
  // 1. Auth guard
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      errors: { _root: ['Bạn cần đăng nhập để gửi Kudo'] },
    }
  }

  // 2. Zod validation
  const parsed = createKudoSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const [field, messages] of Object.entries(
      parsed.error.flatten().fieldErrors,
    )) {
      fieldErrors[field] = messages as string[]
    }
    return { ok: false, errors: fieldErrors }
  }

  const {
    kudoId,
    receiverId,
    contentHtml,
    hashtagIds,
    imagePaths,
    isAnonymous,
    anonymousName,
    danhHieu,
  } = parsed.data

  // 3. Receiver must differ from sender (belt-and-suspenders; RPC also checks)
  if (receiverId === user.id) {
    return {
      ok: false,
      errors: { receiverId: ['Không thể gửi Kudo cho chính mình'] },
    }
  }

  // 4. Sanitize HTML server-side (stored-XSS prevention)
  const safeHtml = sanitize(contentHtml)

  // 5. Call atomic RPC (inserts kudos + kudo_hashtags + kudo_images in 1 tx)
  const { data, error } = await supabase.rpc('create_kudo', {
    p_kudo_id: kudoId,
    p_receiver_id: receiverId,
    p_content_html: safeHtml,
    p_is_anonymous: isAnonymous,
    p_anonymous_name: anonymousName ?? null,
    p_hashtag_ids: hashtagIds,
    p_image_paths: imagePaths,
    p_danh_hieu: danhHieu ?? null,
  })

  if (error) {
    console.error('[createKudo] RPC error', error.message)
    // Orphan-image cleanup: images were uploaded to Storage BEFORE this RPC.
    // If the insert failed they would dangle — best-effort remove, never throw
    // (a cleanup failure must not mask the original error).
    if (imagePaths.length > 0) {
      const { error: rmErr } = await supabase.storage
        .from('kudo-images')
        .remove(imagePaths)
      if (rmErr) console.warn('[createKudo] orphan-image cleanup', rmErr.message)
    }
    // Route the receiver-not-found (P0007) error to the field; others to root.
    const field = error.message.includes('P0007') ? 'receiverId' : '_root'
    return {
      ok: false,
      errors: { [field]: [friendlyRpcError(error.message)] },
    }
  }

  return { ok: true, kudoId: data as string }
}

// ---------------------------------------------------------------------------
// updateKudo — edit own kudo (sender only)
// ---------------------------------------------------------------------------

export type UpdateKudoSuccess = { ok: true }
export type UpdateKudoFailure = { ok: false; errors: Record<string, string[]> }
export type UpdateKudoResult  = UpdateKudoSuccess | UpdateKudoFailure

function friendlyUpdateError(msg: string): string {
  if (msg.includes('P0001')) return 'Bạn cần đăng nhập để sửa Kudo'
  if (msg.includes('P0009')) return 'Bạn chỉ sửa được Kudo của mình'
  if (msg.includes('P0003') || msg.includes('P0004')) return 'Hashtag không hợp lệ'
  if (msg.includes('P0005')) return 'Tối đa 5 ảnh'
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

export async function updateKudo(input: UpdateKudoInput): Promise<UpdateKudoResult> {
  // 1. Auth guard
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      errors: { _root: ['Bạn cần đăng nhập để sửa Kudo'] },
    }
  }

  // 2. Zod validation
  const parsed = updateKudoSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const [field, messages] of Object.entries(
      parsed.error.flatten().fieldErrors,
    )) {
      fieldErrors[field] = messages as string[]
    }
    return { ok: false, errors: fieldErrors }
  }

  const { kudoId, contentHtml, danhHieu, hashtagIds, imagePaths } = parsed.data

  // 3. Sanitize HTML server-side (stored-XSS prevention)
  const safeHtml = sanitize(contentHtml)

  // 4. Call atomic RPC (updates kudos + replaces kudo_hashtags + kudo_images in 1 tx)
  const { error } = await supabase.rpc('update_kudo', {
    p_kudo_id:      kudoId,
    p_content_html: safeHtml,
    p_danh_hieu:    danhHieu,
    p_hashtag_ids:  hashtagIds,
    p_image_paths:  imagePaths,
  })

  if (error) {
    console.error('[updateKudo] RPC error', error.message)
    return {
      ok: false,
      errors: { _root: [friendlyUpdateError(error.message)] },
    }
  }

  return { ok: true }
}

// ---------------------------------------------------------------------------
// getKudoForEdit — fetch an own kudo's editable fields (sender only)
// ---------------------------------------------------------------------------

export interface KudoEditData {
  contentHtml: string
  danhHieu: string
  hashtagIds: string[]
  imagePaths: string[]
  receiverId: string
  receiverName: string
}

export type GetKudoForEditResult =
  | { ok: true; data: KudoEditData }
  | { ok: false; error: string }

export async function getKudoForEdit(kudoId: string): Promise<GetKudoForEditResult> {
  if (!kudoId) return { ok: false, error: 'kudoId bắt buộc' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false, error: 'Bạn cần đăng nhập để sửa Kudo' }
  }

  // Fetch the kudo row — RLS ensures only own row is visible; we also check
  // sender_id explicitly so we can return a specific "not your kudo" message.
  const { data: kudo, error: kudoErr } = await supabase
    .from('kudos')
    .select(`
      id,
      sender_id,
      receiver_id,
      content_html,
      danh_hieu,
      receiver:profiles!kudos_receiver_id_fkey (full_name)
    `)
    .eq('id', kudoId)
    .eq('sender_id', user.id)
    .single()

  if (kudoErr || !kudo) {
    return { ok: false, error: 'Không tìm thấy Kudo hoặc bạn không có quyền sửa' }
  }

  // Fetch hashtag IDs
  const { data: hashtagRows } = await supabase
    .from('kudo_hashtags')
    .select('hashtag_id')
    .eq('kudo_id', kudoId)

  // Fetch image paths (ordered by sort_order)
  const { data: imageRows } = await supabase
    .from('kudo_images')
    .select('storage_path')
    .eq('kudo_id', kudoId)
    .order('sort_order', { ascending: true })

  // Receiver name comes from the join — profiles may return array or object
  // depending on the Supabase JS client version. Normalise safely.
  const receiverProfile = kudo.receiver
  const receiverName = Array.isArray(receiverProfile)
    ? (receiverProfile[0]?.full_name ?? '')
    : ((receiverProfile as { full_name: string } | null)?.full_name ?? '')

  return {
    ok: true,
    data: {
      contentHtml: kudo.content_html ?? '',
      danhHieu: kudo.danh_hieu ?? '',
      hashtagIds: (hashtagRows ?? []).map((r) => r.hashtag_id),
      imagePaths: (imageRows ?? []).map((r) => r.storage_path),
      receiverId: kudo.receiver_id,
      receiverName,
    },
  }
}

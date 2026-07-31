'use server'

import sanitizeHtml from 'sanitize-html'
import { createClient } from '@/lib/supabase/server'
import { createKudoSchema, type CreateKudoInput } from './kudo-schema'

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
  })

  if (error) {
    console.error('[createKudo] RPC error', error.message)
    return {
      ok: false,
      errors: { _root: [friendlyRpcError(error.message)] },
    }
  }

  return { ok: true, kudoId: data as string }
}

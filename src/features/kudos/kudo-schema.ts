import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// RFC 4122 UUID — any variant/version (not restricted to v4 so seed UUIDs pass)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Strips all HTML tags and returns plain text, used for length validation. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Constituent field schemas (reused by form and server action)
// ---------------------------------------------------------------------------

export const receiverIdSchema = z
  .string()
  .regex(UUID_REGEX, 'receiverId must be a valid UUID')

export const kudoIdSchema = z
  .string()
  .regex(UUID_REGEX, 'kudoId must be a valid UUID')

export const contentHtmlSchema = z
  .string()
  .min(1, 'Nội dung không được để trống')
  .refine(
    (html) => stripHtml(html).length >= 1,
    'Nội dung không được để trống',
  )
  .refine(
    (html) => stripHtml(html).length <= 2000,
    'Nội dung tối đa 2000 ký tự',
  )

export const hashtagIdsSchema = z
  .array(z.string().regex(UUID_REGEX, 'hashtagId must be a valid UUID'))
  .min(1, 'Chọn ít nhất 1 hashtag')
  .max(5, 'Tối đa 5 hashtag')

export const imagePathsSchema = z
  .array(z.string().min(1))
  .max(5, 'Tối đa 5 ảnh')
  .default([])

export const isAnonymousSchema = z.boolean().default(false)

export const anonymousNameSchema = z.string().max(100).optional()

// "Danh hiệu" — a title/honour the sender bestows on the receiver.
// Required by the Viết Kudo modal (MoMorph screen ihQ26W78P2); persisted via
// the create_kudo RPC p_danh_hieu parameter (migration 20260804010000).
// Phase-08 adds the UI field; the server action passes p_danh_hieu to the RPC.
export const danhHieuSchema = z
  .string()
  .min(1, 'Danh hiệu không được để trống')
  .max(200, 'Danh hiệu tối đa 200 ký tự')

// ---------------------------------------------------------------------------
// Full create-kudo input schema (used by server action + client mutation)
// ---------------------------------------------------------------------------

export const createKudoSchema = z
  .object({
    kudoId: kudoIdSchema,
    receiverId: receiverIdSchema,
    contentHtml: contentHtmlSchema,
    hashtagIds: hashtagIdsSchema,
    imagePaths: imagePathsSchema,
    isAnonymous: isAnonymousSchema,
    anonymousName: anonymousNameSchema,
    danhHieu: danhHieuSchema,
  })
  .refine(
    (data) => !(data.isAnonymous && data.anonymousName !== undefined && data.anonymousName.length === 0),
    {
      message: 'anonymousName must not be an empty string when isAnonymous is true',
      path: ['anonymousName'],
    },
  )

export type CreateKudoInput = z.infer<typeof createKudoSchema>

// ---------------------------------------------------------------------------
// Update-kudo input schema
// Receiver cannot change — only content, danh_hieu, hashtags, and images.
// ---------------------------------------------------------------------------

export const updateKudoSchema = z.object({
  kudoId:      kudoIdSchema,
  contentHtml: contentHtmlSchema,
  danhHieu:    danhHieuSchema,
  hashtagIds:  hashtagIdsSchema,
  imagePaths:  imagePathsSchema,
})

export type UpdateKudoInput = z.infer<typeof updateKudoSchema>

// ---------------------------------------------------------------------------
// Helper: count plain-text characters for UI counter
// ---------------------------------------------------------------------------

export function countContentChars(html: string): number {
  return stripHtml(html).length
}
